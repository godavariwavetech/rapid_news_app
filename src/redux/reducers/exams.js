import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

// Currently-live exams → home LIVE banner.
export const fetchLiveExams = createAsyncThunk(
  'exams/fetchLive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.GET_LIVE_EXAMS, { skipAuth: true });
      return res.data?.data?.exams ?? res.data?.exams ?? [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Hall-ticket lookup (hybrid): returns an unofficial teaser + official_url.
export const lookupExamResult = createAsyncThunk(
  'exams/lookup',
  async ({ examId, hallTicket }, { rejectWithValue }) => {
    try {
      const url = endpoints.GET_EXAM_RESULT.replace(':id', examId);
      const res = await api.get(url, {
        params: { hall_ticket: hallTicket, lang: 'te' },
        skipAuth: true,
      });
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const examsSlice = createSlice({
  name: 'exams',
  initialState: {
    liveExams: [],
    loadingLive: false,
    lookup: null,
    looking: false,
    lookupError: null,
  },
  reducers: {
    clearLookup: (state) => {
      state.lookup = null;
      state.lookupError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveExams.pending, (state) => {
        state.loadingLive = true;
      })
      .addCase(fetchLiveExams.fulfilled, (state, action) => {
        state.loadingLive = false;
        state.liveExams = action.payload || [];
      })
      .addCase(fetchLiveExams.rejected, (state) => {
        state.loadingLive = false;
      })
      .addCase(lookupExamResult.pending, (state) => {
        state.looking = true;
        state.lookup = null;
        state.lookupError = null;
      })
      .addCase(lookupExamResult.fulfilled, (state, action) => {
        state.looking = false;
        state.lookup = action.payload;
      })
      .addCase(lookupExamResult.rejected, (state, action) => {
        state.looking = false;
        state.lookupError = action.payload?.message || action.payload || 'Lookup failed';
      });
  },
});

export const { clearLookup } = examsSlice.actions;
export default examsSlice.reducer;
