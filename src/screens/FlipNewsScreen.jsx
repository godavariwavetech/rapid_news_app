import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform, ToastAndroid } from 'react-native';
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
const NewsSkeleton = ({ height }) => {
  const imageHeight = height * 0.45;
  return (
    <View style={[styles.skeletonContainer, { height }]}>
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
const MemoizedCard = React.memo(({ newsItem, height, onPress, onCommentsPress }) => {
  if (!newsItem) return null;
  return (
   <View style={{ height }}>
      {newsItem.type === 'SURVEY' ? (
        <SurveyCard survey={newsItem} />
      ) : (
        <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} />
      )}
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
        {newsItem.type === 'SURVEY' ? (
          <SurveyCard survey={newsItem} />
        ) : (
          <Way2NewsCard news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} />
        )}
      </View>
    </View>
  );
});

// WRAP WITH FORWARD REF
const FlipNewsScreen = forwardRef(({ toggleUI, hideUI, onCommentsPress, onRefresh, onEndReached, onIndexChange }, ref) => {
  const dispatch = useDispatch();
  const { articles, loading, hasMore } = useSelector(state => state.news);
    const {bookmarks} = useSelector(state => state.bookmarks);
  
  
    const bookmarkedIds = useMemo(() => {
    return bookmarks?.map(item => item.news?._id);
  }, [bookmarks]);
  
  // const isItemBookmarked = (newsId) => bookmarkedIds.includes(newsId);
  
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
    const rawItems = articles?.items || (Array.isArray(articles) ? articles : []);
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
        isAd: false,
      };
    }
      else {
        const data = item.data;
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
  }, [articles]);

  const [currIndex, setCurrIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [overrideNews, setOverrideNews] = useState(null);
  
  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0); 

  // Track availability of Next/Prev for Animation Logic
  const hasNext = useSharedValue(false);
  const hasPrev = useSharedValue(false);

  const getIndex = useCallback((i) => {
    if (!formattedNews || formattedNews.length === 0) return 0;
    if (i < 0) return 0;
    if (i >= formattedNews.length) return formattedNews.length - 1;
    return i;
  }, [formattedNews]);

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

  // --- TRIGGER API CALL ON NEWS CHANGE ---
  useEffect(() => {
    if (currentNews && currentNews.id && !currentNews.isAd) {
      dispatch(viewNews(currentNews.id));
    }
  }, [currentNews?.id, dispatch]);

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
    if (onRefresh) onRefresh();
    scrollY.value = withSpring(0, SPRING_CONFIG);
  };
  
  const triggerLoadMore = () => {
    if (onEndReached) onEndReached();
    scrollY.value = withSpring(0, SPRING_CONFIG); 
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
            // Toast logic for End of News
            if (!hasMore && Platform.OS === 'android') {
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
           runOnJS(triggerRefresh)();
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

  // --- SKELETON RENDER LOGIC ---
  if (loading && formattedNews.length === 0) {
     return (
        <View style={styles.container} onLayout={onLayout}>
           <NewsSkeleton height={containerHeight} />
        </View>
     );
  }

  if (!displayNews) {
    return <View style={styles.container} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.container} onLayout={onLayout}>
          
          {activeNextNews && (
             <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
               <MemoizedCard newsItem={activeNextNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} />
             </Animated.View>
          )}
          {activePrevNews && (
             <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
               <MemoizedCard newsItem={activePrevNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} />
             </Animated.View>
          )}

          <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
            <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
            <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
          </Animated.View>

          {nextNews && (
            <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, flipNextStyle]}>
              <Animated.View style={[styles.face, nextFrontStyle]}>
                <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
              </Animated.View>
              <Animated.View style={[styles.face, nextBackStyle]}>
                <CardHalf newsItem={activeNextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
              </Animated.View>
              <Animated.View style={[styles.shadow, shadowStyle]} />
            </Animated.View>
          )}

          {prevNews && (
            <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, flipPrevStyle]}>
              <Animated.View style={[styles.face, prevFrontStyle]}>
                <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
              </Animated.View>
              <Animated.View style={[styles.face, prevBackStyle]}>
                <CardHalf newsItem={activePrevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} />
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
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  skeletonContent: {
    flex: 1,
    padding: 20,
  }
});

export default FlipNewsScreen;