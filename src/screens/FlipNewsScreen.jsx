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

// 1. Memoized Card
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
  if (!newsItem) return null;
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
  
  // Transition state
  const [isSwitching, setIsSwitching] = useState(false);
  const [overrideNews, setOverrideNews] = useState(null);
  
  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0); 

  const getIndex = useCallback((i) => {
    if (!MOCK_NEWS || MOCK_NEWS.length === 0) return 0;
    const len = MOCK_NEWS.length;
    return ((i % len) + len) % len;
  }, []);

  const currentNews = useMemo(() => MOCK_NEWS[getIndex(currIndex)], [currIndex, getIndex]);
  const nextNews = useMemo(() => MOCK_NEWS[getIndex(currIndex + 1)], [currIndex, getIndex]);
  const prevNews = useMemo(() => MOCK_NEWS[getIndex(currIndex - 1)], [currIndex, getIndex]);

  // Content Stabilizer: Lock all cards to the target news during the switch
  const displayNews = overrideNews || currentNews;
  const activeCurrentNews = isSwitching ? displayNews : currentNews;
  const activeNextNews = isSwitching ? displayNews : nextNews;
  const activePrevNews = isSwitching ? displayNews : prevNews;

  useEffect(() => {
    if (isSwitching) {
      // 1. Instantly reset animation (Flipper snaps to front, covered by Static Background)
      scrollY.value = 0;
      swipeDirection.value = 0;
      
      // 2. Wait a brief moment for the repaint, then unlock
      setTimeout(() => {
        setIsSwitching(false);
        setOverrideNews(null);
        
        // CRITICAL FIX: Unlock gestures ONLY after everything is reset.
        // This prevents the "freezing" caused by swiping during the reset gap.
        isAnimating.value = false;
      }, 50);
    }
  }, [currIndex, isSwitching]);

  const finishFlip = (direction) => {
    // 1. Capture the news we just flipped TO
    const targetNews = direction === 'next' ? nextNews : prevNews;
    setOverrideNews(targetNews);

    // 2. Activate Switching Mode
    setIsSwitching(true);
    
    // 3. Update the actual index (Triggers the useEffect above)
    const newIndex = direction === 'next' ? getIndex(currIndex + 1) : getIndex(currIndex - 1);
    setCurrIndex(newIndex);
    
    // NOTE: isAnimating.value remains TRUE here. It is set to FALSE in the useEffect/setTimeout.
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
      
      // Lock swipe direction once started
      if (swipeDirection.value === 0 && Math.abs(position) > 0.05) {
        swipeDirection.value = position > 0 ? 1 : -1;
      }
    })
    .onEnd((e) => {
      if (containerHeight === 0 || isAnimating.value) return;
      const position = -e.translationY / containerHeight;
      
      // Trigger Next
      if (position > 0.15 || -e.velocityY > 600) {
        isAnimating.value = true;
        swipeDirection.value = 1;
        scrollY.value = withTiming(
          1, 
          { duration: 300, easing: Easing.out(Easing.cubic) }, 
          (finished) => { if (finished) runOnJS(finishFlip)('next'); }
        );
      } 
      // Trigger Prev
      else if (position < -0.15 || -e.velocityY < -600) {
        isAnimating.value = true;
        swipeDirection.value = -1;
        scrollY.value = withTiming(
          -1, 
          { duration: 300, easing: Easing.out(Easing.cubic) }, 
          (finished) => { if (finished) runOnJS(finishFlip)('prev'); }
        );
      } 
      // Cancel
      else {
        swipeDirection.value = 0;
        scrollY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // --- ANIMATED STYLES ---

  const VISIBILITY_THRESHOLD = 0.01;

  const destinationNextStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === 1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : 0,
    zIndex: swipeDirection.value === 1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : -1,
  }));

  const destinationPrevStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === -1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : 0,
    zIndex: swipeDirection.value === -1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : -1,
  }));

  const flipNextStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value > 0;
    const rotateX = interpolate(scrollY.value, [0, 1], [0, -180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [{ perspective: 1500 }, { rotateX: `${rotateX}deg` }],
      transformOrigin: 'center top',
    };
  });

  const flipPrevStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value < 0;
    const rotateX = interpolate(scrollY.value, [0, -1], [0, 180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [{ perspective: 1500 }, { rotateX: `${rotateX}deg` }],
      transformOrigin: 'center bottom',
    };
  });

  // --- FACE LOGIC (THRESHOLD: 50% / 0.5) ---

  const nextFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value < 0.5 ? 1 : 0, 
    zIndex: scrollY.value < 0.5 ? 2 : 1,
  }));

  const nextBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value >= 0.5 ? 1 : 0,
    zIndex: scrollY.value >= 0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  const prevFrontStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value > -0.5 ? 1 : 0,
    zIndex: scrollY.value > -0.5 ? 2 : 1,
  }));

  const prevBackStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value <= -0.5 ? 1 : 0,
    zIndex: scrollY.value <= -0.5 ? 2 : 1,
    transform: [{ rotateX: '180deg' }],
  }));

  // --- STATIC BACKGROUND LOGIC ---

  const staticTopStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value < -VISIBILITY_THRESHOLD ? 0 : 1,
    zIndex: 2,
  }));

  const staticBottomStyle = useAnimatedStyle(() => ({
    opacity: scrollY.value > VISIBILITY_THRESHOLD ? 0 : 1,
    zIndex: 2,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(scrollY.value), [0, 0.5, 1], [0, 0.3, 0], Extrapolate.CLAMP),
  }));

  if (containerHeight === 0 || !displayNews) {
    return <View style={styles.container} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.container} onLayout={onLayout}>
          
          {/* Destinations (Behind) */}
          <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
            <MemoizedCard newsItem={activeNextNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} />
          </Animated.View>
          <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
            <MemoizedCard newsItem={activePrevNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} />
          </Animated.View>

          {/* STATIC LAYERS */}
          {/* Always visible, and prioritized during switching to cover any flickering */}
          <Animated.View 
            style={[
              styles.halfWrapper, 
              { top: 0, height: halfHeight }, 
              staticTopStyle, 
              isSwitching && { opacity: 1, zIndex: 100 }
            ]}>
            <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          <Animated.View 
            style={[
              styles.halfWrapper, 
              { bottom: 0, height: halfHeight }, 
              staticBottomStyle, 
              isSwitching && { opacity: 1, zIndex: 100 }
            ]}>
            <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {/* FLIPPERS - Always mounted */}
          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, flipNextStyle]}>
            <Animated.View style={[styles.face, nextFrontStyle]}>
              <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.face, nextBackStyle]}>
              <CardHalf newsItem={activeNextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.shadow, shadowStyle]} />
          </Animated.View>

          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, flipPrevStyle]}>
            <Animated.View style={[styles.face, prevFrontStyle]}>
              <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
            </Animated.View>
            <Animated.View style={[styles.face, prevBackStyle]}>
              <CardHalf newsItem={activePrevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
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