import { getNewsCommentCount } from '../src/utils/newsCommentCount';

test('linked article comments render a number even when the API count is zero', () => {
  expect(getNewsCommentCount({ enabled: true, count: 0 })).toBe(0);
  expect(getNewsCommentCount({ enabled: false, count: 4 })).toBe(4);
  expect(getNewsCommentCount(3)).toBe(3);
  for (const comments of [undefined, null, {}, { enabled: true }, { count: 'bad' }]) {
    expect(getNewsCommentCount(comments)).toBe(0);
  }
});
