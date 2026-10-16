module.exports = {
  preset: 'react-native',
  // immer (via @reduxjs/toolkit) ships ESM only — the RN preset skips node_modules,
  // so it has to be allow-listed for reducer tests to load the store slices.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|@react-navigation|react-native|@reduxjs/toolkit|immer|redux|reselect)/)',
  ],
};
