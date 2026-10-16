jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockResolvedValue('test-device'),
  getVersion: jest.fn().mockReturnValue('1.1.8'),
  getModel: jest.fn().mockReturnValue('V2251'),
}));
jest.mock('../src/utils/api', () => ({post: jest.fn().mockResolvedValue({data: {success: true}})}));
jest.mock('../src/services/NotificationsService', () => ({fetchFCMToken: jest.fn()}));

import {configureStore} from '@reduxjs/toolkit';
import {Platform} from 'react-native';
import auth, {registerDevice} from '../src/redux/reducers/auth';
import api from '../src/utils/api';
import {fetchFCMToken} from '../src/services/NotificationsService';
import {endpoints} from '../src/config/config';

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => jest.restoreAllMocks());

test.each([null, 'push-token'])('guest launch sends the model regardless of push permission (%s)', async token => {
  fetchFCMToken.mockResolvedValue(token);
  const store = configureStore({reducer: {auth}});
  await store.dispatch(registerDevice({open_id: 'test-open'})).unwrap();
  expect(api.post).toHaveBeenNthCalledWith(1, endpoints.REGISTER_DEVICE, {
    open_id: 'test-open', platform: 'ANDROID', app_version: '1.1.8', device_name: 'V2251',
  }, {headers: {'x-device-id': 'test-device'}});
});
