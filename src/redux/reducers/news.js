import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUniqueId } from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native'; 
import api from '../../utils/api'; 
import { endpoints } from '../../config/config'; 

const initialState = {
  // --- News List State ---
  articles: [], 
  loading: false,          // Initial load
  isLoadingMore: false,    // Pagination load
  error: null,
  selectedCategory: 'all',
  refreshing: false,
  
  // --- Pagination State ---
  currentPage: 1,
  hasMore: true,

  // --- Interaction State ---
  currentComments: [],
  isLoadingComments: false, 
  isPostingComment: false,  
  interactionError: null,

  // --- Reporter News State ---
  reporterNews: [],
  isLoadingReporterNews: false,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List (Supports Pagination & Device ID)
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (arg = 'all', { rejectWithValue }) => {
    // Handle both simpler calls: dispatch(fetchNews('sports'))
    // And object calls: dispatch(fetchNews({ category: 'sports', page: 2 }))
    let category = 'all';
    let page = 1;

    if (typeof arg === 'object') {
      category = arg.category || 'all';
      page = arg.page || 1;
    } else {
      category = arg;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return rejectWithValue('No internet connection. Showing cached news.');
    }

    try {
      // Get unique Device ID
      const deviceId = await getUniqueId();

      const response = await api.get(endpoints.GET_NEWS_FEED, {
        params: {
          village_id: '693d34588b5e54c56d55c925', // Consider fetching these from state.location
          mandal_id: '693d34588b5e54c56d55c924',
          district_id: '693d34588b5e54c56d55c923',
          state_id: '693d34588b5e54c56d55c922',
          lang: 'te',
          page: page, // Dynamic Page
          limit: 20,
        },
        headers: {
          'x-device-id': deviceId // Header added here
        }
      });
      
      // Return data + the page number so the reducer knows context
      return { data: response.data, page }; 
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
      const url = endpoints.GET_COMMENTS.replace(':id', newsId);
      const response = await api.get(url);
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
        platform: Platform.OS 
      };
      const url = endpoints.TRACK_AD_CLICK.replace(':id', adId);
      const response = await api.post(url, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 6. View News
export const viewNews = createAsyncThunk(
  'news/viewNews',
  async (newsId, { rejectWithValue }) => {
    try {
      const url = endpoints.VIEW_NEWS.replace(':id', newsId);
      const response = await api.post(url,{});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 7. Get Reporter News
export const getReporterNews = createAsyncThunk(
  'news/getReporterNews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.GET_REPORTER_NEWS);
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
      state.currentPage = 1;
      state.hasMore = true;
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
      // --- Fetch News (Pagination Logic) ---
      .addCase(fetchNews.pending, (state, action) => {
        // Check if we are fetching page 1 (refresh/init) or next page
        const page = typeof action.meta.arg === 'object' ? action.meta.arg.page : 1;
        if (page === 1) {
            state.loading = true;
        } else {
            state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        const { data, page } = action.payload;
        state.loading = false;
        state.isLoadingMore = false;
        state.currentPage = page;

        // Normalize data: handle if API returns array directly or object with items
        const incomingItems = Array.isArray(data) ? data : (data.items || []);

        // Logic: Replace if page 1, Append if page > 1
        if (page === 1) {
          state.articles = data; // Keep original structure
        } else {
          // Robust append logic for different structures
          if (Array.isArray(state.articles)) {
             state.articles = [...state.articles, ...incomingItems];
          } else if (state.articles?.items) {
             state.articles.items = [...state.articles.items, ...incomingItems];
          }
        }

        // Update hasMore based on result size (limit is 20)
        state.hasMore = incomingItems.length > 0;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.isLoadingMore = false;
        state.error = action.payload || 'Failed to fetch news';
      })

      // --- Get Comments ---
      .addCase(getComments.pending, (state) => {
        state.isLoadingComments = true;
        state.interactionError = null;
      })
      .addCase(getComments.fulfilled, (state, action) => {
        state.isLoadingComments = false;
        state.currentComments = action.payload.items || []; 
      })
      .addCase(getComments.rejected, (state, action) => {
        state.isLoadingComments = false;
        state.interactionError = action.payload;
      })

      // --- Post Comment (Optimistic Update) ---
      .addCase(postComment.pending, (state) => {
        state.isPostingComment = true;
        state.interactionError = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        state.isPostingComment = false;
        const { newsId } = action.meta.arg;
        
        const updateItemCommentCount = (itemsList) => {
          if (!Array.isArray(itemsList)) return;
          const index = itemsList.findIndex(item => (item.data && item.data._id === newsId));
          if (index !== -1) {
            if (!itemsList[index].data.comments) {
              itemsList[index].data.comments = { count: 0 };
            }
            itemsList[index].data.comments.count += 1;
          }
        };

        if (state.articles?.items) {
          updateItemCommentCount(state.articles.items);
        } else if (Array.isArray(state.articles)) {
          updateItemCommentCount(state.articles);
        }
      })
      .addCase(postComment.rejected, (state, action) => {
        state.isPostingComment = false;
        state.interactionError = action.payload;
      })

      // --- Get Reporter News ---
      .addCase(getReporterNews.pending, (state) => {
        state.isLoadingReporterNews = true;
      })
      .addCase(getReporterNews.fulfilled, (state, action) => {
        state.isLoadingReporterNews = false;
        state.reporterNews = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload.items || []);
      })
      .addCase(getReporterNews.rejected, (state, action) => {
        state.isLoadingReporterNews = false;
        console.log("Error fetching reporter news:", action.payload);
      })

      // --- Track Ad Click ---
      .addCase(trackAdClick.rejected, (state, action) => {
        console.log("Ad click tracking failed", action.payload);
      });
  },
});

export const { setSelectedCategory, clearNews, setRefreshing, setMockNews } = newsSlice.actions;

export default newsSlice.reducer;