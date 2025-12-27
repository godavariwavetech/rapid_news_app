export const baseURL = 'https://lswhmhls-7777.inc1.devtunnels.ms'; 

export const endpoints = {
  REQUEST_LOGIN_OPT:'OwnerLogin',
  VERIFY_LOGIN_OPT:'OwnerLoginwithOtp',
  REGISTER_USER:'updateOwnerdetails',
  
  RESOLVE_LOCATION: 'location/resolve',
  GET_NEWS_FEED: 'news/feed',
  GUEST_REACT_LIKE: 'reactions',
  // Usage: replace :id with news_id
  GET_COMMENTS: 'comments/:id',
  GET_REACTION_COUNTS: 'reactions/:id',

  // --- User (Logged In) ---
  ADD_COMMENT: 'comments',

  // --- Reporter ---
  CREATE_NEWS: 'news',
  CREATE_CATEGORY: 'categories',
  // Reporter/User Auth
  AUTH_REQUEST_OTP: 'auth/request-otp',
  AUTH_VERIFY_OTP: 'auth/verify-otp',

  // --- Admin & Editor Auth ---
  ADMIN_LOGIN: 'admin-auth/login',
  ADMIN_VERIFY_OTP: 'admin-auth/verify-otp',
  ADMIN_SET_PASSWORD: 'admin-auth/set-password',
  ADMIN_REQUEST_RESET: 'admin-auth/request-reset',

  // --- Admin & Editor Actions ---
  ADMIN_OVERVIEW: 'admin/overview',
  // Usage: replace :id with news_id
  APPROVE_NEWS: 'news/:id/approve',

  // --- System ---
  HEALTH_CHECK: '/',
};
