import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Corrected path to your api.js

const initialState = {
  // --- Existing News List State ---
  articles: [],
  loading: false,
  error: null,
  selectedCategory: 'all',
  refreshing: false,

  // --- New Interaction State (Comments/Likes) ---
  currentComments: [],
  isLoadingComments: false, // Loading state for the comments modal
  isPostingComment: false,  // Loading state for submitting a comment
  interactionError: null,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (category = 'all', { rejectWithValue }) => {
    try {
      const response = await api.get(`news?category=${category}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2. React to News (Like/Dislike)
export const reactToNews = createAsyncThunk(
  'news/reactToNews',
  async ({ newsId, type }, { rejectWithValue }) => {
    try {
      const payload = { 
        news_id: newsId, 
        type: type, // "LIKE" or "DISLIKE"
        device_id: "device-123" // Static Device ID as requested
      };
      // Adjust endpoint if needed (e.g., 'news/react' or 'react')
      const response = await api.post('news/react', payload); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 3. Get Comments
export const getComments = createAsyncThunk(
  'news/getComments',
  async (newsId, { rejectWithValue }) => {
    try {
      const response = await api.get(`comments/${newsId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 4. Post Comment
export const postComment = createAsyncThunk(
  'news/postComment',
  async ({ newsId, text }, { dispatch, rejectWithValue }) => {
    try {
      const payload = { 
        news_id: newsId, 
        text: text 
      };
      const response = await api.post('comments', payload);
      
      // Refresh comments list immediately after successful post
      dispatch(getComments(newsId)); 
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- SLICE ---

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearNews: (state) => {
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
  extraReducers: (builder) => {
    builder
      // Fetch News
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch news';
      })

      // Get Comments
      .addCase(getComments.pending, (state) => {
        state.isLoadingComments = true;
        state.interactionError = null;
      })
      .addCase(getComments.fulfilled, (state, action) => {
        state.isLoadingComments = false;
        state.currentComments = action.payload;
      })
      .addCase(getComments.rejected, (state, action) => {
        state.isLoadingComments = false;
        state.interactionError = action.payload;
      })

      // Post Comment
      .addCase(postComment.pending, (state) => {
        state.isPostingComment = true;
        state.interactionError = null;
      })
      .addCase(postComment.fulfilled, (state) => {
        state.isPostingComment = false;
      })
      .addCase(postComment.rejected, (state, action) => {
        state.isPostingComment = false;
        state.interactionError = action.payload;
      })

      // React (Like/Dislike)
      .addCase(reactToNews.fulfilled, (state, action) => {
        // Optional: Update local state if API returns updated counts
      });
  },
});

export const { setSelectedCategory, clearNews, setRefreshing, setMockNews } = newsSlice.actions;

export default newsSlice.reducer;