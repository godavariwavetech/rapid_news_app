import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Way2NewsCard from '../components/Way2NewsCard';
import { MOCK_NEWS } from '../utils/constants';

// --- PHYSICS CONFIGURATION ---
const SPRING_CONFIG = {
  mass: 1,
  damping: 40,
  stiffness: 300,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// 1. Memoized Card with Explicit Height
const MemoizedCard = React.memo(({ newsItem, height, onPress, onCommentsPress }) => {
  if (!newsItem) return null;
  return (
    <View style={{ height }}>
      <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} />
    </View>
  );
}, (prev, next) => prev.newsItem?.id === next.newsItem?.id && prev.height === next.height);

// 2. CardHalf
const CardHalf = React.memo(({ newsItem, side, height, onPress, onCommentsPress }) => {
  const halfHeight = height / 2;
  const isTop = side === 'top';
  return (
    <View style={styles.halfCardContainer}>
      <View style={[styles.innerContainer, { height, top: isTop ? 0 : -halfHeight }]}>
        <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} />
      </View>
    </View>
  );
});

const FlipNewsScreen = ({ toggleUI, hideUI, onCommentsPress }) => {
  const [currIndex, setCurrIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0); // 0 = none, 1 = next, -1 = prev

  const getIndex = useCallback((i) => {
    const len = MOCK_NEWS.length;
    return ((i % len) + len) % len;
  }, []);

  const currentNews = useMemo(() => MOCK_NEWS[getIndex(currIndex)], [currIndex, getIndex]);
  const nextNews = useMemo(() => MOCK_NEWS[getIndex(currIndex + 1)], [currIndex, getIndex]);
  const prevNews = useMemo(() => MOCK_NEWS[getIndex(currIndex - 1)], [currIndex, getIndex]);

  const finishFlip = (direction) => {
    const newIndex = direction === 'next' ? getIndex(currIndex + 1) : getIndex(currIndex - 1);
    setCurrIndex(newIndex);
    scrollY.value = 0;
    swipeDirection.value = 0;
    isAnimating.value = false;
  };

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(containerHeight - height) > 1) {
      setContainerHeight(height);
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onStart(() => {
      if (hideUI) {
        runOnJS(hideUI)();
      }
    })
    .onUpdate((e) => {
      if (containerHeight === 0 || isAnimating.value) return;

      const position = -e.translationY / containerHeight;
      scrollY.value = position;

      if (swipeDirection.value === 0 && Math.abs(position) > 0.05) {
        swipeDirection.value = position > 0 ? 1 : -1;
      }
    })
    .onEnd((e) => {
      if (containerHeight === 0 || isAnimating.value) return;
      const position = -e.translationY / containerHeight;
      const velocity = -e.velocityY;

      if (position > 0.15 || velocity > 600) {
        isAnimating.value = true;
        swipeDirection.value = 1; // Lock to next
        scrollY.value = withTiming(
          1, 
          { duration: 300, easing: Easing.out(Easing.cubic) }, 
          (finished) => {
            if (finished) {
              runOnJS(finishFlip)('next');
            }
          }
        );
      } 
      // Swipe DOWN (positive translationY, negative position) = PREV
      else if (position < -0.15 || velocity < -600) {
        isAnimating.value = true;
        swipeDirection.value = -1; // Lock to prev
        scrollY.value = withTiming(
          -1, 
          { duration: 300, easing: Easing.out(Easing.cubic) }, 
          (finished) => {
            if (finished) {
              runOnJS(finishFlip)('prev');
            }
          }
        );
      } else {
        // Cancel swipe - return to rest
        swipeDirection.value = 0;
        scrollY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // --- ANIMATED STYLES ---

  // Destination overlay - only visible when actively swiping, locked to direction
  const destinationNextStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === 1 && Math.abs(scrollY.value) > 0.01 ? 1 : 0,
    zIndex: swipeDirection.value === 1 && Math.abs(scrollY.value) > 0.01 ? 1 : -1,
  }));

  const destinationPrevStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === -1 && Math.abs(scrollY.value) > 0.01 ? 1 : 0,
    zIndex: swipeDirection.value === -1 && Math.abs(scrollY.value) > 0.01 ? 1 : -1,
  }));

  // NEXT FLIPPER (Bottom half) - Active when scrollY > 0 (swipe UP to next)
  const flipNextStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value > 0;
    const rotateX = interpolate(scrollY.value, [0, 1], [0, -180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [
        { perspective: 1500 },
        { rotateX: `${rotateX}deg` },
      ],
      transformOrigin: 'center top',
    };
  });

  // PREV FLIPPER (Top half) - Active when scrollY < 0 (swipe DOWN to prev)
  const flipPrevStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value < 0;
    const rotateX = interpolate(scrollY.value, [0, -1], [0, 180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [
        { perspective: 1500 },
        { rotateX: `${rotateX}deg` },
      ],
      transformOrigin: 'center bottom',
    };
  });

  // --- FACE LOGIC ---

  // NEXT (swipe UP): Bottom half flips
  const nextFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value < 0.5 ? 1 : 0,
    zIndex: scrollY.value < 0.5 ? 2 : 1,
  }));

  const nextBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value >= 0.5 ? 1 : 0,
    zIndex: scrollY.value >= 0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  // PREV (swipe DOWN): Top half flips
  const prevFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value > -0.5 ? 1 : 0,
    zIndex: scrollY.value > -0.5 ? 2 : 1,
  }));

  const prevBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value <= -0.5 ? 1 : 0,
    zIndex: scrollY.value <= -0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  // Static Backgrounds - only show current news when not swiping
  const staticTopStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value <= 0 ? 1 : 0,
    zIndex: 2,
  }));

  const staticBottomStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value >= 0 ? 1 : 0,
    zIndex: 2,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(scrollY.value), [0, 0.5, 1], [0, 0.3, 0], Extrapolate.CLAMP),
  }));

  if (containerHeight === 0) {
    return (
      <View style={styles.container} onLayout={onLayout} />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.container} onLayout={onLayout}>
          {/* Destination NEXT (Z: 1) - Only visible when swiping to next */}
          <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
            <MemoizedCard 
              newsItem={nextNews} 
              height={containerHeight} 
              onPress={() => {}} 
              onCommentsPress={() => {}} 
            />
          </Animated.View>

          {/* Destination PREV (Z: 1) - Only visible when swiping to prev */}
          <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
            <MemoizedCard 
              newsItem={prevNews} 
              height={containerHeight} 
              onPress={() => {}} 
              onCommentsPress={() => {}} 
            />
          </Animated.View>

          {/* Static Top (Z: 2) - Visible when swiping UP (to next) or at rest */}
          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle]}>
            <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {/* Static Bottom (Z: 2) - Visible when swiping DOWN (to prev) or at rest */}
          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle]}>
            <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {/* BOTTOM FLIPPER (Z: 10) - Active when swiping UP (to next) */}
          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, flipNextStyle]}>
            {/* Front: Current news bottom */}
            <Animated.View style={[styles.face, nextFrontStyle]}>
              <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            {/* Back: Next news top (flipped 180deg) */}
            <Animated.View style={[styles.face, nextBackStyle]}>
              <CardHalf newsItem={nextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.shadow, shadowStyle]} />
          </Animated.View>

          {/* TOP FLIPPER (Z: 10) - Active when swiping DOWN (to prev) */}
          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, flipPrevStyle]}>
            {/* Front: Current news top */}
            <Animated.View style={[styles.face, prevFrontStyle]}>
              <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            {/* Back: Previous news bottom (flipped 180deg) */}
            <Animated.View style={[styles.face, prevBackStyle]}>
              <CardHalf newsItem={prevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.shadow, shadowStyle]} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  halfWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  halfCardContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  innerContainer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    backgroundColor: '#fff',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    backfaceVisibility: 'visible',
  },
  shadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
});

export default FlipNewsScreen;