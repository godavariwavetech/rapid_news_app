// Repair sessions saved by builds that did not clear userToken on logout or
// set isAuthenticated after Google login. A token without its account is stale.
export const migrateAuthSession = state => {
  if (!state) return state;
  const auth = state.auth || {};
  const userToken = auth.user ? auth.userToken : null;
  const reporterToken = auth.reporter ? auth.reporterToken : null;
  return {
    ...state,
    auth: {
      ...auth,
      userToken,
      reporterToken,
      isAuthenticated: !!(userToken || reporterToken),
      loading: false,
      error: null,
    },
    location: {...state.location, tempReporterToken: null},
  };
};
