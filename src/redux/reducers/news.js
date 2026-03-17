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

  isSubmittingFeedback: false,
  feedbackSuccess: false,
  feedbackError: null,

  notificationArticle: null,

  // --- Unread News State ---
  unreadArticles: [],
  isLoadingUnread: false,
  unreadError: null,
  unreadCount: 0,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (arg = 'all', { getState, rejectWithValue }) => {
    let category = 'all';
    let page = 1;
    let location = {
      village_id: "697d8135322a103bdabf0fc7",
      district_id: "697d8135322a103bdabf0fc5",
      state_id: "697d8135322a103bdabf0fc3",
    };
    let isLocationMode = false;

    if (typeof arg === 'object') {
      category = arg.category || 'all';
      page = arg.page || 1;
      isLocationMode = arg.isLocationMode || false; 
      
      // --- ADDED FALLBACKS TO PREVENT EMPTY IDs ---
      location = {
        village_id: arg.currentLocation?.village?._id || location.village_id,
        district_id: arg.currentLocation?.district?._id || location.district_id,
        state_id: arg.currentLocation?.state?._id || location.state_id,
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
        limit: 10,
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

      console.log(response.data,">>>>>>>>>>>>>>>.response.data");

      return { data: response.data, page }; 
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 1.1 Fetch Article By Id
export const fetchArticleById = createAsyncThunk(
  'news/fetchArticleById',
  async (id, { rejectWithValue }) => {
    try {
      const deviceId = await getUniqueId();
      const url = endpoints.GET_ARTICLE.replace(':id', id);
      const response = await api.get(url,{},{
         headers: {
          'x-device-id': deviceId
        }
      });
      return response.data;
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
      console.log(response,">>>>>>>>>>>>>>>RESPONSEEEE");
      return response.data; 
    } catch (error) {
      console.log(error,">>>>>>>>>>..vss");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reportNews = createAsyncThunk(
  'news/reportNews',
  async ({ newsId, reason, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`${endpoints.REPORT_NEWS}/${newsId}`, {
        reason,
        message
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const postFeedback = createAsyncThunk(
  'news/postFeedback',
  async ({ message }, { getState, rejectWithValue }) => {
    try {
      const deviceId = await getUniqueId();

      const response = await api.post(endpoints.FEEDBACK, { message },  {headers: {
          'x-device-id': deviceId
        }});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Unread News
export const fetchUnreadNews = createAsyncThunk(
  'news/fetchUnreadNews',
  async (lastSeenAt, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Get location from the location reducer
      const location = state.location?.currentLocation || {};
      const deviceId = await getUniqueId();

      // Fallback to default IDs if currentLocation is missing
      const queryParams = {
        village_id: location.village?._id || "697d8135322a103bdabf0fc7",
        district_id: location.district?._id || "697d8135322a103bdabf0fc5",
        state_id: location.state?._id || "697d8135322a103bdabf0fc3",
        last_seen_at:"2026-03-11T10:28:46.000Z",
      };

      const response = await api.get('/news/unread', {
        params: queryParams,
        headers: {
          'x-device-id': deviceId
        }
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitSurveyVote = createAsyncThunk(
  'news/submitSurveyVote',
  async ({ surveyId, optionId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Check if the user has an ACTUAL token in Redux
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;
      
      const payload = { option_index : optionId };
      let config = {};

      // If they don't have a real token, act as a guest
      if (!hasToken) {
        const deviceId = await getUniqueId();
        config = {
          headers: {
            'x-device-id': deviceId
          },
          skipAuth: true
        };
      }

      console.log(payload,">>>>>>>>PAYLOADDDD",optionId);

      const response = await api.post(`/surveys/${surveyId}/vote`, payload, config); 

      console.log(response,">>>>>>>>>>>>Responseeeeeee>>>>>>>VOTESSS");
      
      return { surveyId, optionId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- ADDED: Mark Feed as Read ---
export const markUnreadNewsAsRead = createAsyncThunk(
  'news/markUnreadNewsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const deviceId = await getUniqueId();
      const response = await api.post('/news/feed/read', {}, {
        headers: {
          'x-device-id': deviceId
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Fetch Unread News Count (For Guests & Users)
export const fetchUnreadNewsCount = createAsyncThunk(
  'news/fetchUnreadNewsCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { userToken, reporterToken, guestLastActiveDate } = state.auth;
      const location = state.location?.currentLocation || {};
      const deviceId = await getUniqueId();

      // Determine the last_seen_at date
      // Fallback to 24 hours ago if guestLastActiveDate is null
      let lastSeenAt = guestLastActiveDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const queryParams = {
        last_seen_at: lastSeenAt,
        // Optional: you can pass location if your API counts by region
        village_id: location.village?._id || "697d8135322a103bdabf0fc7",
        district_id: location.district?._id || "697d8135322a103bdabf0fc5",
        state_id: location.state?._id || "697d8135322a103bdabf0fc3",
      };

      const response = await api.get('/news/unread/count', {
        params: queryParams,
        headers: {
          'x-device-id': deviceId
        }
      });

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
    resetNewsStatus: (state) => {
      state.createNewsSuccess = false;
      state.createNewsError = null;
      state.updateNewsSuccess = false;
      state.updateNewsError = null;
    },
    resetFeedbackStatus: (state) => {
      state.feedbackSuccess = false;
      state.feedbackError = null;
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

        let incomingItems = Array.isArray(data) ? data : (data.items || []);
        
        if (page === 1) {
          if (state.notificationArticle) {
            const article = state.notificationArticle;
            const filtered = incomingItems.filter(item => 
              (item.data ? item.data._id : item._id) !== (article.data ? article.data._id : article._id)
            );
            incomingItems = [article, ...filtered];
            
            if (Array.isArray(data)) {
              state.articles = incomingItems;
            } else {
              state.articles = { ...data, items: incomingItems };
            }
          } else {
            state.articles = data;
          }
        } else {
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

      // --- Fetch Article By Id ---
      .addCase(fetchArticleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action) => {
        state.loading = false;
        let article = action.payload;
        
        if (!article.data) {
          article = { data: article, type: 'NEWS' };
        }

        state.notificationArticle = article;

        if (Array.isArray(state.articles)) {
          const filtered = state.articles.filter(item => 
            (item.data ? item.data._id : item._id) !== (article.data ? article.data._id : article._id)
          );
          state.articles = [article, ...filtered];
        } else if (state.articles?.items) {
          const filtered = state.articles.items.filter(item => 
            (item.data ? item.data._id : item._id) !== (article.data ? article.data._id : article._id)
          );
          state.articles.items = [article, ...filtered];
        } else {
          state.articles = [article];
        }
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch article';
      })

      // --- React To News (Optimistic Update Across All Lists) ---
      .addCase(reactToNews.pending, (state, action) => {
        const { newsId, type } = action.meta.arg;
        
        const updateReactionCount = (itemsList) => {
          if (!Array.isArray(itemsList)) return;
          
          const index = itemsList.findIndex(item => (item.data ? item.data._id === newsId : item._id === newsId));
          
          if (index !== -1) {
            let target = itemsList[index].data || itemsList[index];
            
            // Ensure reactions object exists
            if (!target.reactions) {
              target.reactions = { likes: 0, dislikes: 0, my_reaction: null };
            }
            
            const prevReaction = target.reactions.my_reaction;
            
            // Step 1: Remove old reaction numbers
            if (prevReaction === 'LIKE') {
              target.reactions.likes = Math.max(0, (target.reactions.likes || 0) - 1);
            } else if (prevReaction === 'DISLIKE') {
              target.reactions.dislikes = Math.max(0, (target.reactions.dislikes || 0) - 1);
            }
            
            // Step 2: Add new reaction numbers
            if (type === 'LIKE') {
              target.reactions.likes = (target.reactions.likes || 0) + 1;
            } else if (type === 'DISLIKE') {
              target.reactions.dislikes = (target.reactions.dislikes || 0) + 1;
            }
            
            // Step 3: Update my_reaction
            target.reactions.my_reaction = type === 'NONE' ? null : type;
          }
        };

        // Apply update to Main Feed
        if (state.articles?.items) updateReactionCount(state.articles.items);
        else if (Array.isArray(state.articles)) updateReactionCount(state.articles);
        
        // Apply update to Unread News Feed
        updateReactionCount(state.unreadArticles);
        
        // Apply update to Reporter News Feed
        updateReactionCount(state.reporterNews);
        
        // Apply update to active Notification Article
        if (state.notificationArticle) updateReactionCount([state.notificationArticle]);
      })

      // --- Get Categories ---
      .addCase(getCategories.pending, (state) => {
        state.loadingCategories = true;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        state.categories = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload.items || []);
      })

      // --- Post Comment ---
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

      // --- Fetch Unread News ---
      .addCase(fetchUnreadNews.pending, (state) => {
        state.isLoadingUnread = true;
        state.unreadError = null;
      })
      .addCase(fetchUnreadNews.fulfilled, (state, action) => {
        state.isLoadingUnread = false;
        
        const data = action.payload;
        console.log(data,">>>>>>>>>>>>>>>>UNREAD NEWS");
        let incomingItems = Array.isArray(data) ? data : (data.items || data.data || []);
        
        state.unreadArticles = incomingItems;
      })
      .addCase(fetchUnreadNews.rejected, (state, action) => {
        state.isLoadingUnread = false;
        state.unreadError = action.payload || 'Failed to fetch unread news';
      })

      .addCase(fetchUnreadNewsCount.fulfilled, (state, action) => {
        // Adjust this depending on your API response structure 
        // (e.g., if it returns { count: 5 } vs just a number)
        state.unreadCount = action.payload?.count || action.payload?.data?.count || (typeof action.payload === 'number' ? action.payload : 0);
      })
      
      .addCase(submitSurveyVote.fulfilled, (state, action) => {
        const { surveyId, optionId } = action.payload;
        
        const updateSurveyData = (itemsList) => {
          if (!Array.isArray(itemsList)) return;
          const index = itemsList.findIndex(item => 
            (item.data && item.data._id === surveyId) || (item.id === surveyId)
          );
          
          if (index !== -1) {
            let targetSurvey = itemsList[index].data || itemsList[index];
            targetSurvey.user_voted = true;
            targetSurvey.voted_option_id = optionId;
            targetSurvey.total_votes = (targetSurvey.total_votes || 0) + 1;
            
            if (Array.isArray(targetSurvey.options)) {
              const optIndex = targetSurvey.options.findIndex(opt => opt._id === optionId);
              if (optIndex !== -1) {
                targetSurvey.options[optIndex].votes = (targetSurvey.options[optIndex].votes || 0) + 1;
              }
            }
          }
        };

        if (state.articles?.items) {
          updateSurveyData(state.articles.items);
        } else if (Array.isArray(state.articles)) {
          updateSurveyData(state.articles);
        }
      });
  },
});

export const { 
  setSelectedCategory, 
  clearNews, 
  setRefreshing, 
  setMockNews, 
  resetNewsStatus,
  resetFeedbackStatus 
} = newsSlice.actions;

export default newsSlice.reducer;