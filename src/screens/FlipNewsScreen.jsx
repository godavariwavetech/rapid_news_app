import {articleCounters, articleDayKey} from '../utils/articleCounters';
import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ToastAndroid, ActivityIndicator, AppState } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  interpolate, Extrapolate, runOnJS, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { markNewsAsRead, fetchUnreadNewsCount, viewNews } from '../redux/reducers/news';
import Way2NewsCard from '../components/Way2NewsCard';
import FastImage from 'react-native-fast-image';
import { prefetchVideo } from '../utils/videoFileCache';
import ShimmerLoader from '../components/ShimmerLoader';
import SurveyCard from '../components/SurveyCard';
import ViralPostCard from '../components/ViralPostCard';
import { lightTheme, darkTheme } from '../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const formatTimeAgo = (dateString, dayOffset) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return Math.floor(seconds) + ' seconds ago';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' minutes ago';

  if (dayOffset != null && dayOffset > 0) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(todayStart.getTime() - dayOffset * 86400000);
    const targetDayEnd = new Date(targetDay.getTime() + 86400000);
    if (date >= targetDay && date < targetDayEnd) {
      if (dayOffset === 1) return 'Yesterday';
      const sameYear = targetDay.getFullYear() === now.getFullYear();
      return targetDay.toLocaleDateString('en-US', sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  if (date >= yesterdayStart && date < todayStart) return 'Yesterday';

  // Past the 1-hour mark, show the exact time it was posted (e.g. "4:01 AM")
  // instead of relative hours; previous-day posts are labeled above.
  if (date >= todayStart) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
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

// 1. Memoized Card
const MemoizedCard = React.memo(({ newsItem, height, fitToContainer = false, onPress, onCommentsPress, isActive = true, onAutoNext, viralSlideIndex, onViralSlideChange, viralPanX, onPressViral, onPressTag }) => {
  if (!newsItem) return null;
  return (
   <View style={{ height }}>
      {newsItem.type === 'SURVEY' ? (
        <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
      ) : newsItem.type === 'VIRAL_POST' ? (
        <ViralPostCard news={newsItem} height={height} activeSlide={viralSlideIndex} onSlideChange={onViralSlideChange} panX={viralPanX} onPress={onPress} onPressViral={onPressViral} />
      ) : (
        <Way2NewsCard cardHeight={fitToContainer || newsItem.isAd ? height : undefined} news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} onPressTag={onPressTag} />
      )}
    </View>
  );
}, (prev, next) => prev.newsItem === next.newsItem && prev.height === next.height && prev.fitToContainer === next.fitToContainer && prev.isActive === next.isActive && prev.viralSlideIndex === next.viralSlideIndex);

// 2. CardHalf
const CardHalf = React.memo(({ newsItem, side, height, fitToContainer = false, onPress, onCommentsPress, isActive = true, theme, onAutoNext, viralSlideIndex, onViralSlideChange, viralPanX, onPressViral, onPressTag }) => {
  if (!newsItem) return null;
  const halfHeight = height / 2;
  const isTop = side === 'top';
  return (
    <View style={[styles.halfCardContainer, { backgroundColor: theme?.background || '#fff' }]}>
      <View style={[styles.innerContainer, { height, top: isTop ? 0 : -halfHeight, backgroundColor: theme?.background || '#fff' }]}>
        {newsItem.type === 'SURVEY' ? (
          <SurveyCard survey={newsItem} onAutoNext={onAutoNext} />
        ) : newsItem.type === 'VIRAL_POST' ? (
          <ViralPostCard news={newsItem} height={height} activeSlide={viralSlideIndex} onSlideChange={onViralSlideChange} panX={viralPanX} onPress={onPress} onPressViral={onPressViral} />
        ) : (
          <Way2NewsCard cardHeight={fitToContainer || newsItem.isAd ? height : undefined} news={newsItem} onPress={onPress} onCommentsPress={onCommentsPress} isActive={isActive} isBottomHalf={!isTop} onPressTag={onPressTag} />
        )}
      </View>
    </View>
  );
});

// WRAP WITH FORWARD REF
const FlipNewsScreen = forwardRef(({ toggleUI, hideUI, onCommentsPress, onRefresh, onEndReached, onIndexChange, feedType = 'main', onPressViral, onPressTag, overrideItems, onOverlayEndReached, overlayHasMore = false, overlayMoreLoading = false, fitToContainer = false, onSwipeUpAtEnd, onSwipeDownAtStart }, ref) => {
  const dispatch = useDispatch();
  const { articles, totalNews, todayTotalNews, currentDayOffset, unreadArticles, unreadCount, loading, isLoadingMore, isLoadingUnread, isLoadingMoreUnread, unreadHasMore, hasMore } = useSelector(state => state.news);
  const { bookmarks } = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const activeArticles = feedType === 'unread' ? unreadArticles : articles;
  const activeLoading = feedType === 'unread' ? isLoadingUnread : loading;
  const activeIsLoadingMore = feedType === 'unread' ? isLoadingMoreUnread : isLoadingMore;
  const activeHasMore = feedType === 'unread' ? unreadHasMore : hasMore;

  const bookmarkedIds = useMemo(() => {
    return bookmarks?.map(item => item.news?._id);
  }, [bookmarks]);

  // Declared here (not further below) because the preload/prefetch effects
  // below reference currIndex in their dependency array, which is evaluated
  // immediately when useEffect() is called — referencing it before this
  // declaration ran threw "Cannot access 'currIndex' before initialization".
  const [currIndex, setCurrIndex] = useState(0);
  // A VIRAL_POST card is split into a separate top-half and bottom-half
  // mount by CardHalf (see the render below) so the flip animation can
  // clip/shift each half independently — fine for a static image, but a
  // card-internal horizontal swipe (ViralPostCard's own image carousel)
  // can't be a native FlatList's own scroll state per half: that would be
  // TWO INDEPENDENT scroll positions, one per half, each only receiving the
  // touches inside its own half of the screen, so a live drag started in
  // the top half moves only the top half in real time while the bottom
  // half sits frozen on the old slide until some later sync catches up —
  // exactly the "half old image / half new image" split reported, visible
  // WHILE dragging, not just after.
  //
  // viralPanX is a Reanimated shared value, not React state: passed as the
  // SAME object to both halves, a mutation from either half's gesture
  // handler is visible to both halves' useAnimatedStyle on the UI thread in
  // the same frame, so they move in lockstep pixel-for-pixel during the
  // drag itself, not just once it settles. viralSlideIndex is the settled
  // integer index (JS state, for the dot indicator + caption text, which
  // don't need per-frame updates).
  const viralPanX = useSharedValue(0);
  const [viralSlideIndex, setViralSlideIndex] = useState(0);
  // Same reason: formattedNews (a useMemo, whose factory runs synchronously
  // during render, unlike useEffect) reads nowTick — it must exist first.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (formattedNews.length > 0) {
        setCurrIndex(0);
        scrollY.value = 0;
        swipeDirection.value = 0;
      }
    },
    getCurrentIndex: () => currIndex,
    // Used to restore the exact card the reader was on before a temporary
    // overlay (e.g. the viral posts rail) took over — see overrideItems.
    jumpToIndex: (i) => {
      const clamped = Math.max(0, Math.min(i, formattedNews.length - 1));
      if (formattedNews.length > 0) {
        setCurrIndex(clamped);
        scrollY.value = 0;
        swipeDirection.value = 0;
      }
    }
  }));

  const formattedNews = useMemo(() => {
    const rawItems = overrideItems || activeArticles?.items || (Array.isArray(activeArticles) ? activeArticles : []);

    const now = new Date(nowTick);

    const counters = articleCounters(rawItems, {today: articleDayKey(now), unread: feedType === 'unread', unreadCount, overlay: Boolean(overrideItems)});

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
      } else if (item.type === 'SURVEY') {
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
      else if (item.type === 'VIRAL_POST') {
        // Passed straight through — ViralPostCard reads the magazine shape
        // (title/cards/shares) directly, same as MagazineViralRail already does.
        return {
          id: item.data._id,
          type: 'VIRAL_POST',
          data: item.data,
          isAd: false,
          itemIndex: null,
          totalNews: null,
        };
      }
      else {
        const data = item.data || item;
        // Determine which day offset this item belongs to
        const publishedAt = data.published_at;
        const counter = counters.get(data._id);
        const itemIndex = counter?.index || 1;
        const dayTotal = counter?.total || 1;
        const isToday = articleDayKey(publishedAt) === articleDayKey(now);
        const itemDayOffset = isToday ? 0 : currentDayOffset > 0 ? currentDayOffset : null;

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
          article_links: data.article_links || null,
          publishedAt,
          _dayOffset: itemDayOffset, // #6: kept so the visible card can re-derive timeAgo without remapping the whole list
          timeAgo: formatTimeAgo(publishedAt, itemDayOffset),
          likes: data?.reactions?.likes || 0,
          dislikes: data?.reactions?.dislikes || 0,
          comments: data?.comments?.count || 0,
          commentsEnabled: data?.comments?.enabled !== false,
          // Backend sends { _id, name, role, photo, village } for reporter-authored
          // stories and null for editor/admin ones — pass the null straight through,
          // a synthesized "Reporter" here would put a byline on every admin story.
          reporter: data.reporter || null,
          tags: data.tags || [],
          is_top_story: data.is_top_story === true,
          is_trending: data.is_trending === true,
          is_rapid_exclusive: data.is_rapid_exclusive === true,
          isPinned: data.is_feed_pinned === true,
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
  }, [activeArticles, overrideItems, bookmarkedIds, currentDayOffset, feedType, unreadCount]);

  useEffect(() => {
    const adImages = formattedNews
      .filter(item => item.isAd && item.image)
      .map(item => ({ uri: item.image, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }));
    if (adImages.length > 0) FastImage.preload(adImages);
  }, [formattedNews]);

  // Change #8: Video + image window preloading
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
    //
    // The current card's download must NOT share bandwidth with the "ahead" ones —
    // firing all 6 in parallel (the old behavior) meant the video the user is about
    // to watch was competing with 5 they haven't scrolled to yet, which is what
    // made first-play loading feel slow even though playback itself was smooth
    // once buffered. So: kick off the current item alone, and only start the ahead
    // batch once that download has settled (or failed).
    const prefetchItem = (item) => {
      if (!item) return Promise.resolve();
      if (item.isAd) {
        if (item.mediaType === 'video' && item.video) return prefetchVideo(item.video);
      } else if (item.videos?.length) {
        return prefetchVideo(item.videos[0]);
      }
      return Promise.resolve();
    };

    const [current, ...ahead] = formattedNews.slice(currIndex, currIndex + 6);
    prefetchItem(current).finally(() => {
      ahead.forEach(prefetchItem);
    });
  }, [currIndex, formattedNews]);

  const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Change #9: switching/override/userSwipedPastEnd states
  const [isSwitching, setIsSwitching] = useState(false);
  const [overrideNews, setOverrideNews] = useState(null); // { current, next, prev }
  const [userSwipedPastEnd, setUserSwipedPastEnd] = useState(false);

  const halfHeight = containerHeight / 2;
  const scrollY = useSharedValue(0);
  const loaderY = useSharedValue(-60);
  const isAnimating = useSharedValue(false);
  const swipeDirection = useSharedValue(0);
  const hasNext = useSharedValue(formattedNews.length > 1);
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

  useEffect(() => {
    hasNext.value = !!nextNews;
    hasPrev.value = !!prevNews;
  }, [nextNews, prevNews]);

  const displayNews = overrideNews || currentNews;
  const activeCurrentNews = isSwitching ? displayNews : currentNews;

  // Fresh viral post -> back to its first slide, not wherever the previous
  // viral post's carousel happened to be left.
  useEffect(() => {
    setViralSlideIndex(0);
    viralPanX.value = 0;
  }, [activeCurrentNews?.id]);
  const activeNextNews = isSwitching ? displayNews : nextNews;
  const activePrevNews = isSwitching ? displayNews : prevNews;

  useEffect(() => {
    if (onIndexChange) onIndexChange(currIndex);
  }, [currIndex, onIndexChange]);

  useEffect(() => {
    if (overrideItems && overlayHasMore && !overlayMoreLoading && formattedNews.length > 0 && currIndex >= formattedNews.length - 5) onOverlayEndReached?.();
  }, [overrideItems, overlayHasMore, overlayMoreLoading, formattedNews.length, currIndex, onOverlayEndReached]);

  // Pre-fetch next page when user lands on the second-to-last item
  useEffect(() => {
    // overrideItems is a fixed, unpaginated list (the viral posts rail) —
    // activeHasMore/activeLoading still reflect whatever the underlying main
    // feed was doing, so this must not act on them while overriding.
    if (overrideItems || !activeHasMore || activeIsLoadingMore || activeLoading) return;
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
  const debounceTimerRef = useRef(null); // Change #13: debounce timer ref

  const flushReadBatch = useCallback(() => {
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

  // Change #13: scheduleFlush — debounced read tracking
  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushReadBatch();
    }, 500);
  }, [flushReadBatch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') flushReadBatch();
    });
    return () => {
      sub.remove();
      flushReadBatch();
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [flushReadBatch]);

  useEffect(() => {
    flushTimerRef.current = setInterval(flushReadBatch, 2000);
    return () => clearInterval(flushTimerRef.current);
  }, [flushReadBatch]);

  // Track impression: add ID immediately on swipe-away, or after 1s if still viewing.
  // A viral post has no "read"/unread concept (it never feeds the unread badge or
  // NewsRead), so it is routed to the standalone view counter instead of the news
  // read-batch - same impression timing, different destination.
  useEffect(() => {
    if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    if (!currentNews?.id || currentNews.isAd) return;

    const newsId = currentNews.id;
    const isViralPost = currentNews.type === 'VIRAL_POST';

    const recordImpression = () => {
      if (isViralPost) {
        dispatch(viewNews(newsId)).catch(() => {});
        return;
      }
      readBatchRef.current.add(newsId);
      if (readBatchRef.current.size >= 10) {
        flushReadBatch();
      } else {
        scheduleFlush();
      }
    };

    impressionTimerRef.current = setTimeout(recordImpression, 1000);

    return () => {
      clearTimeout(impressionTimerRef.current);
      // Always count the view/read on swipe-away, even if < 1s
      recordImpression();
    };
  }, [currentNews?.id, currentNews?.isAd, currentNews?.type, dispatch, flushReadBatch, scheduleFlush]);

  // Change #12: isSwitching useEffect — resets scroll and clears switching state
  useEffect(() => {
    if (!isSwitching) return;
    scrollY.value = 0;
    swipeDirection.value = 0;
    const timer = setTimeout(() => {
      setIsSwitching(false);
      setOverrideNews(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [isSwitching]);

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
    if (overrideItems) {
      scrollY.value = withSpring(0, SPRING_CONFIG);
      loaderY.value = withSpring(-60, SPRING_CONFIG);
      return;
    }
    setIsRefreshing(true);
    loaderY.value = withSpring(20, SPRING_CONFIG);
    // Pull-to-refresh re-fetches the main feed — meaningless (and confusing)
    // while overrideItems has taken over the screen with the fixed viral rail.
    if (onRefresh && !overrideItems) onRefresh();
    scrollY.value = withSpring(0, SPRING_CONFIG);
  };

  const isLoadingMoreRef = useRef(false);
  const triggerLoadMore = () => {
    if (overrideItems) { if (overlayHasMore && !overlayMoreLoading) onOverlayEndReached?.(); return; }
    scrollY.value = withSpring(0, SPRING_CONFIG);
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    if (onEndReached) onEndReached();
  };

  useEffect(() => {
    if (!activeIsLoadingMore && !loading) isLoadingMoreRef.current = false;
  }, [activeIsLoadingMore, loading]);

  // Preload next page when user reaches last 3 items
  useEffect(() => {
    if (
      formattedNews.length > 0 &&
      currIndex >= formattedNews.length - 3 &&
      activeHasMore &&
      !activeIsLoadingMore &&
      !isLoadingMoreRef.current
    ) {
      isLoadingMoreRef.current = true;
      if (onEndReached) onEndReached();
    }
  }, [currIndex, formattedNews.length, activeHasMore, activeIsLoadingMore]);

  // Change #15: reset userSwipedPastEnd when new articles arrive
  useEffect(() => {
    if (formattedNews.length > currIndex + 1) {
      setUserSwipedPastEnd(false);
    }
  }, [formattedNews.length, currIndex]);

  const autoSwipeNext = () => {
    if (isAnimating.value) return;
    if (!hasNext.value) {
      if (!activeHasMore && Platform.OS === 'android') ToastAndroid.show("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
      setUserSwipedPastEnd(true);
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

      // Linked article dismissal is animated by the navigator as one whole
      // screen. Rotating its card halves here leaves them cut during that slide.
      const dismissingLinkedArticle =
        (position > 0 && !hasNext.value && !!onSwipeUpAtEnd) ||
        (position < 0 && !hasPrev.value && !!onSwipeDownAtStart);
      if (dismissingLinkedArticle) {
        scrollY.value = 0;
        swipeDirection.value = 0;
        loaderY.value = -60;
        return;
      }

      if (!hasNext.value && position > 0) {
        position = position / 3;
      }
      else if (!hasPrev.value && position < 0) {
        position = position / 3;

        if (!isRefreshing && !onSwipeDownAtStart) {
          const dragY = e.translationY;
          loaderY.value = Math.min(-60 + (dragY * 0.4), 20);
        }
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
          // A linked article is an isolated screen above its source. Swiping
          // past it should reveal that source, preserving its feed position.
          if (onSwipeUpAtEnd) {
            scrollY.value = 0;
            swipeDirection.value = 0;
            isAnimating.value = true;
            runOnJS(onSwipeUpAtEnd)();
            return;
          }
          if (!activeHasMore && Platform.OS === 'android') {
            runOnJS(ToastAndroid.show)("మరింత సమాచారం లేదు", ToastAndroid.SHORT);
          }
          runOnJS(setUserSwipedPastEnd)(true);
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
          if (onSwipeDownAtStart) {
            scrollY.value = 0;
            swipeDirection.value = 0;
            loaderY.value = -60;
            isAnimating.value = true;
            runOnJS(onSwipeDownAtStart)();
            return;
          }
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

  if (!activeCurrentNews) {
    return <View style={[styles.container, { backgroundColor: theme.background }]} onLayout={onLayout} />;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: '#2C2C2C', paddingTop: insets.top }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, { backgroundColor: theme.background, overflow: 'hidden' }]} onLayout={onLayout}>

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

          {/* Next card bottom half sits behind — visible during swipe-next */}
          {activeNextNews && (
            <Animated.View style={[styles.absoluteFill, destinationNextStyle]}>
              <MemoizedCard fitToContainer={fitToContainer} newsItem={activeNextNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
            </Animated.View>
          )}
          {activePrevNews && (
            <Animated.View style={[styles.absoluteFill, destinationPrevStyle]}>
              <MemoizedCard fitToContainer={fitToContainer} newsItem={activePrevNews} height={containerHeight} onPress={()=>{}} onCommentsPress={()=>{}} isActive={false} onAutoNext={autoSwipeNext} />
            </Animated.View>
          )}

          {activeCurrentNews?.isAd && activeCurrentNews.mediaType === 'video' && !!activeCurrentNews.video && !isSwitching ? (
            // Video ads render as ONE full card so
            // the video isn't cut to the top half by the two-half flip split.
            // While switching, fall through to the normal halves below so the
            // flip animation is unchanged (it briefly shows the ad's poster).
            // Image ads use the stationary halves below, which hide during
            // the flip so the outgoing ad cannot cover the destination card.
            <Animated.View style={styles.absoluteFill}>
              <MemoizedCard fitToContainer={fitToContainer} newsItem={activeCurrentNews} height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[styles.halfWrapper, { top: 0, height: halfHeight }, staticTopStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
                <CardHalf fitToContainer={fitToContainer} newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
              </Animated.View>

              <Animated.View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }, staticBottomStyle, isSwitching && { opacity: 1, zIndex: 100 }]}>
                <CardHalf fitToContainer={fitToContainer} newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
              </Animated.View>
            </>
          )}

          {activeNextNews && (
            <View style={[styles.halfWrapper, { bottom: 0, height: halfHeight }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, flipNextStyle]}>
                <Animated.View style={[styles.face, nextFrontStyle]}>
                  <CardHalf fitToContainer={fitToContainer} newsItem={activeCurrentNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
                </Animated.View>
                <Animated.View style={[styles.face, nextBackStyle]}>
                  <CardHalf fitToContainer={fitToContainer} newsItem={activeNextNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
                </Animated.View>
                <Animated.View style={[styles.shadow, shadowStyle]} />
              </Animated.View>
            </View>
          )}

          {activePrevNews && (
            <View style={[styles.halfWrapper, { top: 0, height: halfHeight }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, flipPrevStyle]}>
                <Animated.View style={[styles.face, prevFrontStyle]}>
                  <CardHalf fitToContainer={fitToContainer} newsItem={activeCurrentNews} side="top" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
                </Animated.View>
                <Animated.View style={[styles.face, prevBackStyle]}>
                  <CardHalf fitToContainer={fitToContainer} newsItem={activePrevNews} side="bottom" height={containerHeight} onPress={toggleUI} onCommentsPress={onCommentsPress} isActive={true} theme={theme} onAutoNext={autoSwipeNext} viralSlideIndex={viralSlideIndex} onViralSlideChange={setViralSlideIndex} viralPanX={viralPanX} onPressViral={onPressViral} onPressTag={onPressTag} />
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
