import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  language: 'english',
  location: '',
  isDarkMode: false,
  notificationsEnabled: true,
  autoPlayVideos: true,
  dataUsageMode: 'medium',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    toggleDarkMode: state => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
    toggleNotifications: state => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    toggleAutoPlayVideos: state => {
      state.autoPlayVideos = !state.autoPlayVideos;
    },
    setDataUsageMode: (state, action) => {
      state.dataUsageMode = action.payload;
    },
  },
});

export const {
  setLanguage,
  setLocation,
  toggleDarkMode,
  setDarkMode,
  toggleNotifications,
  toggleAutoPlayVideos,
  setDataUsageMode,
} = settingsSlice.actions;
export default settingsSlice.reducer;
