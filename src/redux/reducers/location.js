// src/redux/reducers/location.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  currentLocation: null, // { id, name, type, lat, long }
  states: [], // Added to store the list of states
  districts: [], // Added to store the list of districts
  detectedAddress: null,
  loading: false,
  error: null,
};

// Resolve Lat/Long to Backend Location ID
export const resolveLocation = createAsyncThunk(
  'location/resolve',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      const payload = { lat: latitude, lng: longitude };
      const response = await api.post(endpoints.RESOLVE_LOCATION, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch States
export const getStates = createAsyncThunk(
  'location/getStates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.GET_STATES);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Districts
export const getDistrict = createAsyncThunk(
  'location/getDistrict',
  async (stateId = '693d34588b5e54c56d55c922', { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.GET_DISTRICTS, {
        params: { state_id: stateId }
      });
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
      // --- Resolve Location ---
      .addCase(resolveLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLocation = action.payload;
      })
      .addCase(resolveLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get States ---
      .addCase(getStates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStates.fulfilled, (state, action) => {
        state.loading = false;
        state.states = action.payload; // Store fetched states
      })
      .addCase(getStates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get Districts ---
      .addCase(getDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.districts = action.payload; // Store fetched districts
      })
      .addCase(getDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setManualLocation } = locationSlice.actions;
export default locationSlice.reducer;