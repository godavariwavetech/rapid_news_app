import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  articles: [],
  loading: false,
  error: null,
  selectedCategory: 'all',
  refreshing: false,
};

// Async thunk for fetching news
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (category = 'all') => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.get(
        `https://your-api.com/news?category=${category}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearNews: state => {
      state.articles = [];
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    setMockNews: (state, action) => {
      state.articles = action.payload;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNews.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch news';
      });
  },
});

export const {setSelectedCategory, clearNews, setRefreshing, setMockNews} =
  newsSlice.actions;
export default newsSlice.reducer;
