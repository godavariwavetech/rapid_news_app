import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
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

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'location'],
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