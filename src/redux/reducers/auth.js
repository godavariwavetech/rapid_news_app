import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  isOnboardingComplete: false,
  user: null,
  isAuthenticated: false,
};

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
    logout: state => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {completeOnboarding, setUser, logout} = authSlice.actions;
export default authSlice.reducer;
