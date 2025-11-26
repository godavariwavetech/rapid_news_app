import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    addBookmark: (state, action) => {
      const exists = state.items.find(item => item.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeBookmark: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearAllBookmarks: state => {
      state.items = [];
    },
  },
});

export const {addBookmark, removeBookmark, clearAllBookmarks} =
  bookmarksSlice.actions;
export default bookmarksSlice.reducer;
