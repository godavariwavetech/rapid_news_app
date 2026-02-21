import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';
import { fetchFCMToken } from '../../services/NotificationsService';
import { Platform } from 'react-native';

const initialState = {
  isOnboardingComplete: false,
  user:null,
  reporter: null,
  isAuthenticated: false,
  reporterToken:null,
  userToken:null,
  isActive: true,
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

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    console.log("Called here>>>>>>>>>>>>");
    try {
      // endpoints.GET_USER_PROFILE maps to 'users/my-profile'
      const response = await api.patch(endpoints.GET_USER_PROFILE, payload);

      console.log(response,">>>>>>>>>>responseeeeee update profile");
      return response.data;
    } catch (error) {
      console.log(error,"ERROR Updating");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const userLogin = createAsyncThunk(
  'auth/userLogin',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(endpoints.GOOGLE_LOGIN, payload);
      console.log(response,">>>>>>>>>>>>>Responseeee>>>>>>>>>>>>");
      return response.data;
    } catch (error) {
      console.log(error,"ERROR Updating");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);


export const postToken = createAsyncThunk(
  'auth/postToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await fetchFCMToken()
      const payload = {
        token: token,
        device_type: Platform.OS?.toUpperCase(),
      };
      console.log(payload,">>>>>>>PAULOADDDDD>>>>>>");
      const response = await api.post(endpoints.POST_FCM_TOKEN, payload);
      console.log(response,"TOKEN RESPONSEE");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);



const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    completeOnboarding: state => {
      state.isOnboardingComplete = true;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
   logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isActive = null;
      state.reporter = null;
      state.reporterToken=null
    },
    clearReporter:(state)=>{
      state.reporter=null,
      state.reporterToken=null
    }
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
          state.isActive = action.payload?.is_active;
          state.reporter=action.payload
        })
        .addCase(userLogin.fulfilled, (state, action) => {
          console.log(action.payload,">>>>>>>>>>>>>PREEPPEPEPEPEP");
          state.loading = false;
          state.user=action.payload.user
          state.userToken=action.payload.token
        })
    },
});

export const {completeOnboarding, setUser, logout, clearReporter} = authSlice.actions;
export default authSlice.reducer;
