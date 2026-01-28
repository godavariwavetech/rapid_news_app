import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  currentLocation: null, 
  states: [], 
  districts: [], 
  villages: [], // Added villages to state
  detectedAddress: null,
  loading: false,
  error: null,
  tempReporterToken:null
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

// Fetch Villages (NEW)
export const getVillages = createAsyncThunk(
  'location/getVillages',
  async (districtId, { rejectWithValue }) => {
    try {
      // Using the endpoint provided in the requirements
      const response = await api.get('/location/villages/', {
        params: { district_id: districtId }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const checkVillageCapacity = createAsyncThunk(
  'location/checkVillageCapacity',
  async (villageId, { rejectWithValue }) => {
    try {
      // API Endpoint provided: /locations/villages/:id/capacity
      const response = await api.get(`/location/villages/${villageId}/capacity`);
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
    setReporterTempToken:(state,action)=>{
      state.tempReporterToken = action.payload
    }
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
        state.states = action.payload;
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
        state.districts = action.payload;
      })
      .addCase(getDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Get Villages (NEW) ---
      .addCase(getVillages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVillages.fulfilled, (state, action) => {
        state.loading = false;
        state.villages = action.payload; // Store fetched villages
      })
      .addCase(getVillages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setManualLocation,setReporterTempToken } = locationSlice.actions;
export default locationSlice.reducer;