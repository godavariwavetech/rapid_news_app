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

// 3. Static Overlay
const StaticOverlay = ({ newsItem, height }) => {
  if (!newsItem || !height) return null;
  return (
    <View style={[styles.absoluteFill, { height }]}>
      <MemoizedCard newsItem={newsItem} height={height} onPress={() => {}} onCommentsPress={() => {}} />
    </View>
  );
};

const FlipNewsScreen = ({ toggleUI, hideUI, onCommentsPress }) => {
  const [currIndex, setCurrIndex] = useState(0);
  const [overlayNews, setOverlayNews] = useState(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);

  const getIndex = useCallback((i) => {
    const len = MOCK_NEWS.length;
    return ((i % len) + len) % len;
  }, []);

  const currentNews = useMemo(() => MOCK_NEWS[getIndex(currIndex)], [currIndex, getIndex]);
  const nextNews = useMemo(() => MOCK_NEWS[getIndex(currIndex + 1)], [currIndex, getIndex]);
  const prevNews = useMemo(() => MOCK_NEWS[getIndex(currIndex - 1)], [currIndex, getIndex]);

  const finishFlip = (direction) => {
    const targetNews = direction === 'next' ? nextNews : prevNews;
    setOverlayNews(targetNews);
    const newIndex = direction === 'next' ? getIndex(currIndex + 1) : getIndex(currIndex - 1);
    setCurrIndex(newIndex);
  };

  useEffect(() => {
    if (overlayNews) {
      scrollY.value = 0;
      const timer = setTimeout(() => {
        setOverlayNews(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currIndex, overlayNews, scrollY]);

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(containerHeight - height) > 1) {
      setContainerHeight(height);
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onStart(() => {
      // Hide UI when user starts swiping
      if (hideUI) {
        runOnJS(hideUI)();
      }
    })
    .onUpdate((e) => {
      if (containerHeight === 0) return;
      scrollY.value = -e.translationY / containerHeight;
    })
    .onEnd((e) => {
      if (containerHeight === 0) return;
      const position = -e.translationY / containerHeight;
      const velocity = -e.velocityY;
      if (position > 0.15 || velocity > 600) {
        scrollY.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }, () => runOnJS(finishFlip)('next'));
      } else if (position < -0.15 || velocity < -600) {
        scrollY.value = withTiming(-1, { duration: 250, easing: Easing.out(Easing.quad) }, () => runOnJS(finishFlip)('prev'));
      } else {
        scrollY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // --- ANIMATED STYLES (NO VERTICAL MOVEMENT) ---
  const flipPrevStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value < 0;
    const rotateX = interpolate(scrollY.value, [0, -1], [0, -180], Extrapolate.CLAMP);
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

  const flipNextStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value > 0;
    const rotateX = interpolate(scrollY.value, [0, 1], [0, 180], Extrapolate.CLAMP);
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

  // --- FACE LOGIC ---
  const prevFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value > -0.5 ? 1 : 0,
    zIndex: scrollY.value > -0.5 ? 2 : 1,
  }));

  const prevBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value <= -0.5 ? 1 : 0,
    zIndex: scrollY.value <= -0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  const nextFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value < 0.5 ? 1 : 0,
    zIndex: scrollY.value < 0.5 ? 2 : 1,
  }));

  const nextBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value >= 0.5 ? 1 : 0,
    zIndex: scrollY.value >= 0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  // Static Backgrounds
  const staticTopStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value >= 0 ? 1 : 0
  }));

  const staticBottomStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value <= 0 ? 1 : 0
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
          {/* Destination (Z: 1) */}
          <StaticOverlay newsItem={scrollY.value > 0 ? nextNews : prevNews} height={containerHeight} />

          {/* Static Top (Z: 2) */}
          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle]}>
            <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {/* Static Bottom (Z: 2) */}
          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle]}>
            <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {/* TOP FLIPPER (Prev) */}
          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, flipPrevStyle]}>
            <Animated.View style={[styles.face, prevFrontStyle]}>
              <CardHalf newsItem={prevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.face, prevBackStyle]}>
              <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.shadow, shadowStyle]} />
          </Animated.View>

          {/* BOTTOM FLIPPER (Next) */}
          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, flipNextStyle]}>
            <Animated.View style={[styles.face, nextFrontStyle]}>
              <CardHalf newsItem={nextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.face, nextBackStyle]}>
              <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
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