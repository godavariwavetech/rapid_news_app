import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import { getUniqueId, getVersion } from 'react-native-device-info';
import api from '../../utils/api';
import { endpoints } from '../../config/config';
import { fetchFCMToken } from '../../services/NotificationsService';
import { Platform } from 'react-native';

const initialState = {
  isOnboardingComplete: false,
  user: null,
  reporter: null,
  isAuthenticated: false,
  reporterToken: null,
  userToken: null,
  isActive: true,
  loading: false,
  error: null,
};

const saveLogin = (state, {user, token}) => {
  state.user = user;
  state.userToken = token;
  state.isAuthenticated = true;
  state.isActive = user.is_active !== false;
  const approved = user.reporter_profile?.status === 'APPROVED';
  state.reporter = approved ? user : null;
  state.reporterToken = approved ? token : null;
};

export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (payload, {getState, rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.AUTH_REQUEST_OTP, payload, {skipAuth: true});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (payload, {getState, rejectWithValue}) => {
    try {
      // Send the guest device id so the backend can merge this device's read
      // history onto the account (keeps the unread count from jumping at login).
      const deviceId = await getUniqueId();
      const response = await api.post(endpoints.AUTH_VERIFY_OTP, payload, {
        headers: { 'x-device-id': deviceId },
        skipAuth: true,
      });
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Sign-in response is incomplete. Please try again.');
      }
      return response.data;
    } catch (error) {
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
      const response = await api.post(endpoints.APPLY_REPORTER, data, token ? config : {});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, {getState, rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.GET_USER_PROFILE);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.patch(endpoints.GET_USER_PROFILE, payload);
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
      const deviceId = await getUniqueId();
      const response = await api.post(endpoints.GOOGLE_LOGIN, payload, {
        skipAuth: true,
        headers: {'x-device-id': deviceId},
      });
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Sign-in response is incomplete. Please try again.');
      }
      return response.data;
    } catch (error) {
      console.log(error,"ERROR Updating");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);


export const postToken = createAsyncThunk(
  'auth/postToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const {userToken, reporterToken} = getState().auth;
      if (!userToken && !reporterToken) return;
      const token = await fetchFCMToken()
      if (!token) return;
      const currentAuth = getState().auth;
      if (!currentAuth.userToken && !currentAuth.reporterToken) return;
      const payload = {
        token: token,
        device_type: Platform.OS?.toUpperCase(),
      };
      const response = await api.post(endpoints.POST_FCM_TOKEN, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Fire-and-forget launch ping: records this device the moment the app opens,
// independent of location selection, login, or FCM/push. Drives the "Total
// Reach" metric (≈ activated installs), capturing devices that abandon onboarding
// or deny notifications — which the feed-based tracking never saw. Never blocks
// or surfaces errors; a failed ping must not affect app startup.
export const registerDevice = createAsyncThunk(
  'auth/registerDevice',
  async (_, { getState }) => {
    try {
      const deviceId = await getUniqueId();
      if (!deviceId) return;

      const state = getState();
      const currentLocation = state.location?.currentLocation;

      const payload = {
        platform: Platform.OS?.toUpperCase(),
        app_version: getVersion(),
        // Best-effort — absent on first launch before a location is picked.
        ...(currentLocation && {
          location: {
            state_id: currentLocation?.state?._id,
            district_id: currentLocation?.district?._id,
            village_id: currentLocation?.village?._id,
          },
        }),
      };

      // auth.optional on the backend links user_id when a token is attached
      // by the api interceptor; guests go through without one.
      await api.post(endpoints.REGISTER_DEVICE, payload, {
        headers: { 'x-device-id': deviceId },
      });
    } catch (error) {
      // Swallow — launch ping is non-critical.
      console.log('registerDevice ping failed:', error?.message);
    }
  },
);

export const registerGuestFCM = createAsyncThunk(
  'auth/registerGuestFCM',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Only proceed for guest users (no userToken and no reporterToken)
      const { userToken, reporterToken } = state.auth;
      if (userToken || reporterToken) return;

      const fcm_token = await fetchFCMToken();
      if (!fcm_token) return;

      // Sign-in may have completed while Firebase was fetching the token.
      const latestState = getState();
      if (latestState.auth.userToken || latestState.auth.reporterToken) return;

      const currentLocation = latestState.location?.currentLocation;
      const preferred_language = latestState.settings?.language || 'te';

      const payload = {
        fcm_token,
        device_type: Platform.OS?.toUpperCase(),
        location: {
          state_id: currentLocation?.state?._id,
          district_id: currentLocation?.district?._id,
          village_id: currentLocation?.village?._id,
        },
        preferred_language,
      };


      const response = await api.post(endpoints.REGISTER_GUEST, payload, { skipAuth: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const startActivity = createAsyncThunk(
  'auth/startActivity',
  async (payload, { rejectWithValue }) => {
    try {
      // Send x-device-id so GUESTS (no auth token) also get a session created;
      // the backend prefers the token's user when present, else falls back to
      // device_id. Without this header guest startSession returns null (no doc).
      const deviceId = await getUniqueId();
      const response = await api.post(endpoints.START_ACTIVITY, payload, {
        headers: { 'x-device-id': deviceId },
      });
      return response.data;
    } catch (error) {
      console.log(error, "ERROR Starting Activity");
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const endActivity = createAsyncThunk(
  'auth/endActivity',
  async (payload, { rejectWithValue }) => {
    try {
      console.log(">>>>>>>>>>>Responseee>>>>>>>>>>>>>>>PAYLOAD",payload);
      // Match startActivity: send x-device-id so the guest end-session path
      // resolves the same actor. endSession itself looks up by session_id, so
      // this is for consistency.
      const deviceId = await getUniqueId();
      const response = await api.post(endpoints.END_ACTIVITY, payload, {
        headers: { 'x-device-id': deviceId },
      });
      console.log(response,">>>RESP");
      return response.data;
    } catch (error) {
      console.log(error, "ERROR Ending Activity");
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
      state.userToken = null;
      state.isAuthenticated = false;
      state.isActive = null;
      state.reporter = null;
      state.reporterToken = null;
      state.loading = false;
      state.error = null;
    },
    clearReporter:(state) => {
      state.reporter = null;
      state.reporterToken = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(requestOTP.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, state => {
        state.loading = false;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || action.error.message || 'Failed to send OTP';
      })
      .addCase(verifyOTP.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        saveLogin(state, action.payload);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || action.error.message || 'Verification failed';
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isActive = action.payload?.is_active;
        state.reporter = action.payload;
      })
      // Merge, don't replace: the update response is a subset of the profile
      // (no phone / is_active / createdAt). Without this the new avatar only
      // appeared after the next getProfile.
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.user) {
          state.reporter = { ...state.reporter, ...action.payload.user };
        }
      })
      .addCase(userLogin.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyReporter.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyReporter.fulfilled, state => {
        state.loading = false;
      })
      .addCase(applyReporter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || action.error.message || 'Application failed';
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loading = false;
        saveLogin(state, action.payload);
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || action.error.message || 'Sign-in failed';
      });
  },
});

export const { completeOnboarding, setUser, logout, clearReporter } = authSlice.actions;
export default authSlice.reducer;
