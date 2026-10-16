jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockResolvedValue('guest-device'),
  getVersion: jest.fn().mockReturnValue('1.0'),
}));
jest.mock('../src/utils/api', () => ({post: jest.fn(), get: jest.fn(), patch: jest.fn()}));
jest.mock('../src/services/NotificationsService', () => ({fetchFCMToken: jest.fn()}));

import {configureStore} from '@reduxjs/toolkit';
import auth, {logout, userLogin, verifyOTP, requestOTP, postToken, registerGuestFCM, applyReporter} from '../src/redux/reducers/auth';
import location, {setReporterTempToken, setManualLocation} from '../src/redux/reducers/location';
import bookmarks from '../src/redux/reducers/bookmarks';
import api from '../src/utils/api';
import {fetchFCMToken} from '../src/services/NotificationsService';
import {endpoints} from '../src/config/config';
import {migrateAuthSession} from '../src/utils/migrateAuthSession';

const account = {user: {_id: 'reader', name: 'Reader'}, token: 'reader-token'};
const makeStore = () => configureStore({reducer: {auth, location, bookmarks}});

beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockResolvedValue({data: account});
  fetchFCMToken.mockResolvedValue('push-token');
});

test('guest Google login saves a complete session and removes old reporter credentials', async () => {
  const store = makeStore();
  store.dispatch(verifyOTP.fulfilled({user: {_id: 'old', reporter_profile: {status: 'APPROVED'}}, token: 'old-token'}, 'old'));
  store.dispatch(setReporterTempToken('old-setup-token'));
  await store.dispatch(userLogin({idToken: 'google-token'})).unwrap();
  expect(store.getState().auth).toMatchObject({
    user: account.user, userToken: account.token, isAuthenticated: true,
    reporter: null, reporterToken: null, loading: false,
  });
  expect(store.getState().location.tempReporterToken).toBeNull();
  expect(api.post).toHaveBeenCalledWith(endpoints.GOOGLE_LOGIN, {idToken: 'google-token'}, {
    skipAuth: true, headers: {'x-device-id': 'guest-device'},
  });
});

test.each(['PENDING', 'REJECTED', 'APPROVED'])('OTP %s account is signed in without granting unapproved reporter access', status => {
  const user = {_id: 'phone-user', reporter_profile: {status, full_name: 'Phone User'}};
  const state = auth(undefined, verifyOTP.fulfilled({user, token: 'phone-token'}, 'otp'));
  expect(state.isAuthenticated).toBe(true);
  expect(state.userToken).toBe('phone-token');
  expect(state.reporterToken).toBe(status === 'APPROVED' ? 'phone-token' : null);
  expect(state.reporter).toEqual(status === 'APPROVED' ? user : null);
});

test('logout returns to guest, clears both kinds of token, and preserves chosen location', () => {
  const store = makeStore();
  store.dispatch(userLogin.fulfilled(account, 'login'));
  store.dispatch(setReporterTempToken('temporary-token'));
  store.dispatch(setManualLocation({district: {_id: 'chosen'}}));
  store.dispatch({type: 'bookmarks/getBookmarks/fulfilled', payload: {items: [{news: {_id: 'saved'}}]}});
  store.dispatch(logout());
  expect(store.getState().auth).toMatchObject({user: null, userToken: null, reporterToken: null, isAuthenticated: false});
  expect(store.getState().location).toMatchObject({tempReporterToken: null, currentLocation: {district: {_id: 'chosen'}}});
  expect(store.getState().bookmarks.bookmarks).toEqual([]);
});

test.each([userLogin, verifyOTP])('malformed successful login response cannot create a session', async thunk => {
  api.post.mockResolvedValue({data: {user: account.user}});
  const store = makeStore();
  const action = await store.dispatch(thunk({}));
  expect(thunk.rejected.match(action)).toBe(true);
  expect(store.getState().auth.isAuthenticated).toBe(false);
  expect(store.getState().auth.error).toContain('incomplete');
});

test('OTP request/resend sends the request anonymously and preserves the server error', async () => {
  api.post.mockRejectedValue({response: {data: {message: 'Please wait before resending'}}});
  const store = makeStore();
  const action = await store.dispatch(requestOTP({phone: '9876543210'}));
  expect(api.post).toHaveBeenCalledWith(endpoints.AUTH_REQUEST_OTP, {phone: '9876543210'}, {skipAuth: true});
  expect(requestOTP.rejected.match(action)).toBe(true);
  expect(store.getState().auth.error).toBe('Please wait before resending');
  expect(store.getState().auth.loading).toBe(false);
});

test('guests do not call the authenticated push registration endpoint', async () => {
  await makeStore().dispatch(postToken());
  expect(fetchFCMToken).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
});

test('signed-in readers register push notifications on their account', async () => {
  const store = makeStore();
  store.dispatch(userLogin.fulfilled(account, 'login'));
  await store.dispatch(postToken());
  expect(api.post).toHaveBeenCalledWith(endpoints.POST_FCM_TOKEN, expect.objectContaining({token: 'push-token'}));
});

test('guest push registration stops if sign-in finishes during token retrieval', async () => {
  let releaseToken;
  fetchFCMToken.mockReturnValue(new Promise(resolve => {releaseToken = resolve;}));
  const store = makeStore();
  const registration = store.dispatch(registerGuestFCM());
  store.dispatch(userLogin.fulfilled(account, 'login'));
  releaseToken('push-token');
  await registration;
  expect(api.post).not.toHaveBeenCalled();
});

test('reporter application uses its supplied token without including it in the form body', async () => {
  await makeStore().dispatch(applyReporter({token: 'setup-token', username: 'new_reader'}));
  expect(api.post).toHaveBeenCalledWith(endpoints.APPLY_REPORTER, {username: 'new_reader'}, {
    headers: {Authorization: 'Bearer setup-token'},
  });
});

test('migration removes orphaned logout tokens and temporary credentials while preserving preferences', () => {
  const state = migrateAuthSession({auth: {user: null, userToken: 'stale', reporter: null},
    location: {currentLocation: {district: {_id: 'chosen'}}, tempReporterToken: 'stale-setup'}, settings: {language: 'te'}});
  expect(state.auth).toMatchObject({userToken: null, reporterToken: null, isAuthenticated: false, loading: false});
  expect(state.location.tempReporterToken).toBeNull();
  expect(state.location.currentLocation.district._id).toBe('chosen');
  expect(state.settings.language).toBe('te');
});

test('migration repairs the authentication flag for a valid saved Google session', () => {
  const state = migrateAuthSession({auth: {user: account.user, userToken: account.token, isAuthenticated: false}});
  expect(state.auth.isAuthenticated).toBe(true);
  expect(state.auth.userToken).toBe(account.token);
});
