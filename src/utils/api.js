import axios from "axios";
import { baseURL } from "../config/config";
import { store } from "../redux/store"; 

const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    // If skipAuth is set, don't attach Authorization header
    if (config.skipAuth) {
      delete config.skipAuth;
      return config;
    }
    try {
      const state = store.getState(); 
      const tempToken = store.getState().location?.tempReporterToken; 
      const token = tempToken ? tempToken : state?.auth?.reporterToken || state?.auth?.userToken;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving auth token from Redux:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
