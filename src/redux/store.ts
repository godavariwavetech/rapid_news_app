import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from 'redux';

import authReducer from './reducers/auth';
import newsReducer from './reducers/news';
import settingsReducer from './reducers/settings';
import bookmarksReducer from './reducers/bookmarks';
import locationReducer from './reducers/location';

const rootReducer = combineReducers({
  auth: authReducer,
  news: newsReducer,
  settings: settingsReducer,
  bookmarks: bookmarksReducer,
  location: locationReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings', 'bookmarks'],
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
