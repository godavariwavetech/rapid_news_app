import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  reporterStats : null,
  loading: false,
  error: null,
};

export const getReporterStats = createAsyncThunk(
  'getReporterStats',
  async (_, { rejectWithValue }) => {
    try {
      console.log(">>>>>>>>>>>>><<<<<<<<<<<<+++++++++++");
      const response = await api.get(endpoints.GET_STATS);
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>>>>>>ERRORROROORORRORORORRO");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(getReporterStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReporterStats.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload,">>>>>>>>>>>>>>STATS RESPONSE");
        state.reporterStats = action.payload;
      })
      .addCase(getReporterStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    }
});

export const {} = profileSlice.actions;
export default profileSlice.reducer;