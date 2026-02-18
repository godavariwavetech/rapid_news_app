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
        state.bookmarkIds = action.payload.map(item=>item.news._id)
      }
    }
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
        state.bookmarks = action.payload.items;
      })
  },
});

export const { addBookmarkLocal, removeBookmarkLocal,listBootmarkIds } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;