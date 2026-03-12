import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Platform, ToastAndroid, ActivityIndicator } from 'react-native';
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
import { useSelector, useDispatch } from 'react-redux';
import { viewNews } from '../redux/reducers/news'; 
import Way2NewsCard from '../components/Way2NewsCard';
import ShimmerLoader from '../components/ShimmerLoader';
import SurveyCard from '../components/SurveyCard';
import { lightTheme, darkTheme } from '../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- HELPER: TIME AGO CALCULATION ---
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

// --- SKELETON LOADING COMPONENT ---
const NewsSkeleton = ({ height, theme }) => {
  const imageHeight = height * 0.45;
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
const MemoizedCard = React.memo(({ newsItem, height, onPress, onCommentsPress, isActive = true, onAutoNext }) => {
  if (!newsItem) return null;
  return (
   <View style={{ height }}>
      {newsItem.type === 'SURVEY' ? (
        <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
      ) : (
        <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} />
      )}
    </View>
  );
}, (prev, next) => prev.newsItem?.id === next.newsItem?.id && prev.height === next.height && prev.isActive === next.isActive);

// 2. CardHalf
const CardHalf = React.memo(({ newsItem, side, height, onPress, onCommentsPress, isActive = true, theme, onAutoNext }) => {
  if (!newsItem) return null;
  const halfHeight = height / 2;
  const isTop = side === 'top';
  return (
  <View style={[styles.halfCardContainer, { backgroundColor: theme?.background || '#fff' }]}>
      <View style={[styles.innerContainer, { height, top: isTop ? 0 : -halfHeight, backgroundColor: theme?.background || '#fff' }]}>
        {newsItem.type === 'SURVEY' ? (
          <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
        ) : (
          <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} isBottomHalf={!isTop} />
        )}
      </View>
    </View>
  );
});

// WRAP WITH FORWARD REF
const FlipNewsScreen = forwardRef(({ toggleUI, hideUI, onCommentsPress, onRefresh, onEndReached, onIndexChange, feedType = 'main' }, ref) => {
  const dispatch = useDispatch();
  
  // DYNAMIC REDUX SELECTION BASED ON feedType PROP
  const { articles, unreadArticles, loading, isLoadingUnread, hasMore } = useSelector(state => state.news);
  const {bookmarks} = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const activeArticles = feedType === 'unread' ? unreadArticles : articles;
  const activeLoading = feedType === 'unread' ? isLoadingUnread : loading;
  const activeHasMore = feedType === 'unread' ? false : hasMore; 
  
  const bookmarkedIds = useMemo(() => {
    return bookmarks?.map(item => item.news?._id);
  }, [bookmarks]);
  
  // Expose methods to parent
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
    return rawItems.map(item => {
      if (item.type === 'AD') {
        return {
          id: item.data._id,
          type: 'AD',
          isAd: true,
          image: item.data.image, 
          redirectUrl: item.data.redirect_url,
          label: item.data.label || 'Sponsored',
          title: item.data.label || 'Advertisement',
          likes: 0,
          comments: 0,
          commentsEnabled: false,
          images: [], 
        };
      } 
      else if (item.type === 'SURVEY') {
      return {
        id: item.data._id,
        type: 'SURVEY',
        question: item.data.question,
        options: item.data.options,
        totalVotes: item.data.total_votes,
        voted_option_id: item.data.voted_option_id,
        user_voted: item.data.user_voted,
        isAd: false,
      };
    }
      else {
        const data = item.data || item; 
        return {
          id: data._id,
          type: 'NEWS',
          isAd: false,
          title: data.content?.title || '',
          body: data.content?.body || '',
          short: data.content?.short || '',
          image: data.images?.length > 0 ? data.images[0] : null,
          images: data.images || [], 
          videos: data.videos || [],
          external_links: data.external_links || [], 
          publishedAt: data.published_at,
          timeAgo: formatTimeAgo(data.published_at),
          likes: data?.reactions?.likes || 0,
          comments: data?.comments?.count || 0,
          commentsEnabled: data?.comments?.enabled !== false,
          reporter: data.reporter || {
            name: 'Reporter',
            imageUrl: 'https://via.placeholder.com/100',
            location: 'Andhra Pradesh'
          },
          isLiked:data?.reactions?.my_reaction=="LIKE",
          isDisliked:data?.reactions?.my_reaction=="DISLIKE",
          isBookmarked: bookmarkedIds.includes(data._id),
        };
      }
    });
  }, [activeArticles, bookmarkedIds]);

  const [currIndex, setCurrIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [overrideNews, setOverrideNews] = useState(null);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const loaderY = useSharedValue(-60); 
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0); 

  // Track availability of Next/Prev for Animation Logic
  const hasNext = useSharedValue(false);
  const hasPrev = useSharedValue(false);

  const currentNews = useMemo(() => formattedNews[currIndex], [currIndex, formattedNews]);
  
  const nextNews = useMemo(() => {
    const nextIdx = currIndex + 1;
    return nextIdx < formattedNews.length ? formattedNews[nextIdx] : null; 
  }, [currIndex, formattedNews]);

  const prevNews = useMemo(() => {
    const prevIdx = currIndex - 1;
    return prevIdx >= 0 ? formattedNews[prevIdx] : null;
  }, [currIndex, formattedNews]);

  // Sync Shared Values
  useEffect(() => {
    hasNext.value = !!nextNews;
    hasPrev.value = !!prevNews;
  }, [nextNews, prevNews]);

  const displayNews = overrideNews || currentNews;
  const activeCurrentNews = isSwitching ? displayNews : currentNews;
  const activeNextNews = isSwitching ? displayNews : nextNews;
  const activePrevNews = isSwitching ? displayNews : prevNews;

  useEffect(() => {
    if (onIndexChange) onIndexChange(currIndex);
  }, [currIndex, onIndexChange]);

  // Handle hiding the loader once Redux `loading` is finished
  useEffect(() => {
    if (!activeLoading && isRefreshing) {
      setIsRefreshing(false);
      loaderY.value = withTiming(-60, { duration: 300 }); 
    }
  }, [activeLoading, isRefreshing]);

  // Trigger API Call on News Change
  useEffect(() => {
    if (currentNews && currentNews.id && !currentNews.isAd && feedType !== 'unread') {
      dispatch(viewNews(currentNews.id));
    }
  }, [currentNews?.id, dispatch, feedType]);

  useEffect(() => {
    if (isSwitching) {
      scrollY.value = 0;
      swipeDirection.value = 0;
      setTimeout(() => {
        setIsSwitching(false);
        setOverrideNews(null);
        isAnimating.value = false;
      }, 0); 
    }
  }, [currIndex, isSwitching]);

  const finishFlip = (direction) => {
    const targetNews = direction === 'next' ? nextNews : prevNews;
    setOverrideNews(targetNews);
    setIsSwitching(true);
    const newIndex = direction === 'next' ? currIndex + 1 : currIndex - 1;
    setCurrIndex(newIndex);
  };

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(containerHeight - height) > 1) {
      setContainerHeight(height);
    }
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    loaderY.value = withSpring(20, SPRING_CONFIG); 
    if (onRefresh) onRefresh();
    scrollY.value = withSpring(0, SPRING_CONFIG);
  };
  
  const triggerLoadMore = () => {
    if (onEndReached) onEndReached();
    scrollY.value = withSpring(0, SPRING_CONFIG); 
  };

  // --- AUTOMATIC SWIPE FUNCTION ---
  const autoSwipeNext = () => {
    if (isAnimating.value) return;

    if (!hasNext.value) {
        if (!activeHasMore && Platform.OS === 'android') {
          ToastAndroid.show("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
        }
        triggerLoadMore();
    } else {
       isAnimating.value = true;
       swipeDirection.value = 1; 
       
       scrollY.value = withTiming(
         1, 
         { duration: 300, easing: Easing.out(Easing.cubic) }, 
         (finished) => { 
           if (finished) runOnJS(finishFlip)('next'); 
         }
       );
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
      
      let position = -e.translationY / containerHeight;

      if (!hasNext.value && position > 0) {
        position = position / 3; 
      }
      else if (!hasPrev.value && position < 0) {
        position = position / 3; 
        
        if (!isRefreshing) {
          const dragY = e.translationY; 
          loaderY.value = Math.min(-60 + (dragY * 0.4), 20); 
        }
      }

      scrollY.value = position;
      
      if (swipeDirection.value === 0 && Math.abs(position) > 0.05) {
        swipeDirection.value = position > 0 ? 1 : -1;
      }
    })
    .onEnd((e) => {
      if (containerHeight === 0 || isAnimating.value) return;
      const position = -e.translationY / containerHeight;
      
      if (position > 0.15 || -e.velocityY > 400) {
        if (!hasNext.value) {
            if (!activeHasMore && Platform.OS === 'android') {
              runOnJS(ToastAndroid.show)("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
            }
            runOnJS(triggerLoadMore)();
        } else {
           isAnimating.value = true;
           swipeDirection.value = 1;
           scrollY.value = withTiming(
             1, 
             { duration: 200, easing: Easing.out(Easing.cubic) }, 
             (finished) => { if (finished) runOnJS(finishFlip)('next'); }
           );
        }
      } 
      else if (position < -0.15 || -e.velocityY < -400) {
        if (!hasPrev.value) {
           if (!isRefreshing) {
              runOnJS(triggerRefresh)();
           } else {
              scrollY.value = withSpring(0, SPRING_CONFIG);
           }
        } else {
           isAnimating.value = true;
           swipeDirection.value = -1;
           scrollY.value = withTiming(
             -1, 
             { duration: 200, easing: Easing.out(Easing.cubic) }, 
             (finished) => { if (finished) runOnJS(finishFlip)('prev'); }
           );
        }
      } 
      else {
        swipeDirection.value = 0;
        scrollY.value = withSpring(0, SPRING_CONFIG);
        if (!isRefreshing && !hasPrev.value) {
           loaderY.value = withSpring(-60, SPRING_CONFIG);
        }
      }
    });

  const VISIBILITY_THRESHOLD = 0.01;
  const PERSPECTIVE_VAL = 6000; 

  const destinationNextStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === 1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD && hasNext.value ? 1 : 0,
    zIndex: swipeDirection.value === 1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : -1,
  }));

  const destinationPrevStyle = useAnimatedStyle(() => ({
    opacity: swipeDirection.value === -1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD && hasPrev.value ? 1 : 0,
    zIndex: swipeDirection.value === -1 && Math.abs(scrollY.value) > VISIBILITY_THRESHOLD ? 1 : -1,
  }));

  const flipNextStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value > 0;
    const rotateX = interpolate(scrollY.value, [0, 1], [0, -180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive && hasNext.value ? 1 : 0, 
      transform: [{ perspective: PERSPECTIVE_VAL }, { rotateX: `${rotateX}deg` }],
      transformOrigin: 'center top',
    };
  });

  const flipPrevStyle = useAnimatedStyle(() => {
    const isActive = scrollY.value < 0;
    const rotateX = interpolate(scrollY.value, [0, -1], [0, 180], Extrapolate.CLAMP);
    return {
      zIndex: isActive ? 10 : 0,
      opacity: isActive && hasPrev.value ? 1 : 0, 
      transform: [{ perspective: PERSPECTIVE_VAL }, { rotateX: `${rotateX}deg` }],
      transformOrigin: 'center bottom',
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
    opacity: (scrollY.value < -VISIBILITY_THRESHOLD && hasPrev.value) ? 0 : 1,
    zIndex: 2,
  }));

  const staticBottomStyle = useAnimatedStyle(() => ({
    opacity: (scrollY.value > VISIBILITY_THRESHOLD && hasNext.value) ? 0 : 1,
    zIndex: 2,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(scrollY.value), [0, 0.5, 1], [0, 0.3, 0], Extrapolate.CLAMP),
  }));

  const topLoaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: loaderY.value }],
      opacity: interpolate(loaderY.value, [-60, 20], [0, 1], Extrapolate.CLAMP),
    };
  });

  if (activeLoading && formattedNews.length === 0) {
     return (
        <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout}>
           <NewsSkeleton height={containerHeight} theme={theme} />
        </View>
     );
  }

  // ALL CAUGHT UP STATE
  if (!activeLoading && formattedNews.length === 0) {
    return (
      <View style={[styles.container, styles.centerView, { backgroundColor: theme.background }]}>
        <Icon name="check-all" size={60} color="#666" style={{ marginBottom: 15 }} />
        <Text style={[styles.emptyText, { color: theme.text }]}>You're all caught up!</Text>
      </View>
    );
  }

  if (!displayNews) {
    return <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.background }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout}>
          
          <Animated.View style={[styles.refreshLoaderContainer, topLoaderStyle]}>
            <ActivityIndicator size="large" color="#4dabf5" />
          </Animated.View>

          {activeNextNews && (
             <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
               <MemoizedCard newsItem={activeNextNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
             </Animated.View>
          )}
          {activePrevNews && (
             <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
               <MemoizedCard newsItem={activePrevNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
             </Animated.View>
          )}

          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
            <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={!isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
          </Animated.View>

          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
            <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={!isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
          </Animated.View>

          {nextNews && (
            <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, flipNextStyle]}>
              <Animated.View style={[styles.face, nextFrontStyle]}>
                <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>
              <Animated.View style={[styles.face, nextBackStyle]}>
                <CardHalf newsItem={activeNextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>
              <Animated.View style={[styles.shadow, shadowStyle]} />
            </Animated.View>
          )}

          {prevNews && (
            <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, flipPrevStyle]}>
              <Animated.View style={[styles.face, prevFrontStyle]}>
                <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>
              <Animated.View style={[styles.face, prevBackStyle]}>
                <CardHalf newsItem={activePrevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>
              <Animated.View style={[styles.shadow, shadowStyle]} />
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  halfWrapper: { position: 'absolute', left: 0, right: 0, overflow: 'hidden', backgroundColor: 'transparent' },
  halfCardContainer: { flex: 1, overflow: 'hidden' },
  innerContainer: { position: 'absolute', width: '100%', left: 0 },
  face: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', backfaceVisibility: 'visible' },
  shadow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  skeletonContainer: { flex: 1 },
  skeletonContent: { flex: 1, padding: 20 },
  centerView: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600' },
  refreshLoaderContainer: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#2C2C2C', borderRadius: 25, padding: 8, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
});

export default FlipNewsScreen;