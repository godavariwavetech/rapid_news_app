import {Animated, Easing} from 'react-native';

// Enter from below; dismiss upward to reveal the original article in place.
export function linkedArticleCardInterpolator({current, closing, layouts}, exitDirection = -1) {
  const offset = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height, 0],
    extrapolate: 'clamp',
  });
  const direction = Animated.add(
    Animated.subtract(1, closing),
    Animated.multiply(closing, exitDirection),
  );

  return {
    cardStyle: {
      transform: [{translateY: Animated.multiply(offset, direction)}],
    },
  };
}

const transition = {
  animation: 'timing',
  config: {duration: 240, easing: Easing.out(Easing.quad)},
};

export const linkedArticleTransition = {
  detachPreviousScreen: false,
  gestureEnabled: false,
  cardOverlayEnabled: false,
  cardStyleInterpolator: linkedArticleCardInterpolator,
  transitionSpec: {open: transition, close: transition},
};
