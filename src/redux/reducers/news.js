import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUniqueId } from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native'; 
import api from '../../utils/api'; 
import { endpoints } from '../../config/config'; 

const initialState = {
  // --- Existing News List State ---
  articles: [],
  loading: false,
  error: null,
  selectedCategory: 'all',
  refreshing: false,

  // --- New Interaction State (Comments/Likes) ---
  currentComments: [],
  isLoadingComments: false, 
  isPostingComment: false,  
  interactionError: null,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (category = 'all', { rejectWithValue }) => {
    // 1. Check for Internet Connection
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log(networkState,">>>>>>>>>>>>>>>>>>>>>>>>networkState");
      // If offline, reject immediately. 
      // The reducer's rejected case keeps existing 'articles' (cache) and sets the error.
      return rejectWithValue('No internet connection. Showing cached news.');
    }

    try {
      const response = await api.get(endpoints.GET_NEWS_FEED, {
        params: {
          village_id: '693d34588b5e54c56d55c925',
          mandal_id: '693d34588b5e54c56d55c924',
          district_id: '693d34588b5e54c56d55c923',
          state_id: '693d34588b5e54c56d55c922',
          lang: 'te',
          page: 1,
          limit: 20,
        }
      });

      console.log(response,">>>>>>>>>>>>>>>>>>>>>Responseeeee>>>>>>>>>>>");
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
      const deviceId = await getUniqueId();
      const payload = { 
        news_id: newsId, 
        type: type, 
        device_id: deviceId 
      };
      const response = await api.post(endpoints.GUEST_REACT_LIKE, payload); 
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
      // Replace :id in the endpoint
      const url = endpoints.GET_COMMENTS.replace(':id', newsId);
      const response = await api.get(url);
      // The API returns { page: 1, items: [...] }
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
      const response = await api.post(endpoints.ADD_COMMENT, payload);
      
      // Refresh comments list immediately after successful post
      dispatch(getComments(newsId)); 
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 5. Track Ad Click
export const trackAdClick = createAsyncThunk(
  'news/trackAdClick',
  async (adId, { rejectWithValue }) => {
    try {
      const payload = {
        source: "feed",
        platform: Platform.OS // 'android' or 'ios'
      };
      // Replace :id in the endpoint
      const url = endpoints.TRACK_AD_CLICK.replace(':id', adId);
      const response = await api.post(url, payload);
      return response.data;
    } catch (error) {
      console.log('Ad tracking failed:', error);
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
        // The error is set, but 'state.articles' retains the cached data (if any)
        state.error = action.payload || 'Failed to fetch news';
      })

      // Get Comments
      .addCase(getComments.pending, (state) => {
        state.isLoadingComments = true;
        state.interactionError = null;
      })
      .addCase(getComments.fulfilled, (state, action) => {
        state.isLoadingComments = false;
        // Access .items from the pagination object
        state.currentComments = action.payload.items || []; 
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

      // Track Ad Click (No specific state change needed usually, but good for debugging)
      .addCase(trackAdClick.rejected, (state, action) => {
        // Just logging or minor state update if needed
        console.log("Ad click tracking failed", action.payload);
      });
  },
});

export const { setSelectedCategory, clearNews, setRefreshing, setMockNews } = newsSlice.actions;

export default newsSlice.reducer;