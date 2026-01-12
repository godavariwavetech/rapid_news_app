import axios from "axios";
import { baseURL } from "../config/config";
import { store } from "../redux/store"; 

const api = axios.create({
  baseURL,
  timeout: 5000,
});

api.interceptors.request.use(
  (config) => {
    try {
      const state = store.getState(); 
      // const token = state?.auth?.reporterToken; 
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTNiMGQwZDAzYWI0Yzc5MjFhMDlmMyIsInJvbGUiOiJSRVBPUlRFUiIsImlhdCI6MTc2Nzc3MTM3OSwiZXhwIjoxNzY4Mzc2MTc5fQ.ajs43l7h1_5Ub7uT0x4ygddH7lme_le4kD51Og_oGgI'

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
