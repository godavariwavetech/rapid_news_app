import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUniqueId } from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native'; 
import api from '../../utils/api'; 
import { endpoints } from '../../config/config'; 

const initialState = {
  // --- News List State ---
  articles: [], 
  loading: false,          
  isLoadingMore: false,    
  error: null,
  
  // --- Categories State ---
  categories: [],
  loadingCategories: false,
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

  // --- Create/Update State ---
  isCreatingNews: false,
  createNewsSuccess: false,
  createNewsError: null,

  isUpdatingNews: false,
  updateNewsSuccess: false,
  updateNewsError: null,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (arg = 'all', { getState, rejectWithValue }) => {
    let category = 'all';
    let page = 1;
    let location = {};
    let isLocationMode = false;

    if (typeof arg === 'object') {
      category = arg.category || 'all';
      page = arg.page || 1;
      isLocationMode = arg.isLocationMode || false; 
      location = {
        village_id: arg.currentLocation?.village?._id,
        district_id: arg.currentLocation?.district?._id,
        state_id: arg.currentLocation?.state?._id,
      };
    }

    try {
      const deviceId = await getUniqueId();

      // Prepare base parameters
      const queryParams = {
        village_id: location.village_id,
        district_id: location.district_id,
        state_id: location.state_id,
        lang: 'te',
        page: page,
        limit: 5,
        category_id: category !== 'all' ? category : undefined,
      };

      if (isLocationMode && location.village_id) {
        queryParams['feed_mode'] = "village";
      }


      const response = await api.get(endpoints.GET_NEWS_FEED, {
        params: queryParams,
        headers: {
          'x-device-id': deviceId
        }
      });

      return { data: response.data, page }; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2. Get Categories
export const getCategories = createAsyncThunk(
  'news/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.CATEGORY);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 3. Create News
export const createNews = createAsyncThunk(
  'news/createNews',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post(endpoints.CREATE_NEWS, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 4. Update News
export const updateNews = createAsyncThunk(
  'news/updateNews',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const url = endpoints.UPDATE_NEWS.replace(':id', id);
      console.log(url,">>>>>>>>>>>>>>URLLL",payload);
      const response = await api.patch(url, payload); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 5. React to News (Like/Dislike)
export const reactToNews = createAsyncThunk(
  'news/reactToNews',
  async ({ newsId, type }, { rejectWithValue }) => {
    try {
      console.log({ newsId, type },">>>>>>>>>>>>>>>REACTION PAYLOADDDDD");
      const deviceId = await getUniqueId();
      const payload = { news_id: newsId, type: type };
      const response = await api.post(endpoints.GUEST_REACT_LIKE, payload,{
        headers: { 'x-device-id': deviceId }
      }); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 6. Get Comments
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

// 7. Post Comment
export const postComment = createAsyncThunk(
  'news/postComment',
  async ({ newsId, text }, { dispatch, rejectWithValue }) => {
    try {
      const payload = { news_id: newsId, text: text };
      console.log(payload,">>>>>>>>>>>>>>payloadCmment");
      const response = await api.post(endpoints.ADD_COMMENT, payload);
      dispatch(getComments(newsId)); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 8. Track Ad Click
export const trackAdClick = createAsyncThunk(
  'news/trackAdClick',
  async (adId, { rejectWithValue }) => {
    try {
      const payload = { source: "feed", platform: Platform.OS };
      const url = endpoints.TRACK_AD_CLICK.replace(':id', adId);
      const response = await api.post(url, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const viewNews = createAsyncThunk(
  'news/viewNews',
  async (newsId, { rejectWithValue }) => {
    try {
      const deviceId = await getUniqueId();
      const url = endpoints.VIEW_NEWS.replace(':id', newsId);
      const response = await api.post(url, {}, {
        headers: { 'x-device-id': deviceId }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getReporterNews = createAsyncThunk(
  'news/getReporterNews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(endpoints.GET_REPORTER_NEWS);
      console.log(response,">>>>>>>>>>>>>>>>responseeee>>>>>>>>>>>>>>Neews");
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const reportNews = createAsyncThunk(
  'news/reportNews',
  async ({ newsId, reason, message }, { rejectWithValue }) => {
    try {
      console.log(newsId,reason,message,">>>>>>>>>>>>>>>>>>>MESSAGEEEEEE",`${endpoints.REPORT_NEWS}/${newsId}`);
      const response = await api.post(`${endpoints.REPORT_NEWS}/${newsId}`, {
        reason,
        message
      });
      console.log(response,">>>>>>>>>>>>>>>>>>>>>>>REsponseee.....");
      return response.data;
    } catch (error) {
      console.log(error,">>>>>>ERRRRR");
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
    resetNewsStatus: (state) => {
      state.createNewsSuccess = false;
      state.createNewsError = null;
      state.updateNewsSuccess = false;
      state.updateNewsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch News ---
      .addCase(fetchNews.pending, (state, action) => {
        const page = typeof action.meta.arg === 'object' ? action.meta.arg.page : 1;
        if (page === 1 || !page) state.loading = true;
        else state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        const { data, page } = action.payload;
        state.loading = false;
        state.isLoadingMore = false;
        state.currentPage = page;

        // Ensure incomingItems is always an array
        const incomingItems = Array.isArray(data) ? data : (data.items || []);
        console.log(data,">>>>>>>>>>>>>>>>>>>>NEWS LIST");
        if (page === 1) {
          state.articles = data;
        } else {
          // Robust append logic
          if (Array.isArray(state.articles)) {
             state.articles = [...state.articles, ...incomingItems];
          } else if (state.articles?.items) {
             state.articles.items = [...state.articles.items, ...incomingItems];
          }
        }
        state.hasMore = incomingItems.length > 0;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.isLoadingMore = false;
        state.error = action.payload || 'Failed to fetch news';
      })

      // --- Get Categories ---
      .addCase(getCategories.pending, (state) => {
        state.loadingCategories = true;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        console.log(action.payload,">>>>>>>>>>>>>>>>>>>>>>>>VVaction.payload");
        state.categories = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload.items || []);
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loadingCategories = false;
        console.log("Error fetching categories:", action.payload);
      })

      // --- Create News ---
      .addCase(createNews.pending, (state) => {
        state.isCreatingNews = true;
        state.createNewsSuccess = false;
        state.createNewsError = null;
      })
      .addCase(createNews.fulfilled, (state) => {
        state.isCreatingNews = false;
        state.createNewsSuccess = true;
      })
      .addCase(createNews.rejected, (state, action) => {
        state.isCreatingNews = false;
        state.createNewsError = action.payload;
      })

      // --- Update News ---
      .addCase(updateNews.pending, (state) => {
        state.isUpdatingNews = true;
        state.updateNewsSuccess = false;
        state.updateNewsError = null;
      })
      .addCase(updateNews.fulfilled, (state) => {
        state.isUpdatingNews = false;
        state.updateNewsSuccess = true;
      })
      .addCase(updateNews.rejected, (state, action) => {
        state.isUpdatingNews = false;
        state.updateNewsError = action.payload;
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

      // --- Post Comment ---
      .addCase(postComment.pending, (state) => {
        state.isPostingComment = true;
        state.interactionError = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        state.isPostingComment = false;
        const { newsId } = action.meta.arg;
        
        // Optimistic Update for comments count
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
        state.reporterNews = Array.isArray(action.payload) ? action.payload : (action.payload.items || []);
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

export const { 
  setSelectedCategory, 
  clearNews, 
  setRefreshing, 
  setMockNews, 
  resetNewsStatus 
} = newsSlice.actions;

export default newsSlice.reducer;