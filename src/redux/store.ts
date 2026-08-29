import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer, createMigrate} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from 'redux';

import authReducer from './reducers/auth';
import newsReducer from './reducers/news';
import settingsReducer from './reducers/settings';
import bookmarksReducer from './reducers/bookmarks';
import locationReducer from './reducers/location';
import profile from "./reducers/profile"
import topStoriesReducer from './reducers/topStories';
import magazineReducer from './reducers/magazine';
import cricketReducer from './reducers/cricket';
import examsReducer from './reducers/exams';

const rootReducer = combineReducers({
  auth: authReducer,
  news: newsReducer,
  settings: settingsReducer,
  bookmarks: bookmarksReducer,
  location: locationReducer,
  profile,
  topStories: topStoriesReducer,
  magazine: magazineReducer,
  cricket: cricketReducer,
  exams: examsReducer
});

// v1: `location.isManuallySet` didn't exist before this migration. Devices that
// already had a `currentLocation` persisted from an older build rehydrate that
// flag as `false` (the initial-state default), which made GPS auto-detection on
// every splash launch silently keep overwriting a location the user had already
// settled on. Since any pre-existing currentLocation predates the "auto vs
// manual" distinction, treat it as sticky so it isn't clobbered by the next
// GPS resolve — the user can still change it explicitly at any time via
// LocationSelectionScreen, which always sets this flag itself.
const migrations = {
  1: (state: any) => {
    if (state?.location?.currentLocation && !state.location.isManuallySet) {
      return {
        ...state,
        location: {
          ...state.location,
          isManuallySet: true,
        },
      };
    }
    return state;
  },
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'location'],
  version: 1,
  migrate: createMigrate(migrations, {debug: false}),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistorStore = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;