export const getNewsCommentCount = comments => {
  const count = typeof comments === 'number' ? comments : comments?.count;
  return typeof count === 'number' && Number.isFinite(count) ? Math.max(0, count) : 0;
};
