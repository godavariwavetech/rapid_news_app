import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Platform, ToastAndroid, ActivityIndicator, AppState } from 'react-native';
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
import { markNewsAsRead, fetchUnreadNewsCount } from '../redux/reducers/news';
import Way2NewsCard from '../components/Way2NewsCard';
import FastImage from 'react-native-fast-image';
import { prefetchVideo } from '../utils/videoFileCache';
import ShimmerLoader from '../components/ShimmerLoader';
import SurveyCard from '../components/SurveyCard';
import { lightTheme, darkTheme } from '../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- HELPER: TIME AGO CALCULATION ---
// Always computed against current time so it stays accurate.
// dayOffset: if provided and > 0, forces "Yesterday" or a date label
// regardless of the clock difference (e.g. 17h ago but from yesterday's feed).
const formatTimeAgo = (dateString, dayOffset) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();

  // If the API says this item is from a previous day's offset, show date label directly
  if (dayOffset != null && dayOffset > 0) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(todayStart.getTime() - dayOffset * 86400000);
    const targetDayEnd = new Date(targetDay.getTime() + 86400000);

    // If the item actually falls in that offset day, label it
    if (date >= targetDay && date < targetDayEnd) {
      if (dayOffset === 1) return 'Yesterday';
      const sameYear = targetDay.getFullYear() === now.getFullYear();
      return targetDay.toLocaleDateString('en-US', sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return Math.floor(seconds) + ' seconds ago';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' minutes ago';

  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return hours + ' hours ago';

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  if (date >= yesterdayStart && date < todayStart) return 'Yesterday';

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- SKELETON LOADING COMPONENT ---
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

// --- PHYSICS CONFIGURATION ---
const SPRING_CONFIG = {
  mass: 0.6,
  damping: 28,
  stiffness: 220,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 1,
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
  // <--- ADDED: Extract totalNews from Redux
  const { articles, totalNews, todayTotalNews, currentDayOffset, unreadArticles, unreadCount, loading, isLoadingMore, isLoadingUnread, isLoadingMoreUnread, unreadHasMore, hasMore } = useSelector(state => state.news);
  const {bookmarks} = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const activeArticles = feedType === 'unread' ? unreadArticles : articles;
  const activeLoading = feedType === 'unread' ? isLoadingUnread : loading;
  const activeHasMore = feedType === 'unread' ? unreadHasMore : hasMore;
  const activeIsLoadingMore = feedType === 'unread' ? isLoadingMoreUnread : isLoadingMore;
  
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

    const now = new Date(nowTick);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayCounters = {};

    return rawItems.map((item) => {
      if (item.type === 'AD') {
        return {
          id: item.data._id,
          type: 'AD',
          isAd: true,
          image: item.data.image,
          video: item.data.video,
          mediaType: item.data.media_type || 'image',
          redirectUrl: item.data.redirect_url,
          label: item.data.label || 'Sponsored',
          title: item.data.label || 'Advertisement',
          likes: 0,
          dislikes: 0,
          comments: 0,
          commentsEnabled: false,
          images: [],
          itemIndex: null,
          totalNews: null,
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
          itemIndex: null,
          totalNews: null,
        };
      }
      else {
        const data = item.data || item;
        const publishedAt = data.published_at;
        const pubDate = publishedAt ? new Date(publishedAt) : null;

        // Build a day key from the publish date so each calendar day gets its own counter
        let dayKey = 'unknown';
        if (pubDate) {
          dayKey = `${pubDate.getFullYear()}-${pubDate.getMonth()}-${pubDate.getDate()}`;
        }
        dayCounters[dayKey] = (dayCounters[dayKey] || 0) + 1;
        const itemIndex = dayCounters[dayKey];

        const isToday = pubDate && pubDate >= todayStart;

        // For items from a previous day offset, pass the offset so timeAgo shows
        // "Yesterday" / date instead of "17 hours ago"
        const itemDayOffset = isToday ? 0 : currentDayOffset > 0 ? currentDayOffset : null;
        let dayTotal;
        if (feedType === 'unread') {
          dayTotal = unreadCount || rawItems.filter(i => i.type !== 'AD' && i.type !== 'SURVEY').length;
        } else if (isToday) {
          // Use the total stamped on this item at fetch time so the counter
          // doesn't jump while the user is still viewing the last card.
          dayTotal = item._batch_today_total || rawItems.filter(i => i.type !== 'AD' && i.type !== 'SURVEY').length;
        } else {
          dayTotal = item._batch_total || rawItems.filter(i => i.type !== 'AD' && i.type !== 'SURVEY').length;
        }

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
          publishedAt,
          _dayOffset: itemDayOffset, // #6: kept so the visible card can re-derive timeAgo without remapping the whole list
          timeAgo: formatTimeAgo(publishedAt, itemDayOffset),
          likes: data?.reactions?.likes || 0,
          dislikes: data?.reactions?.dislikes || 0,
          comments: data?.comments?.count || 0,
          commentsEnabled: data?.comments?.enabled !== false,
          // Backend sends { _id, name, role, photo }; photo is null until the
          // reporter uploads one, so the card falls back to an initial avatar.
          reporter: data.reporter || { name: 'Reporter', photo: null },
          tags: data.tags || [],
          isLiked: data?.reactions?.my_reaction === 'LIKE',
          isDisliked: data?.reactions?.my_reaction === 'DISLIKE',
          isBookmarked: bookmarkedIds.includes(data._id),
          itemIndex,
          totalNews: dayTotal,
        };
      }
    });
    // #6: nowTick deliberately NOT a dep — the 60s tick no longer re-maps the
    // whole list; only the visible card's timeAgo is refreshed (see currentNews).
  }, [activeArticles, bookmarkedIds, currentDayOffset]);

  // Preload all ad images as soon as the feed is ready
  useEffect(() => {
    const adImages = formattedNews
      .filter(item => item.isAd && item.image)
      .map(item => ({ uri: item.image, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }));
    if (adImages.length > 0) FastImage.preload(adImages);
  }, [formattedNews]);

  // Preload images + warm video HTTP cache for upcoming items
  useEffect(() => {
    // #5: trim the initial preload window. On the very first paint (currIndex 0)
    // only warm 3 ahead so the first visible card's image isn't fighting ~10
    // high-priority preloads. Once the user swipes (currIndex > 0) the full
    // 10-ahead window kicks back in — swipe-ahead images load a beat later.
    const aheadCount = currIndex === 0 ? 3 : 10;
    // 10 ahead + 2 behind covers fast swipers and back-swipes
    const window = formattedNews.slice(
      Math.max(0, currIndex - 2),
      currIndex + 1 + aheadCount,
    );

    // Images via FastImage cache
    const imageUris = window
      .flatMap(item => {
        const uris = [];
        if (item.image) uris.push(item.image);
        if (item.images?.length) uris.push(...item.images);
        if (item.thumbnail) uris.push(item.thumbnail);
        // YouTube thumbnail
        if (item.videos?.length) {
          const ytMatch = item.videos[0]?.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
          if (ytMatch) uris.push(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
        }
        return uris;
      })
      .filter(Boolean)
      .map(uri => ({ uri, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }));

    if (imageUris.length > 0) FastImage.preload(imageUris);

    // Download upcoming videos to local disk so they play instantly (no buffering).
    // News videos live on item.videos[]; ad videos on item.video. YouTube links are
    // skipped inside prefetchVideo. Look a few cards ahead (and include the current
    // one so it's cached for replay-on-return).
    formattedNews.slice(currIndex, currIndex + 6).forEach(item => {
      if (item.isAd) {
        if (item.mediaType === 'video' && item.video) prefetchVideo(item.video);
      } else if (item.videos?.length) {
        prefetchVideo(item.videos[0]);
      }
    });
  }, [currIndex, formattedNews]);

  const [currIndex, setCurrIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
  // Tick every 60s so timeAgo labels stay current
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  
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

  // #6: live-refresh only the visible card's timeAgo on each 60s tick, instead of
  // re-mapping the entire feed list (which also needlessly re-fired the preload
  // effects keyed on `formattedNews`). Off-screen next/prev cards get a fresh
  // label the moment they become current (currIndex change recomputes this memo).
  const currentNews = useMemo(() => {
    const item = formattedNews[currIndex];
    if (!item || item.type !== 'NEWS') return item;
    return { ...item, timeAgo: formatTimeAgo(item.publishedAt, item._dayOffset) };
  }, [currIndex, formattedNews, nowTick]);
  
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

  // Pre-fetch next page when user lands on the second-to-last item
  useEffect(() => {
    if (!activeHasMore || activeIsLoadingMore || activeLoading) return;
    const total = formattedNews.length;
    // Prefetch ~5 cards before the end (was 2) so the next page has time to
    // arrive over the network (~2s) before the user reaches the last card —
    // no stall for normal scrolling. Dedupe in the reducer prevents duplicates.
    // currIndex > 0: never auto-fire page-2 while still on the freshly-loaded
    // first card — otherwise a SHORT feed (total <= 5) would trigger a load-more
    // the instant a fresh/tab-switch load lands, flashing the bottom toast.
    if (total > 0 && currIndex > 0 && currIndex >= total - 5) {
      if (!isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true;
        if (onEndReached) onEndReached();
      }
    }
  }, [currIndex, formattedNews.length, activeHasMore, activeIsLoadingMore, activeLoading]);

  useEffect(() => {
    if (currIndex >= formattedNews.length && formattedNews.length > 0) {
      setCurrIndex(0);
      scrollY.value = 0;
      swipeDirection.value = 0;
    }
  }, [formattedNews.length, currIndex, scrollY, swipeDirection]);

  // Handle hiding the loader once Redux `loading` is finished
  useEffect(() => {
    if (!activeLoading && isRefreshing) {
      setIsRefreshing(false);
      loaderY.value = withTiming(-60, { duration: 300 }); 
    }
  }, [activeLoading, isRefreshing]);

  // --- Impression-based read tracking with batching ---
  // Strategy: collect IDs in a Set, flush after 5s of inactivity (debounce),
  // immediately on 10+ IDs, on app background, and on unmount.
  const readBatchRef = useRef(new Set());
  const debounceTimerRef = useRef(null);
  const impressionTimerRef = useRef(null);

  const flushReadBatch = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (readBatchRef.current.size === 0) return;
    const ids = Array.from(readBatchRef.current);
    readBatchRef.current.clear();
    // Optimistic decrement happens in the reducer; reconcile the badge with the
    // server once the read batch is persisted.
    dispatch(markNewsAsRead(ids))
      .unwrap()
      .then(() => dispatch(fetchUnreadNewsCount()))
      .catch(() => {});
  }, [dispatch]);

  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flushReadBatch, 2000);
  }, [flushReadBatch]);

  // Flush on app background or unmount
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') flushReadBatch();
    });
    return () => {
      sub.remove();
      flushReadBatch();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    };
  }, [flushReadBatch]);

  // Track impression: add ID immediately on swipe-away, or after 1s if still viewing
  useEffect(() => {
    if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    if (!currentNews?.id || currentNews.isAd) return;

    const newsId = currentNews.id;

    impressionTimerRef.current = setTimeout(() => {
      readBatchRef.current.add(newsId);
      if (readBatchRef.current.size >= 10) {
        flushReadBatch();
      } else {
        scheduleFlush();
      }
    }, 1000);

    return () => {
      clearTimeout(impressionTimerRef.current);
      // Always mark as read on swipe-away, even if < 1s
      readBatchRef.current.add(newsId);
      if (readBatchRef.current.size >= 10) {
        flushReadBatch();
      } else {
        scheduleFlush();
      }
    };
  }, [currentNews?.id, currentNews?.isAd, flushReadBatch, scheduleFlush]);

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
  
  const isLoadingMoreRef = useRef(false);
  const [userSwipedPastEnd, setUserSwipedPastEnd] = useState(false);

  const triggerLoadMore = () => {
    scrollY.value = withSpring(0, SPRING_CONFIG);
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setUserSwipedPastEnd(true);
    if (onEndReached) onEndReached();
  };

  // Reset the guard and swipe flag once loading finishes
  useEffect(() => {
    if (!activeIsLoadingMore && !activeLoading) {
      isLoadingMoreRef.current = false;
      setUserSwipedPastEnd(false);
    }
  }, [activeIsLoadingMore, activeLoading]);

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
         { duration: 180, easing: Easing.out(Easing.quad) }, 
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
             { duration: 180, easing: Easing.out(Easing.quad) }, 
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
             { duration: 180, easing: Easing.out(Easing.quad) }, 
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

          {/* Bottom load-more indicator — shown whenever the next page is
              loading (prefetch near the end OR a swipe past the last card), so
              the network wait reads as "loading" instead of a frozen feed. */}
          {activeIsLoadingMore && !activeLoading && (
            <View style={styles.bottomLoaderContainer}>
              <ActivityIndicator size="small" color="#4dabf5" />
              <Text style={styles.bottomLoaderText}>వార్తలు లోడ్ అవుతున్నాయి...</Text>
            </View>
          )}

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

          {activeCurrentNews?.isAd && !isSwitching ? (
            // Full-bleed ads (esp. full-screen video) render as ONE full card so
            // the video isn't cut to the top half by the two-half flip split.
            // While switching, fall through to the normal halves below so the
            // flip animation is unchanged (it briefly shows the ad's poster).
            <Animated.View style={styles.absoluteFill}>
              <MemoizedCard newsItem={activeCurrentNews} height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} onAutoNext={autoSwipeNext} />
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
                <CardHalf newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={!isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>

              <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
                <CardHalf newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={!isSwitching} theme={theme} onAutoNext={autoSwipeNext} />
              </Animated.View>
            </>
          )}

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
  bottomLoaderContainer: { position: 'absolute', bottom: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2C2C2C', borderRadius: 25, paddingVertical: 8, paddingHorizontal: 16, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, zIndex: 9999 },
  bottomLoaderText: { color: '#4dabf5', fontSize: 13, fontWeight: '600' },
});

export default FlipNewsScreen;