import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUniqueId } from 'react-native-device-info';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

// Fetch the performance-based Top Stories rail for the user's current location.
// Response items are { type: 'TOP_STORY' | 'AD', data }, where each TOP_STORY
// carries data.top_story = { metric, pinned, rank }.
export const fetchTopStories = createAsyncThunk(
  'topStories/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const location = state.location?.currentLocation || {};
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;

      const queryParams = {
        village_id: location.village?._id || '697d8135322a103bdabf0fc7',
        district_id: location.district?._id || '697d8135322a103bdabf0fc5',
        state_id: location.state?._id || '697d8135322a103bdabf0fc3',
        lang: 'te',
      };

      const config = { params: queryParams };
      if (!hasToken) {
        const deviceId = await getUniqueId();
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }

      const response = await api.get(endpoints.GET_TOP_STORIES, config);
      // Standard envelope: { success, message, data: { items, generated_at } }
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const topStoriesSlice = createSlice({
  name: 'topStories',
  initialState: {
    items: [],
    generatedAt: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearTopStories: (state) => {
      state.items = [];
      state.generatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopStories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        state.generatedAt = action.payload?.generated_at || null;
      })
      .addCase(fetchTopStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch top stories';
      });
  },
});

export const { clearTopStories } = topStoriesSlice.actions;
export default topStoriesSlice.reducer;
