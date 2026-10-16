export const getArticleImageDimensions = (screenWidth, screenHeight) => ({
  width: screenWidth,
  height: screenHeight * (screenHeight / screenWidth < 1.6 ? 0.3 : 0.4),
});
