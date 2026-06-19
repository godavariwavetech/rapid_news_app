import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUniqueId } from 'react-native-device-info';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const guestConfig = async (state, base = {}) => {
  const hasToken = state.auth?.reporterToken || state.auth?.userToken;
  const config = { ...base };
  if (!hasToken) {
    const deviceId = await getUniqueId();
    config.headers = { ...(config.headers || {}), 'x-device-id': deviceId };
    config.skipAuth = true;
  }
  return config;
};

// Swipeable magazine feed for the current location.
export const fetchMagazineFeed = createAsyncThunk(
  'magazine/fetchFeed',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const location = state.location?.currentLocation || {};
      const params = {
        village_id: location.village?._id,
        district_id: location.district?._id,
        state_id: location.state?._id,
        lang: 'te',
        limit: 30,
      };
      const config = await guestConfig(state, { params });
      const res = await api.get(endpoints.GET_MAGAZINE_FEED, config);
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// The "Viral" rail.
export const fetchViralMagazines = createAsyncThunk(
  'magazine/fetchViral',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const config = await guestConfig(state, { params: { lang: 'te', limit: 20 } });
      const res = await api.get(endpoints.GET_VIRAL_MAGAZINES, config);
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Record a share after the native share sheet completes.
export const shareMagazine = createAsyncThunk(
  'magazine/share',
  async (magazineId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const url = endpoints.SHARE_MAGAZINE.replace(':id', magazineId);
      const config = await guestConfig(state, {});
      const res = await api.post(url, {}, config);
      return { magazineId, data: res.data?.data ?? res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const magazineSlice = createSlice({
  name: 'magazine',
  initialState: {
    feed: [],
    viral: [],
    loadingFeed: false,
    loadingViral: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMagazineFeed.pending, (state) => {
        state.loadingFeed = true;
        state.error = null;
      })
      .addCase(fetchMagazineFeed.fulfilled, (state, action) => {
        state.loadingFeed = false;
        state.feed = action.payload?.items || [];
      })
      .addCase(fetchMagazineFeed.rejected, (state, action) => {
        state.loadingFeed = false;
        state.error = action.payload || 'Failed to fetch magazines';
      })

      .addCase(fetchViralMagazines.pending, (state) => {
        state.loadingViral = true;
      })
      .addCase(fetchViralMagazines.fulfilled, (state, action) => {
        state.loadingViral = false;
        state.viral = action.payload?.items || [];
      })
      .addCase(fetchViralMagazines.rejected, (state) => {
        state.loadingViral = false;
      })

      // Reflect the new share count locally on success.
      .addCase(shareMagazine.fulfilled, (state, action) => {
        const { magazineId, data } = action.payload;
        const apply = (list) => {
          const m = list.find((x) => x._id === magazineId);
          if (m && data?.shares != null) {
            m.shares = data.shares;
            m.viral = data.viral ?? m.viral;
          }
        };
        apply(state.feed);
        apply(state.viral);
      });
  },
});

export default magazineSlice.reducer;
