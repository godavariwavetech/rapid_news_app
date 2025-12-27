import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  currentLocation: null, // { id, name, type, lat, long }
  detectedAddress: null,
  loading: false,
  error: null,
};

// Resolve Lat/Long to Backend Location ID
export const resolveLocation = createAsyncThunk(
  'location/resolve',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      const payload = { lat:latitude, lng:longitude };
      const response = await api.post(endpoints.RESOLVE_LOCATION, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setManualLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resolveLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLocation = action.payload; // Store the resolved location
        state.detectedAddress = action.payload.formatted_address; 
      })
      .addCase(resolveLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setManualLocation } = locationSlice.actions;
export default locationSlice.reducer;