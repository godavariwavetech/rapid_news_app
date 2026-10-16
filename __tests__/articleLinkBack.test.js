import reducer, { fetchArticleById, fetchNews } from '../src/redux/reducers/news';
jest.mock('../src/utils/api', () => ({ get: jest.fn() }));
jest.mock('react-native-device-info', () => ({ getUniqueId: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('react-native-fast-image', () => ({ preload: jest.fn() }));
const source = { type: 'NEWS', data: { _id: 'source' } };
const target = { type: 'NEWS', data: { _id: 'target' } };
test('linked article fetch preserves the source feed for Back navigation', () => {
  const initial = { ...reducer(undefined, { type: '@@init' }), articles: [source], notificationArticle: null };
  const next = reducer(initial, fetchArticleById.fulfilled(target, 'request', { id: 'target', addToFeed: false }));
  expect(next.articles).toEqual([source]);
  expect(next.notificationArticle).toBeNull();
});
test('notification article fetch keeps its existing feed insertion behavior', () => {
  const initial = { ...reducer(undefined, { type: '@@init' }), articles: [source] };
  const next = reducer(initial, fetchArticleById.fulfilled(target, 'request', 'target'));
  expect(next.articles.map(item => item.data._id)).toEqual(['target', 'source']);
});

test.each(['article-first', 'feed-first'])('shared article stays first and unique across feed pages (%s)', order => {
  let state = reducer(undefined, {type: '@@init'});
  const articleAction = fetchArticleById.fulfilled(target, 'article', 'target');
  const feedAction = fetchNews.fulfilled({data: {items: [source, target]}, page: 1, current_day_offset: 0, isLocationMode: false}, 'feed', {page: 1});
  for (const action of order === 'article-first' ? [articleAction, feedAction] : [feedAction, articleAction]) state = reducer(state, action);
  expect(state.articles.items.map(item => item.data._id)).toEqual(['target', 'source']);
  state = reducer(state, fetchNews.fulfilled({data: {items: [target, {type: 'NEWS', data: {_id: 'more'}}]}, page: 2, current_day_offset: 0, isLocationMode: false}, 'next', {page: 2}));
  expect(state.articles.items.map(item => item.data._id)).toEqual(['target', 'source', 'more']);
});

test('shared article is visible before the first feed page arrives', () => {
  const initial = reducer(undefined, {type: '@@init'});
  const state = reducer(initial, fetchArticleById.fulfilled(target, 'article', 'target'));
  expect(state.articles).toEqual([target]);
  expect(state.notificationArticle).toEqual(target);
});
