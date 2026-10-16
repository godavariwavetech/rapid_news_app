jest.mock('../src/redux/store', () => ({store: {getState: jest.fn()}}));
import api from '../src/utils/api';
import {store} from '../src/redux/store';
import {AxiosHeaders} from 'axios';

const authorize = config => api.interceptors.request.handlers[0].fulfilled(config);

beforeEach(() => {
  jest.clearAllMocks();
  store.getState.mockReturnValue({auth: {userToken: 'reader-token'}, location: {tempReporterToken: 'stale-token'}});
});

test('anonymous login requests strip Authorization even when previously supplied', () => {
  const config = authorize({skipAuth: true, headers: new AxiosHeaders({Authorization: 'Bearer old-account'})});
  expect(config.headers.get('Authorization')).toBeUndefined();
  expect(config.skipAuth).toBeUndefined();
  expect(store.getState).not.toHaveBeenCalled();
});

test('explicit application token is not replaced by another session token', () => {
  const config = authorize({headers: new AxiosHeaders({authorization: 'Bearer setup-token'})});
  expect(config.headers.get('Authorization')).toBe('Bearer setup-token');
});

test('normal signed-in request uses the account token after temporary token cleanup', () => {
  store.getState.mockReturnValue({auth: {userToken: 'reader-token'}, location: {tempReporterToken: null}});
  const config = authorize({headers: new AxiosHeaders()});
  expect(config.headers.get('Authorization')).toBe('Bearer reader-token');
});

test('guest requests have no Authorization header', () => {
  store.getState.mockReturnValue({auth: {userToken: null, reporterToken: null}, location: {tempReporterToken: null}});
  const config = authorize({headers: new AxiosHeaders()});
  expect(config.headers.get('Authorization')).toBeUndefined();
});
