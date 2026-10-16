import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

// Live matches for the compact score card. Public endpoint — no auth needed.
export const fetchLiveMatches = createAsyncThunk(
  'cricket/fetchLive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.GET_LIVE_CRICKET, { skipAuth: true });
      return res.data?.data?.matches ?? res.data?.matches ?? [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Full scorecard for the detail screen.
export const fetchMatchDetail = createAsyncThunk(
  'cricket/fetchDetail',
  async (matchId, { rejectWithValue }) => {
    try {
      const url = endpoints.GET_CRICKET_MATCH.replace(':matchId', matchId);
      const res = await api.get(url, { skipAuth: true });
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const cricketSlice = createSlice({
  name: 'cricket',
  initialState: {
    liveMatches: [],
    loadingLive: false,
    detail: null,
    loadingDetail: false,
    error: null,
  },
  reducers: {
    clearMatchDetail: (state) => {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveMatches.pending, (state) => {
        state.loadingLive = true;
      })
      .addCase(fetchLiveMatches.fulfilled, (state, action) => {
        state.loadingLive = false;
        state.liveMatches = action.payload || [];
      })
      .addCase(fetchLiveMatches.rejected, (state, action) => {
        state.loadingLive = false;
        state.error = action.payload;
      })
      .addCase(fetchMatchDetail.pending, (state) => {
        state.loadingDetail = true;
        state.detail = null;
      })
      .addCase(fetchMatchDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.detail = action.payload;
      })
      .addCase(fetchMatchDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload;
      });
  },
});

export const { clearMatchDetail } = cricketSlice.actions;
export default cricketSlice.reducer;
