/**
 * Cold-start notification deep-link: the tapped article must stay at feed index 0
 * across EVERY page-1 refresh that the app fires while settling (location resolving
 * re-triggers HomeScreen's fetch effect), and must only be dropped when the user
 * explicitly asks for a fresh feed.
 */
// The slice pulls in native modules at import time; the reducer logic under test
// needs none of them.
jest.mock('react-native-device-info', () => ({ getUniqueId: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn(), addEventListener: jest.fn() }));
jest.mock('../src/utils/api', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));

import reducer, { clearNews } from '../src/redux/reducers/news';
import { fetchNews, fetchArticleById } from '../src/redux/reducers/news';

const ARTICLE_ID = 'tapped-article-id';
const article = { _id: ARTICLE_ID, title: 'Tapped from notification' };

// A feed page that does NOT contain the tapped article
const feedPage = {
  items: [
    { data: { _id: 'other-1' } },
    { data: { _id: 'other-2' } },
  ],
  pagination: { total_news: 2, current_day_offset: 0 },
};

const firstId = state => {
  const items = Array.isArray(state.articles) ? state.articles : state.articles?.items || [];
  return items[0]?.data?._id ?? items[0]?._id;
};

const feedArrives = (state, { isLocationMode = false, userRefresh = false } = {}) =>
  reducer(
    state,
    fetchNews.fulfilled(
      { data: feedPage, page: 1, current_day_offset: 0, isLocationMode },
      'req',
      { page: 1, current_day_offset: 0, isLocationMode, userRefresh },
    ),
  );

const tapNotification = state =>
  reducer(state, fetchArticleById.fulfilled(article, 'req', ARTICLE_ID));

describe('notification article pinning', () => {
  test('survives the second page-1 refresh fired when location resolves', () => {
    let state = reducer(undefined, { type: '@@INIT' });

    // 1. Notification tapped from a killed app — feed has not loaded yet
    state = tapNotification(state);

    // 2. HomeScreen mounts, currentLocation still unresolved -> first page-1 fetch
    state = feedArrives(state);
    expect(firstId(state)).toBe(ARTICLE_ID);

    // 3. currentLocation resolves -> effect re-runs -> SECOND page-1 fetch.
    //    This is the reported bug: the article used to be dropped here.
    state = feedArrives(state);
    expect(firstId(state)).toBe(ARTICLE_ID);
  });

  test('an explicit user refresh drops the pinned article', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = tapNotification(state);
    state = feedArrives(state);
    expect(firstId(state)).toBe(ARTICLE_ID);

    state = feedArrives(state, { userRefresh: true });
    expect(firstId(state)).not.toBe(ARTICLE_ID);
  });

  test('clearNews (tab switch) drops the pinned article', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = tapNotification(state);
    state = reducer(state, clearNews());
    state = feedArrives(state);
    expect(firstId(state)).not.toBe(ARTICLE_ID);
  });
});
