import axios from "axios";
import { baseURL } from "../config/config";
import { store } from "../redux/store"; 
import { normalizeLocalMediaUrls } from "./localMediaUrls";
import { getUniqueId } from 'react-native-device-info';

const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use(
  async (config) => {
    // Keep device attribution for signed-in readers as well as guests.
    try {
      if (!config.headers['x-device-id']) {
        config.headers['x-device-id'] = await getUniqueId();
      }
    } catch (error) {
      console.log('Device identification unavailable:', error?.message);
    }
    // If skipAuth is set, don't attach Authorization header
    if (config.skipAuth) {
      delete config.skipAuth;
      if (config.headers?.delete) {
        config.headers.delete('Authorization');
      } else if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }
    try {
      const state = store.getState(); 
      const tempToken = store.getState().location?.tempReporterToken; 
      const token = tempToken ? tempToken : state?.auth?.reporterToken || state?.auth?.userToken;
      if (token && !config.headers.Authorization && !config.headers.authorization) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving auth token from Redux:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use((response) => {
  response.data = normalizeLocalMediaUrls(response.data, baseURL);
  return response;
});

export default api;
