import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

const initialState = {
  currentLocation: null,
  // True once the user has explicitly picked a location via the location picker.
  // Gates resolveLocation.fulfilled below so GPS-based auto-detection (run on every
  // app launch from SplashScreen, plus onboarding screens) never silently overwrites
  // a manual choice — e.g. selecting Rajahmundry must not flip back to Vijayawada
  // just because the device is physically there on the next launch.
  isManuallySet: false,
  states: [],
  districts: [], 
  villages: [],
  searchResults: [],
  searchLoading: false,
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

// Search location by name or pincode
export const searchLocation = createAsyncThunk(
  'location/search',
  async ({ q, pincode }, { rejectWithValue }) => {
    try {
      const params = pincode ? { pincode } : { q };
      const response = await api.get('/location/search', { params, skipAuth: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// PATCH /users/my-location (auth required)
export const updateMyLocation = createAsyncThunk(
  'location/updateMyLocation',
  async ({ state_id, district_id, village_id }, { rejectWithValue }) => {
    try {
      const response = await api.patch('/users/my-location', { state_id, district_id, village_id });
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
      state.isManuallySet = true;
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
        // Never let GPS auto-detection clobber a location the user picked themselves.
        if (!state.isManuallySet) {
          state.currentLocation = action.payload;
        }
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
        state.villages = action.payload;
      })
      .addCase(getVillages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Search Location ---
      .addCase(searchLocation.pending, (state) => {
        state.searchLoading = true;
        state.searchResults = [];
        state.error = null;
      })
      .addCase(searchLocation.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchLocation.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setManualLocation, setReporterTempToken } = locationSlice.actions;
export default locationSlice.reducer;