import {articleCounters, articleDayKey} from '../src/utils/articleCounters';
const date='2026-10-08T06:00:00Z',day='2026-10-08';
const news=(id,pin=false,total=148)=>({type:'NEWS',data:{_id:id,published_at:date,is_feed_pinned:pin},_batch_today_total:total});
test('148 normal articles and two pins show 150 of 150',()=>{
 const items=Array.from({length:148},(_,i)=>news(String(i)));items.unshift(news('pin1',true),news('pin2',true));
 const counters=articleCounters(items,{today:day});expect(counters.get('147')).toEqual({index:150,total:150});
});
test('server day totals include unloaded pins; ads, surveys and duplicates do not consume positions',()=>{
 const item={...news('first'),_news_totals_by_day:{[day]:150}};
 const counters=articleCounters([item,item,{type:'AD',data:{_id:'ad'}},{type:'SURVEY',data:{_id:'survey'}},news('next')],{today:day});
 expect(counters.get('next')).toEqual({index:2,total:150});expect(counters.size).toBe(2);
});
test('IST day boundary and per-day counts stay separate',()=>{
 expect(articleDayKey('2026-10-07T19:00:00Z')).toBe(day);
 const previous={...news('yesterday'),data:{_id:'yesterday',published_at:'2026-10-07T06:00:00Z'},_batch_total:10};
 expect(articleCounters([news('today'),previous],{today:day}).get('yesterday')).toEqual({index:1,total:10});
});
test('stale totals cannot be smaller than the unique loaded day; overlays use their own totals',()=>{
 const items=[news('a',false,1),news('b',false,1)];
 expect(articleCounters(items,{today:day}).get('b')).toEqual({index:2,total:2});
 expect(articleCounters([news('a')],{today:day,overlay:true}).get('a').total).toBe(1);
});
