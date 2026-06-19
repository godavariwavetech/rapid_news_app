// export const baseURL = 'https://lswhmhls-7777.inc1.devtunnels.ms';
// export const baseURL = 'https://6pqk8p41-7777.inc1.devtunnels.ms';
// export const baseURL = 'https://95q8fjss-7777.inc1.devtunnels.ms'; // dev tunnel (this session's backend)
// export const baseURL = "https://godavariwave.in:7777";
export const baseURL = "https://api.rapidnewsnetwork.in" // PRODUCTION (from teammate's main)


export const endpoints = {
  REQUEST_LOGIN_OPT: 'OwnerLogin',
  VERIFY_LOGIN_OPT: 'OwnerLoginwithOtp',
  REGISTER_USER: 'updateOwnerdetails',

  RESOLVE_LOCATION: 'location/resolve',
  GET_NEWS_FEED: 'news/feed',
  GET_TOP_STORIES: 'top-stories',
  GET_MAGAZINE_FEED: 'magazines/feed',
  GET_VIRAL_MAGAZINES: 'magazines/viral',
  GET_MAGAZINE: 'magazines/:id',
  SHARE_MAGAZINE: 'magazines/:id/share',
  GET_LIVE_CRICKET: 'cricket/live',
  GET_CRICKET_MATCH: 'cricket/:matchId',
  GET_LIVE_EXAMS: 'exams/live',
  GET_EXAMS: 'exams',
  GET_EXAM_RESULT: 'exams/:id/result',
  GET_ARTICLE: 'news/article/:id',
  GUEST_REACT_LIKE: 'reactions',
  VIEW_NEWS: 'views/news/:id',

  GET_DISTRICTS: 'location/districts',
  GET_STATES: 'location/states',
  GET_COMMENTS: 'comments/:id',
  GET_REACTION_COUNTS: 'reactions/:id',


  ADD_COMMENT: 'comments',

  CREATE_NEWS: 'news',
  UPDATE_NEWS: 'news/:id/edit',
  CATEGORY: 'categories',
  GET_REPORTER_NEWS: 'news/myNews',
  AUTH_REQUEST_OTP: 'auth/request-otp',
  AUTH_VERIFY_OTP: 'auth/verify-otp',
  APPLY_REPORTER: 'users/apply-reporter',
  GET_USER_PROFILE: 'users/my-profile',

  GET_STATS: 'news/myStats',

  TRACK_AD_CLICK: 'ads/:id/click',

  BOOKMARK_NEWS: 'bookmarks/news/:id',
  GET_BOOKMARKS: 'bookmarks',

  REPORT_NEWS: 'news-reports/news',

  GOOGLE_LOGIN: 'users/google-login',
  POST_FCM_TOKEN: 'users/register-fcm',
  FEEDBACK: 'feedback',
  START_ACTIVITY: 'activity/start',
  END_ACTIVITY: 'activity/end',
  REGISTER_GUEST: 'users/register-guest'
};