import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  isOnboardingComplete: false,
  user:null,
  reporter: null,
  isAuthenticated: false,
  reporterToken:null,
  userToken:null
};


export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (payload, {getState, rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.AUTH_REQUEST_OTP, payload);
      return response;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>>>LOGIN");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (payload, {getState, rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.AUTH_VERIFY_OTP, payload);
      console.log(response,">>>>>>>>>>>>>>>responseeeeennenn LOGIN");
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>>>ERR");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);


export const applyReporter = createAsyncThunk(
  'auth/applyReporter',
  async (payload, {getState, rejectWithValue}) => {
    try {
      const { token, ...data } = payload;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const response = await api.post(endpoints.APPLY_REPORTER, payload, config);
      console.log(response,">>>>>>>>>>>>>>>responseeeeennenn LOGIN");
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>>>ERR");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, {getState, rejectWithValue}) => {
    try {
      console.log(">>>>>>>>>>>>>CALLING");
      const response = await api.get(endpoints.GET_USER_PROFILE);
      console.log(response,">>>>>>>>>>>>>>>responseeeeennenn LOGIN");
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>>>ERR");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    completeOnboarding: state => {
      console.log("CALLED THE COMPLETED");
      state.isOnboardingComplete = true;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: state => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
    extraReducers: builder => {
      builder
        .addCase(verifyOTP.pending, state => {
          state.loading = true;
          state.error = null;
        })
        .addCase(verifyOTP.fulfilled, (state, action) => {
          state.loading = false;
          if(action.payload?.user && action.payload?.user?.reporter_profile && action.payload?.user?.reporter_profile?.status=="APPROVED"){
            state.reporter = action.payload?.user?.reporter_profile;
             state.reporterToken = action.payload?.token;
          }
        })
        .addCase(verifyOTP.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Failed to fetch news';
        })
        .addCase(getProfile.fulfilled, (state, action) => {
          state.loading = false;
          console.log(action.payload,">>>>>>>>>>>>>>>>>ACTION>>>>>");
          state.reporter=action.payload?.reporter_profile
        })
    },
});

export const {completeOnboarding, setUser, logout} = authSlice.actions;
export default authSlice.reducer;
