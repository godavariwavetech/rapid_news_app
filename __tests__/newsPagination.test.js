import reducer, {fetchNewsByTag, searchNews} from '../src/redux/reducers/news';
import api from '../src/utils/api';
jest.mock('../src/utils/api', () => ({get: jest.fn()}));
jest.mock('react-native-device-info', () => ({getUniqueId: jest.fn()}));
jest.mock('@react-native-community/netinfo', () => ({fetch: jest.fn()}));
jest.mock('react-native-fast-image', () => ({preload: jest.fn()}));
const page = {page: 2, limit: 20, total: 35, items: [{_id: 'next'}]};
beforeEach(() => api.get.mockReset());
test.each([[fetchNewsByTag, {tag: 'Vijayawada', page: 2}, 'tag'], [searchNews, {q: 'Politics', page: 2}, 'q']])('requests the next results page with totals and preserves main feed', async (thunk, request, key) => {
  api.get.mockResolvedValue({data: page});
  const action = await thunk(request)(jest.fn(), () => ({}), undefined);
  expect(api.get.mock.calls[0][1].params).toMatchObject({[key]: request[key], page: 2, limit: 20});
  expect(action.payload).toEqual(page);
  const initial = {...reducer(undefined, {type: '@@init'}), articles: [{_id: 'original'}]};
  expect(reducer(initial, action).articles).toEqual(initial.articles);
});
test('legacy tag caller still receives an array', async () => {
  api.get.mockResolvedValue({data: {...page, page: 1}});
  const action = await fetchNewsByTag('Vijayawada')(jest.fn(), () => ({}), undefined);
  expect(action.payload).toEqual(page.items);
});
test('failed page rejects instead of returning empty results', async () => {
  api.get.mockRejectedValue(new Error('offline'));
  const action = await searchNews({q: 'Politics', page: 2})(jest.fn(), () => ({}), undefined);
  expect(action.meta.requestStatus).toBe('rejected');
});
