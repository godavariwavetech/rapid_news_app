import reducer, { fetchArticleById } from '../src/redux/reducers/news';
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
