import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ToastAndroid, ActivityIndicator, AppState } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  interpolate, Extrapolate, runOnJS, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { markNewsAsRead } from '../redux/reducers/news';
import Way2NewsCard from '../components/Way2NewsCard';
import FastImage from 'react-native-fast-image';
import ShimmerLoader from '../components/ShimmerLoader';
import SurveyCard from '../components/SurveyCard';
import { lightTheme, darkTheme } from '../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const NewsSkeleton = ({ height, theme }) => {
  const imageHeight = height * 0.40;
  return (
    <View style={[styles.skeletonContainer, { height, backgroundColor: theme?.background || '#FFF' }]}>
      <ShimmerLoader height={imageHeight} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <ShimmerLoader height={30} borderRadius={4} />
        <View style={{height: 10}} />
        <ShimmerLoader height={30} borderRadius={4} />
        <View style={{height: 20}} />
        <ShimmerLoader height={20} borderRadius={4} />
        <View style={{height: 8}} />
        <ShimmerLoader height={20} borderRadius={4} />
        <View style={{height: 8}} />
        <ShimmerLoader height={20} borderRadius={4} />
        <View style={{ marginTop: 'auto', marginBottom: 20 }}>
          <ShimmerLoader height={40} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const SPRING_CONFIG = {
  mass: 0.6, damping: 28, stiffness: 220,
  overshootClamping: true, restDisplacementThreshold: 0.01, restSpeedThreshold: 1,
};

const MemoizedCard = React.memo(({ newsItem, height, onPress, onCommentsPress, isActive = true, onAutoNext }) => {
  if (!newsItem) return null;
  return (
    <View style={{ height }}>
      {newsItem.type === 'SURVEY'
        ? <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
        : <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} />}
    </View>
  );
}, (prev, next) => prev.newsItem?.id === next.newsItem?.id && prev.height === next.height && prev.isActive === next.isActive);

const CardHalf = React.memo(({ newsItem, side, height, onPress, onCommentsPress, isActive = true, theme, onAutoNext }) => {
  if (!newsItem) return null;
  const halfHeight = height / 2;
  const isTop = side === 'top';
  return (
    <View style={[styles.halfCardContainer, { backgroundColor: theme?.background || '#fff' }]}>
      <View style={[styles.innerContainer, { height, top: isTop ? 0 : -halfHeight, backgroundColor: theme?.background || '#fff' }]}>
        {newsItem.type === 'SURVEY'
          ? <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
          : <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} isBottomHalf={!isTop} />}
      </View>
    </View>
  );
});

const FlipNewsScreen = forwardRef(({ toggleUI, hideUI, onCommentsPress, onRefresh, onEndReached, onIndexChange, feedType = 'main' }, ref) => {
  const dispatch = useDispatch();
  const { articles, totalNews, unreadArticles, loading, isLoadingMore, isLoadingUnread, hasMore } = useSelector(state => state.news);
  const { bookmarks } = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const activeArticles = feedType === 'unread' ? unreadArticles : articles;
  const activeLoading = feedType === 'unread' ? isLoadingUnread : loading;
  const activeHasMore = feedType === 'unread' ? false : hasMore;
  const bookmarkedIds = useMemo(() => bookmarks?.map(item => item.news?._id), [bookmarks]);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (formattedNews.length > 0) {
        setCurrIndex(0);
        scrollY.value = 0;
        swipeDirection.value = 0;
      }
    }
  }));

  const formattedNews = useMemo(() => {
    const rawItems = activeArticles?.items || (Array.isArray(activeArticles) ? activeArticles : []);
    return rawItems.map((item, index) => {
      if (item.type === 'AD') {
        return {
          id: item.data._id, type: 'AD', isAd: true,
          image: item.data.image, redirectUrl: item.data.redirect_url,
          label: item.data.label || 'Sponsored', title: item.data.label || 'Advertisement',
          likes: 0, dislikes: 0, comments: 0, commentsEnabled: false, images: [],
          itemIndex: index + 1, totalNews: totalNews || rawItems.length,
        };
      } else if (item.type === 'SURVEY') {
        return {
          id: item.data._id, type: 'SURVEY',
          question: item.data.question, options: item.data.options,
          totalVotes: item.data.total_votes, voted_option_id: item.data.voted_option_id,
          user_voted: item.data.user_voted, isAd: false,
          itemIndex: index + 1, totalNews: totalNews || rawItems.length,
        };
      } else {
        const data = item.data || item;
        return {
          id: data._id, type: 'NEWS', isAd: false,
          title: data.content?.title || '', body: data.content?.body || '',
          short: data.content?.short || '',
          image: data.images?.length > 0 ? data.images[0] : null,
          images: data.images || [], videos: data.videos || [],
          external_links: data.external_links || [],
          publishedAt: data.published_at, timeAgo: formatTimeAgo(data.published_at),
          likes: data?.reactions?.likes || 0, dislikes: data?.reactions?.dislikes || 0,
          comments: data?.comments?.count || 0,
          commentsEnabled: data?.comments?.enabled !== false,
          reporter: data.reporter || { name: 'Reporter', imageUrl: 'https://via.placeholder.com/100', location: 'Andhra Pradesh' },
          isLiked: data?.reactions?.my_reaction == "LIKE",
          isDisliked: data?.reactions?.my_reaction == "DISLIKE",
          isBookmarked: bookmarkedIds.includes(data._id),
          itemIndex: index + 1, totalNews: totalNews || rawItems.length,
        };
      }
    });
  }, [activeArticles, bookmarkedIds, totalNews]);

  useEffect(() => {
    const adImages = formattedNews
      .filter(item => item.isAd && item.image)
      .map(item => ({ uri: item.image, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }));
    if (adImages.length > 0) FastImage.preload(adImages);
  }, [formattedNews]);

  const [currIndex, setCurrIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const loaderY = useSharedValue(-60);
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0);
  const hasNext = useSharedValue(formattedNews.length > 1);
  const hasPrev = useSharedValue(false);

  const currentNews = useMemo(() => formattedNews[currIndex], [currIndex, formattedNews]);
  const nextNews = useMemo(() => formattedNews[currIndex + 1] ?? null, [currIndex, formattedNews]);
  const prevNews = useMemo(() => formattedNews[currIndex - 1] ?? null, [currIndex, formattedNews]);

  useEffect(() => {
    hasNext.value = !!nextNews;
    hasPrev.value = !!prevNews;
  }, [nextNews, prevNews]);

  useEffect(() => {
    if (onIndexChange) onIndexChange(currIndex);
  }, [currIndex, onIndexChange]);

  useEffect(() => {
    if (currIndex >= formattedNews.length && formattedNews.length > 0) {
      setCurrIndex(0);
      scrollY.value = 0;
      swipeDirection.value = 0;
    }
  }, [formattedNews.length]);

  useEffect(() => {
    if (!activeLoading && isRefreshing) {
      setIsRefreshing(false);
      loaderY.value = withTiming(-60, { duration: 300 });
    }
  }, [activeLoading, isRefreshing]);

  const readBatchRef = useRef(new Set());
  const flushTimerRef = useRef(null);
  const impressionTimerRef = useRef(null);

  const flushReadBatch = useCallback(() => {
    if (readBatchRef.current.size === 0) return;
    const ids = Array.from(readBatchRef.current);
    readBatchRef.current.clear();
    dispatch(markNewsAsRead(ids));
  }, [dispatch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') flushReadBatch();
    });
    return () => {
      sub.remove();
      flushReadBatch();
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    };
  }, [flushReadBatch]);

  useEffect(() => {
    flushTimerRef.current = setInterval(flushReadBatch, 2000);
    return () => clearInterval(flushTimerRef.current);
  }, [flushReadBatch]);

  useEffect(() => {
    if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    if (!currentNews?.id || currentNews.isAd || feedType === 'unread') return;
    impressionTimerRef.current = setTimeout(() => {
      readBatchRef.current.add(currentNews.id);
      if (readBatchRef.current.size >= 10) flushReadBatch();
    }, 1000);
    return () => clearTimeout(impressionTimerRef.current);
  }, [currentNews?.id, currentNews?.isAd, feedType, flushReadBatch]);

  // commitFlip: called on UI thread via runOnJS after animation completes.
  // scrollY is at 1 (or -1). We update the index, then immediately reset
  // scrollY to 0 — all in the same JS call so React batches the update.
  const commitFlip = useCallback((newIndex) => {
    // Don't reset scrollY here — keep it at 1 so static halves stay hidden.
    // setCurrIndex triggers re-render with new card, then the useEffect resets scrollY.
    isAnimating.value = false;
    setCurrIndex(newIndex);
  }, []);

  // After currIndex changes (new card rendered), reset scrollY and swipeDirection.
  // At this point currentNews is already the new card, so resetting scrollY=0
  // reveals the new card's static halves — no flicker.
  const prevCurrIndex = useRef(0);
  useEffect(() => {
    if (prevCurrIndex.current !== currIndex) {
      prevCurrIndex.current = currIndex;
      swipeDirection.value = 0;
      scrollY.value = 0;
    }
  }, [currIndex]);

  const destinationNextStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === 1 && hasNext.value ? 1 : 0,
    zIndex: swipeDirection.value === 1 ? 1 : -1,
  }));

  const destinationPrevStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === -1 && hasPrev.value ? 1 : 0,
    zIndex: swipeDirection.value === -1 ? 1 : -1,
  }));

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(containerHeight - height) > 1) setContainerHeight(height);
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    loaderY.value = withSpring(20, SPRING_CONFIG);
    if (onRefresh) onRefresh();
    scrollY.value = withSpring(0, SPRING_CONFIG);
  };

  const isLoadingMoreRef = useRef(false);
  const triggerLoadMore = () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    if (onEndReached) onEndReached();
    scrollY.value = withSpring(0, SPRING_CONFIG);
  };

  useEffect(() => {
    if (!isLoadingMore && !loading) isLoadingMoreRef.current = false;
  }, [isLoadingMore, loading]);

  // Preload next page when user reaches last 3 items
  useEffect(() => {
    if (
      formattedNews.length > 0 &&
      currIndex >= formattedNews.length - 3 &&
      activeHasMore &&
      !isLoadingMore &&
      !isLoadingMoreRef.current
    ) {
      isLoadingMoreRef.current = true;
      if (onEndReached) onEndReached();
    }
  }, [currIndex, formattedNews.length, activeHasMore, isLoadingMore]);

  const autoSwipeNext = () => {
    if (isAnimating.value) return;
    if (!hasNext.value) {
      if (!activeHasMore && Platform.OS === 'android') ToastAndroid.show("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
      triggerLoadMore();
    } else {
      isAnimating.value = true;
      swipeDirection.value = 1;
      scrollY.value = withTiming(0.94, { duration: 300, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(commitFlip)(currIndex + 1);
      });
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onStart(() => { if (hideUI) runOnJS(hideUI)(); })
    .onUpdate((e) => {
      if (containerHeight === 0 || isAnimating.value) return;
      let position = -e.translationY / containerHeight;
      if (!hasNext.value && position > 0) position = position / 3;
      else if (!hasPrev.value && position < 0) {
        position = position / 3;
        if (!isRefreshing) loaderY.value = Math.min(-60 + (e.translationY * 0.4), 20);
      }
      scrollY.value = position;
      if (swipeDirection.value === 0 && Math.abs(position) > 0.05)
        swipeDirection.value = position > 0 ? 1 : -1;
    })
    .onEnd((e) => {
      if (containerHeight === 0 || isAnimating.value) return;
      const position = -e.translationY / containerHeight;
      if (position > 0.15 || -e.velocityY > 400) {
        if (!hasNext.value) {
          if (!activeHasMore && Platform.OS === 'android') runOnJS(ToastAndroid.show)("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
          runOnJS(triggerLoadMore)();
        } else {
          isAnimating.value = true;
          swipeDirection.value = 1;
          scrollY.value = withTiming(0.94, { duration: 300, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished) runOnJS(commitFlip)(currIndex + 1);
          });
        }
      } else if (position < -0.15 || -e.velocityY < -400) {
        if (!hasPrev.value) {
          if (!isRefreshing) runOnJS(triggerRefresh)();
          else scrollY.value = withSpring(0, SPRING_CONFIG);
        } else {
          isAnimating.value = true;
          swipeDirection.value = -1;
          scrollY.value = withTiming(-0.94, { duration: 300, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished) runOnJS(commitFlip)(currIndex - 1);
          });
        }
      } else {
        swipeDirection.value = 0;
        scrollY.value = withSpring(0, SPRING_CONFIG);
        if (!isRefreshing && !hasPrev.value) loaderY.value = withSpring(-60, SPRING_CONFIG);
      }
    });

  const flipNextStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value > 0.01 && scrollY.value < 0.95 && hasNext.value;
    const deg = interpolate(scrollY.value, [0, 1], [0, 180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [
        { perspective: 1000 },
        { translateY: -(halfHeight / 2) },
        { rotateX: `${deg}deg` },
        { translateY: halfHeight / 2 },
      ],
    };
  });

  const flipPrevStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value < -0.01 && scrollY.value > -0.95 && hasPrev.value;
    const deg = interpolate(scrollY.value, [0, -1], [0, 180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0,
      transform: [
        { perspective: 1000 },
        { translateY: halfHeight / 2 },
        { rotateX: `-${deg}deg` },
        { translateY: -(halfHeight / 2) },
      ],
    };
  });

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

  const staticTopStyle = useAnimatedStyle(() => ({
    opacity: (scrollY.value < -0.01 && hasPrev.value) || scrollY.value <= -1 ? 0 : 1,
    zIndex: 2,
  }));

  const staticBottomStyle = useAnimatedStyle(() => ({
    opacity: (scrollY.value > 0.05 && hasNext.value) || scrollY.value >= 1 ? 0 : 1,
    zIndex: 2,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(scrollY.value), [0, 0.5, 1], [0, 0.3, 0], Extrapolate.CLAMP),
  }));

  const topLoaderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loaderY.value }],
    opacity: interpolate(loaderY.value, [-60, 20], [0, 1], Extrapolate.CLAMP),
  }));

  if (activeLoading && formattedNews.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout}>
        <NewsSkeleton height={containerHeight} theme={theme} />
      </View>
    );
  }

  if (!activeLoading && formattedNews.length === 0) {
    return (
      <View style={[styles.container, styles.centerView, { backgroundColor: theme.background }]}>
        <Icon name="check-all" size={60} color="#666" style={{ marginBottom: 15 }} />
        <Text style={[styles.emptyText, { color: theme.text }]}>You're all caught up!</Text>
      </View>
    );
  }

  if (!currentNews) {
    return <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: '#2C2C2C', paddingTop: insets.top }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, { backgroundColor: theme.background, overflow: 'hidden' }]} onLayout={onLayout}>

          <Animated.View style={[styles.refreshLoaderContainer, topLoaderStyle]}>
            <ActivityIndicator size="large" color="#4dabf5" />
          </Animated.View>

          {isLoadingMore && !nextNews && (
            <View style={styles.bottomLoaderContainer}>
              <ActivityIndicator size="small" color="#4dabf5" />
              <Text style={styles.bottomLoaderText}>వార్తలు లోడ్ అవుతున్నాయి...</Text>
            </View>
          )}

          {/* Next card bottom half sits behind — visible during swipe-next */}
          {nextNews && (
            <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
              <MemoizedCard newsItem={nextNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
            </Animated.View>
          )}
          {prevNews && (
            <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
              <MemoizedCard newsItem={prevNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
            </Animated.View>
          )}

          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle]}>            <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
          </Animated.View>

          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle]}>
            <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
          </Animated.View>

          {nextNews && (
            <View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, flipNextStyle]}>
                <Animated.View style={[styles.face, nextFrontStyle]}>
                  <CardHalf newsItem={currentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
                </Animated.View>
                <Animated.View style={[styles.face, nextBackStyle]}>
                  <CardHalf newsItem={nextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
                </Animated.View>
                <Animated.View style={[styles.shadow, shadowStyle]} />
              </Animated.View>
            </View>
          )}

          {prevNews && (
            <View style={[styles.halfWrapper, { top: 0, height: halfHeight }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, flipPrevStyle]}>
                <Animated.View style={[styles.face, prevFrontStyle]}>
                  <CardHalf newsItem={currentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
                </Animated.View>
                <Animated.View style={[styles.face, prevBackStyle]}>
                  <CardHalf newsItem={prevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} />
                </Animated.View>
                <Animated.View style={[styles.shadow, shadowStyle]} />
              </Animated.View>
            </View>
          )}

        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C2C2C' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  halfWrapper: { position: 'absolute', left: 0, right: 0, overflow: 'visible', backgroundColor: 'transparent' },
  halfCardContainer: { flex: 1, overflow: 'hidden' },
  innerContainer: { position: 'absolute', width: '100%', left: 0 },
  face: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  shadow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  skeletonContainer: { flex: 1 },
  skeletonContent: { flex: 1, padding: 20 },
  centerView: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600' },
  refreshLoaderContainer: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#2C2C2C', borderRadius: 25, padding: 8, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
  bottomLoaderContainer: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2C2C2C', borderRadius: 25, paddingVertical: 8, paddingHorizontal: 16, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
  bottomLoaderText: { color: '#4dabf5', fontSize: 13, fontWeight: '600' },
});

export default FlipNewsScreen;
