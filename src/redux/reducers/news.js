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
  currentDayOffset: 0,
  hasMore: true,
  isLocationMode: false,

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
  isLoadingMoreUnread: false,
  unreadHasMore: false,
  unreadPage: 1,
  unreadError: null,

  // --- Unread Count State (Added for Header Badge) ---
  unreadCount: 0,
  totalNews: 0,
  todayTotalNews: 0,
};

// --- ASYNC THUNKS ---

// 1. Fetch News List
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (arg = 'all', { getState, rejectWithValue }) => {
    let category = 'all';
    let page = 1;
    let current_day_offset = 0;
    let location = {
      village_id: "697d8135322a103bdabf0fc7",
      district_id: "697d8135322a103bdabf0fc5",
      state_id: "697d8135322a103bdabf0fc3",
    };
    let isLocationMode = false;

    if (typeof arg === 'object') {
      category = arg.category || 'all';
      page = arg.page || 1;
      current_day_offset = arg.current_day_offset || 0;
      isLocationMode = arg.isLocationMode || false;
      location = {
        village_id: arg.currentLocation?.village?._id || "697d8135322a103bdabf0fc7",
        district_id: arg.currentLocation?.district?._id || "697d8135322a103bdabf0fc5",
        state_id: arg.currentLocation?.state?._id || "697d8135322a103bdabf0fc3",
      };
    }


    try {
      const deviceId = await getUniqueId();
      const state = getState();
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;

      // Prepare base parameters
      const queryParams = {
        village_id: location.village_id,
        district_id: location.district_id,
        state_id: location.state_id,
        lang: 'te',
        page: page,
        limit: 10,
        category_id: category !== 'all' ? category : undefined,
        // current_day_offset: current_day_offset,
      };





      if (isLocationMode && location.village_id) {
        queryParams['feed_mode'] = "village";
      }

      const config = { params: queryParams };
      if (!hasToken) {
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }

      const response = await api.get(endpoints.GET_NEWS_FEED, config);

      return { data: response.data, page, current_day_offset, isLocationMode };
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
      const response = await api.get(url, {}, {
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
  async ({ newsId, type }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;
      const payload = { news_id: newsId, type: type };

      const config = {};
      if (!hasToken) {
        const deviceId = await getUniqueId();
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }

      const response = await api.post(endpoints.GUEST_REACT_LIKE, payload, config);

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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reportNews = createAsyncThunk(
  'news/reportNews',
  async ({ newsId, reason, message }, { getState, rejectWithValue }) => {
    try {
      // 1. Check if the user is logged in by looking for a token in the auth state
      const state = getState();
      const hasToken = state.auth?.userToken || state.auth?.reporterToken;

      // 2. Prepare custom headers
      const headers = {};

      if (!hasToken) {
        // If there is NO token, send the device ID and strip the Authorization header
        const deviceId = await getUniqueId();
        headers['x-device-id'] = deviceId;
        headers['Authorization'] = ''; // Overrides any default Authorization header
      }

      // 3. Make the API call with dynamic headers
      const response = await api.post(`${endpoints.REPORT_NEWS}/${newsId}`, {
        reason,
        message
      }, {
        headers
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

      const response = await api.post(endpoints.FEEDBACK, { message }, {
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

// Fetch Unread News
export const fetchUnreadNews = createAsyncThunk(
  'news/fetchUnreadNews',
  async (arg, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { userToken, reporterToken } = state.auth;
      const location = state.location?.currentLocation || {};
      const hasToken = userToken || reporterToken;

      // arg can be a lastSeenAt string (legacy) or an object { lastSeenAt, page }
      const lastSeenAt = typeof arg === 'string' ? arg : arg?.lastSeenAt;
      const page = typeof arg === 'object' ? (arg?.page || 1) : 1;

      const queryParams = {
        village_id: location.village?._id || "697d8135322a103bdabf0fc7",
        district_id: location.district?._id || "697d8135322a103bdabf0fc5",
        state_id: location.state?._id || "697d8135322a103bdabf0fc3",
        last_seen_at: lastSeenAt || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        page,
        limit: 10,
      };

      const config = { params: queryParams };

      if (!hasToken) {
        const deviceId = await getUniqueId();
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }

      const response = await api.get('/news/unread', config);
      return { data: response.data, page };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- Fetch Unread News Count (For Guests & Users) ---
export const fetchUnreadNewsCount = createAsyncThunk(
  'news/fetchUnreadNewsCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { guestLastActiveDate, userToken, reporterToken } = state.auth;
      const location = state.location?.currentLocation || {};
      const hasToken = userToken || reporterToken;

      let lastSeenAt = guestLastActiveDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();


      const queryParams = {
        last_seen_at: lastSeenAt,
        village_id: location.village?._id || "697d8135322a103bdabf0fc7",
        district_id: location.district?._id || "697d8135322a103bdabf0fc5",
        state_id: location.state?._id || "697d8135322a103bdabf0fc3",
      };

      const config = { params: queryParams };

      if (!hasToken) {
        // Guest — send device ID, skip auth header
        const deviceId = await getUniqueId();
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }
      // Logged-in user — api interceptor sends Authorization automatically, no device ID needed

      const response = await api.get('/news/unread/count', config);

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
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;

      const payload = { option_index: optionId };
      let config = {};

      if (!hasToken) {
        const deviceId = await getUniqueId();
        config = {
          headers: {
            'x-device-id': deviceId
          },
          skipAuth: true
        };
      }

      const response = await api.post(`/surveys/${surveyId}/vote`, payload, config);


      return { surveyId, optionId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- Mark Articles as Read (batched) ---
export const markNewsAsRead = createAsyncThunk(
  'news/markNewsAsRead',
  async (newsIds, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const hasToken = state.auth?.reporterToken || state.auth?.userToken;
      const config = {};
      if (!hasToken) {
        const deviceId = await getUniqueId();
        config.headers = { 'x-device-id': deviceId };
        config.skipAuth = true;
      }
      const response = await api.post('/news/feed/read', { news_ids: newsIds }, config);
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
      state.currentDayOffset = 0;
      state.hasMore = true;
      state.isLocationMode = false;
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
        const arg = action.meta.arg;
        const page = typeof arg === 'object' ? arg.page : 1;
        const offset = typeof arg === 'object' ? (arg.current_day_offset ?? 0) : 0;
        // Only a true refresh: page 1 with offset 0 (pull-to-refresh or initial load)
        const isRefresh = page === 1 && offset === 0;

        if (isRefresh) state.loading = true;
        else state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        const { data, page, current_day_offset, isLocationMode } = action.payload;
        state.loading = false;
        state.isLoadingMore = false;

        const pagination = data?.pagination;

        // Snapshot the batch totals BEFORE updating global state so each item
        // can carry its own total — prevents the counter from jumping on the
        // currently-visible card when the next page loads in the background.
        const batchTodayTotal = pagination?.today_total_news ?? null;
        const batchTotal = pagination?.total_news ?? null;

        if (pagination) {
          if (pagination.today_total_news != null) {
            state.todayTotalNews = pagination.today_total_news;
          }
          if (pagination.total_news != null) {
            state.totalNews = pagination.total_news;
          }
          if (pagination.current_day_offset != null) {
            state.currentDayOffset = pagination.current_day_offset;
          }
          // Always store the page we actually fetched
          state.currentPage = page;
          state.hasMore = true;
        } else {
          state.currentPage = page;
          state.hasMore = false;
        }

        let incomingItems = Array.isArray(data) ? data : (data.items || data.data || []);

        // Stamp each item with the totals from its own API response so that
        // FlipNewsScreen can use a stable value per card instead of the
        // ever-updating global Redux totals.
        if (batchTodayTotal != null || batchTotal != null) {
          incomingItems = incomingItems.map(item => ({
            ...item,
            _batch_today_total: batchTodayTotal,
            _batch_total: batchTotal,
          }));
        }

        // Only replace the list on a true refresh: mode switch OR explicit page-1 pull-to-refresh
        // A day-offset change is NOT a refresh — it's a continuation, items must be appended
        const modeChanged = isLocationMode !== state.isLocationMode;
        const isRefresh = modeChanged || (page === 1 && current_day_offset === 0);

        // Track current mode so we can detect future switches
        state.isLocationMode = isLocationMode;

        if (isRefresh) {
          // Only prepend notification article on main-feed refreshes, not location feed
          if (state.notificationArticle && !isLocationMode) {
            const article = state.notificationArticle;
            const filtered = incomingItems.filter(item =>
              (item.data ? item.data._id : item._id) !== (article.data ? article.data._id : article._id)
            );
            incomingItems = [article, ...filtered];
            state.articles = { ...data, items: incomingItems };
            // Clear after use so it doesn't re-prepend on the next refresh
            state.notificationArticle = null;
          } else {
            // Store with annotated items so batch totals are preserved
            state.articles = Array.isArray(data) ? incomingItems : { ...data, items: incomingItems };
          }
        } else {
          // Append logic — only append if mode hasn't changed
          if (Array.isArray(state.articles)) {
            const existingIds = new Set(state.articles.map(i => i.data?._id || i._id));
            const unique = incomingItems.filter(i => !existingIds.has(i.data?._id || i._id));
            state.articles = [...state.articles, ...unique];
          } else if (state.articles?.items) {
            const existingIds = new Set(state.articles.items.map(i => i.data?._id || i._id));
            const unique = incomingItems.filter(i => !existingIds.has(i.data?._id || i._id));
            state.articles.items = [...state.articles.items, ...unique];
          } else {
            // If articles was empty or null
            state.articles = { ...data, items: incomingItems };
          }
        }
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.isLoadingMore = false;
        state.error = action.payload || 'Failed to fetch news';
      })

      // --- Fetch Article By Id ---
      .addCase(fetchArticleById.pending, (state) => {
        // Use a separate flag — don't touch `loading` so HomeScreen feed isn't blocked
        state.error = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action) => {
        let article = action.payload;

        if (!article.data) {
          article = { data: article, type: 'NEWS' };
        }

        state.notificationArticle = article;

        // Only prepend to an already-loaded feed. If articles is empty the feed
        // hasn't loaded yet — fetchNews (page 1) will pick up notificationArticle
        // and prepend it then, avoiding a double-insert / flash on app open.
        const existingItems = Array.isArray(state.articles)
          ? state.articles
          : (state.articles?.items || []);

        if (existingItems.length > 0) {
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
          }
        }
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch article';
      })

      // --- React To News (Optimistic Update) ---
      .addCase(reactToNews.pending, (state, action) => {
        const { newsId, type } = action.meta.arg;

        const updateReactionCount = (itemsList) => {
          if (!Array.isArray(itemsList)) return;

          const index = itemsList.findIndex(item => (item.data ? item.data._id === newsId : item._id === newsId));

          if (index !== -1) {
            let target = itemsList[index].data || itemsList[index];

            if (!target.reactions) {
              target.reactions = { likes: 0, dislikes: 0, my_reaction: null };
            }

            const prevReaction = target.reactions.my_reaction;

            if (prevReaction === 'LIKE') {
              target.reactions.likes = Math.max(0, (target.reactions.likes || 0) - 1);
            } else if (prevReaction === 'DISLIKE') {
              target.reactions.dislikes = Math.max(0, (target.reactions.dislikes || 0) - 1);
            }

            if (type === 'LIKE') {
              target.reactions.likes = (target.reactions.likes || 0) + 1;
            } else if (type === 'DISLIKE') {
              target.reactions.dislikes = (target.reactions.dislikes || 0) + 1;
            }

            target.reactions.my_reaction = type === 'NONE' ? null : type;
          }
        };

        if (state.articles?.items) updateReactionCount(state.articles.items);
        else if (Array.isArray(state.articles)) updateReactionCount(state.articles);

        updateReactionCount(state.unreadArticles);
        updateReactionCount(state.reporterNews);
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

      // --- Get Reporter News (ADDED) ---
      .addCase(getReporterNews.pending, (state) => {
        state.isLoadingReporterNews = true;
      })
      .addCase(getReporterNews.fulfilled, (state, action) => {
        state.isLoadingReporterNews = false;
        state.reporterNews = Array.isArray(action.payload) ? action.payload : (action.payload?.items || action.payload?.data || []);
      })
      .addCase(getReporterNews.rejected, (state) => {
        state.isLoadingReporterNews = false;
      })

      // --- Create News (ADDED) ---
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
        state.createNewsError = action.payload || 'Failed to create news';
      })

      // --- Update News (ADDED) ---
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
        state.updateNewsError = action.payload || 'Failed to update news';
      })

      // --- Post Feedback (ADDED) ---
      .addCase(postFeedback.pending, (state) => {
        state.isSubmittingFeedback = true;
        state.feedbackSuccess = false;
        state.feedbackError = null;
      })
      .addCase(postFeedback.fulfilled, (state) => {
        state.isSubmittingFeedback = false;
        state.feedbackSuccess = true;
      })
      .addCase(postFeedback.rejected, (state, action) => {
        state.isSubmittingFeedback = false;
        state.feedbackError = action.payload || 'Failed to submit feedback';
      })

      // --- Get Comments (ADDED) ---
      .addCase(getComments.pending, (state) => {
        state.isLoadingComments = true;
        state.interactionError = null;
      })
      .addCase(getComments.fulfilled, (state, action) => {
        state.isLoadingComments = false;
        state.currentComments = action.payload?.items || action.payload || [];
      })
      .addCase(getComments.rejected, (state, action) => {
        state.isLoadingComments = false;
        state.interactionError = action.payload || 'Failed to fetch comments';
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
      .addCase(fetchUnreadNews.pending, (state, action) => {
        const page = typeof action.meta.arg === 'object' ? action.meta.arg?.page : 1;
        if (page > 1) state.isLoadingMoreUnread = true;
        else state.isLoadingUnread = true;
        state.unreadError = null;
      })
      .addCase(fetchUnreadNews.fulfilled, (state, action) => {
        state.isLoadingUnread = false;
        state.isLoadingMoreUnread = false;
        const { data, page } = action.payload;
        let incomingItems = Array.isArray(data) ? data : (data.items || data.data || []);
        const pagination = data?.pagination;
        state.unreadPage = page;
        if (pagination) {
          state.unreadHasMore = pagination.end != null && pagination.total_news != null
            ? pagination.end < pagination.total_news
            : incomingItems.length >= 10;
        } else {
          state.unreadHasMore = incomingItems.length >= 10;
        }
        if (page === 1) {
          state.unreadArticles = incomingItems;
        } else {
          const existingIds = new Set(state.unreadArticles.map(i => i.data?._id || i._id));
          const unique = incomingItems.filter(i => !existingIds.has(i.data?._id || i._id));
          state.unreadArticles = [...state.unreadArticles, ...unique];
        }
      })
      .addCase(fetchUnreadNews.rejected, (state, action) => {
        state.isLoadingUnread = false;
        state.isLoadingMoreUnread = false;
        state.unreadError = action.payload || 'Failed to fetch unread news';
      })

      // --- Fetch Unread News Count ---
      .addCase(fetchUnreadNewsCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload?.unread_news || action.payload?.count || 0;
      })

      // --- Submit Survey Vote ---
      .addCase(submitSurveyVote.fulfilled, (state, action) => {
        const { surveyId, optionId, data } = action.payload;

        const updateSurveyData = (itemsList) => {
          if (!Array.isArray(itemsList)) return;

          // Match by id or _id
          const index = itemsList.findIndex(item =>
            (item.data && item.data.id === surveyId) ||
            (item.data && item.data._id === surveyId) ||
            (item.id === surveyId) ||
            (item._id === surveyId)
          );

          if (index !== -1) {
            let targetSurvey = itemsList[index].data || itemsList[index];
            targetSurvey.user_voted = true;
            targetSurvey.voted_option_id = optionId;

            // Check if API only returned a "Vote recorded" message (no real stats)
            const isMessageOnly = data?.message === "Vote recorded" && !data?.options && typeof data?.totalVotes === 'undefined' && typeof data?.total_votes === 'undefined';

            if (!isMessageOnly) {
              // Update completely if API returns the new values
              if (data?.options) {
                targetSurvey.options = data.options;
                targetSurvey.totalVotes = data.totalVotes || data.total_votes || targetSurvey.totalVotes || targetSurvey.total_votes;
                targetSurvey.total_votes = targetSurvey.totalVotes; // Sync both keys just in case
              } else {
                // Optimistic update locally
                targetSurvey.totalVotes = (targetSurvey.totalVotes || targetSurvey.total_votes || 0) + 1;
                targetSurvey.total_votes = targetSurvey.totalVotes;

                if (Array.isArray(targetSurvey.options) && targetSurvey.options[optionId]) {
                  targetSurvey.options[optionId].votes = (targetSurvey.options[optionId].votes || 0) + 1;
                }
              }
            }
          }
        };

        if (state.articles?.items) updateSurveyData(state.articles.items);
        else if (Array.isArray(state.articles)) updateSurveyData(state.articles);
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