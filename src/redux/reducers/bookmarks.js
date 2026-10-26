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

// "Save this ad" from the Ad Center menu — ads aren't News documents, so they
// get their own bookmark endpoint (see bookmark.routes.js's /ad/:id), not
// BOOKMARK_NEWS.
export const toggleAdBookmarkApi = createAsyncThunk(
  'bookmarks/toggleAdBookmarkApi',
  async ({ adId, isCurrentlyBookmarked }, { rejectWithValue }) => {
    try {
      const url = endpoints.BOOKMARK_AD.replace(':id', adId);
      const response = isCurrentlyBookmarked
        ? await api.delete(url)
        : await api.post(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getBookmarks = createAsyncThunk(
  'bookmarks/getBookmarks',
  async (_, { rejectWithValue,dispatch, }) => {
    try {
      const response = await api.get(endpoints.GET_BOOKMARKS); 
      dispatch(bookmarksSlice.actions.listBootmarkIds(response.data?.items))
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>error");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);




const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState: {
    bookmarks: [],
    loading: false,
    bookmarkIds:[]
  },
  reducers: {
    addBookmarkLocal: (state, action) => {
      const exists = state.items.find(item => item.id === action.payload.id);
      if (!exists) state.items.push(action.payload);
    },
    removeBookmarkLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    listBootmarkIds:(state,action)=>{
      if(action.payload){
        // Only news items carry an _id this list is used for (the "is this
        // article bookmarked" check elsewhere) — ad items have no `.news`,
        // skip them instead of crashing on `.news._id`.
        state.bookmarkIds = action.payload.filter(item=>item.news).map(item=>item.news._id)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('auth/logout', state => {
        state.bookmarks = [];
        state.bookmarkIds = [];
        state.loading = false;
      })
      .addCase('auth/userLogin/fulfilled', state => {
        state.bookmarks = [];
        state.bookmarkIds = [];
      })
      .addCase('auth/verifyOTP/fulfilled', state => {
        state.bookmarks = [];
        state.bookmarkIds = [];
      })
      .addCase(toggleBookmarkApi.fulfilled, (state, action) => {
        // Handle server confirmation here if necessary
        state.loading = false;
      })
      .addCase(toggleBookmarkApi.rejected, (state, action) => {
        state.loading = false;
        // Revert local state here if an optimistic update failed
      })
      .addCase(toggleAdBookmarkApi.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(toggleAdBookmarkApi.rejected, (state) => {
        state.loading = false;
      })
       .addCase(getBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload.items;
      })
  },
});

export const { addBookmarkLocal, removeBookmarkLocal,listBootmarkIds } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
