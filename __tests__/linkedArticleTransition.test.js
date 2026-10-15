import {Animated} from 'react-native';
import {linkedArticleCardInterpolator} from '../src/navigation/linkedArticleTransition';

function offset(progress, closing, exitDirection) {
  const style = linkedArticleCardInterpolator({
    current: {progress: new Animated.Value(progress)},
    closing: new Animated.Value(closing),
    layouts: {screen: {height: 800}},
  }, exitDirection);
  return style.cardStyle.transform[0].translateY.__getValue();
}

test('enters from below and keeps the covered source in place', () => {
  expect(offset(0, 0, new Animated.Value(-1))).toBe(800);
  expect(offset(1, 0, new Animated.Value(-1))).toBe(0);
  expect(offset(1, 1, new Animated.Value(1))).toBe(0);
});

test('dismisses in either swipe direction without replacing the interpolator', () => {
  const direction = new Animated.Value(-1);
  expect(offset(0.5, 1, direction)).toBe(-400);
  direction.setValue(1);
  expect(offset(0.5, 1, direction)).toBe(400);
  expect(offset(1, 1, direction)).toBe(0);
});
