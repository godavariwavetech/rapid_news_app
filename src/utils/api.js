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
      // const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTNiMGQwZDAzYWI0Yzc5MjFhMDlmMyIsInJvbGUiOiJSRVBPUlRFUiIsImlhdCI6MTc2ODgwMTE5OSwiZXhwIjoxNzY5NDA1OTk5fQ.K1TvE4RT0qe-CbQ4oxGiQCYAJeRGcmj1VTg7GIpzLnY'
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NmUwNzNjOWY4Mzk1NjY2YmJlYmE0YyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY4ODE4NDkyLCJleHAiOjE3Njk0MjMyOTJ9.3zGYfR3teaotEerVA2g4QARfU-NNgsiXP38nmmBXPlc"
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
