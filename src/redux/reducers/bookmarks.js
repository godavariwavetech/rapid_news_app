import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';

export const toggleBookmarkApi = createAsyncThunk(
  'bookmarks/toggleBookmarkApi',
  async ({ newsId, isCurrentlyBookmarked }, { rejectWithValue }) => {
    try {
      const url = endpoints.BOOKMARK_NEWS.replace(':id', newsId);
      console.log(url,">>>>>>>>>>>>>>>>URLLLL",isCurrentlyBookmarked);
      const response = isCurrentlyBookmarked 
        ? await api.delete(url) 
        : await api.post(url);
      console.log(response,">>>>>>>>>>>>>>>Response>>>>>>>>>>>>>>>>")
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getBookmarks = createAsyncThunk(
  'bookmarks/getBookmarks',
  async (_, { rejectWithValue }) => {
    console.log(">>>>>>>>>>>>>>CALLING THE API");
    try {
      const response = await api.post(endpoints.GET_BOOKMARKS); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);




const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState: {
    bookmarks: [],
    loading: false,
  },
  reducers: {
    // Keep local state management for optimistic updates if desired
    addBookmarkLocal: (state, action) => {
      const exists = state.items.find(item => item.id === action.payload.id);
      if (!exists) state.items.push(action.payload);
    },
    removeBookmarkLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(toggleBookmarkApi.fulfilled, (state, action) => {
        // Handle server confirmation here if necessary
        state.loading = false;
      })
      .addCase(toggleBookmarkApi.rejected, (state, action) => {
        state.loading = false;
        // Revert local state here if an optimistic update failed
      })
       .addCase(getBookmarks.fulfilled, (state, action) => {
        console.log(action.payload,">>>>>>>>>>>>>ACTION apyloadd");
        state.bookmarks = action.payload;
      })
  },
});

export const { addBookmarkLocal, removeBookmarkLocal } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;