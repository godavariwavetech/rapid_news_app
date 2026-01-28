import axios from "axios";
import { baseURL } from "../config/config";
import { store } from "../redux/store"; 

const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    try {
      const state = store.getState(); 
      const tempToken = store.getState().location?.tempReporterToken; 
      // const token = tempToken ? tempToken : state?.auth?.reporterToken||state?.auth?.userToken||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NmUwNzNjOWY4Mzk1NjY2YmJlYmE0YyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY4ODE4NDkyLCJleHAiOjE3Njk0MjMyOTJ9.3zGYfR3teaotEerVA2g4QARfU-NNgsiXP38nmmBXPlc"
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzliYTM3NTE1YmY0MzAzZTZlYmU2MSIsInJvbGUiOiJSRVBPUlRFUiIsImlhdCI6MTc2OTU5MzQ4NCwiZXhwIjoxNzcwMTk4Mjg0fQ.s66ongka9RSuA6VQayKCYTWhlhWKA-84-x5h0qpLEDU"
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
