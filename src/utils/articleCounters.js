export const articleDayKey = value => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time + 330 * 60000).toISOString().slice(0, 10) : 'unknown';
};

// News alone consumes a counter position. Deduplicate IDs, use IST days,
// and reconcile older page snapshots with the complete loaded day.
export const articleCounters = (items, {today, unread = false, unreadCount = 0, overlay = false} = {}) => {
  const groups = new Map(), result = new Map();
  for (const item of items) {
    if (item.type && item.type !== 'NEWS') continue;
    const data = item.data || item;
    if (!data._id || result.has(data._id)) continue;
    const day = articleDayKey(data.published_at);
    const group = groups.get(day) || {ids: [], total: 0, pins: 0, legacy: 0};
    group.ids.push(data._id);
    if (data.is_feed_pinned) group.pins++;
    if (!overlay && !unread) {
      group.total = Math.max(group.total, Number(item._news_totals_by_day?.[day]) || 0);
      group.legacy = Math.max(group.legacy, Number(day === today ? item._batch_today_total : item._batch_total) || 0);
    }
    groups.set(day, group);
    result.set(data._id, {index: group.ids.length});
  }
  for (const group of groups.values()) {
    const total = unread ? Math.max(group.ids.length, unreadCount) : Math.max(group.ids.length, group.total || group.legacy + group.pins);
    group.ids.forEach(id => { result.get(id).total = total; });
  }
  return result;
};
