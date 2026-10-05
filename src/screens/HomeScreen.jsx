import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  ToastAndroid,
  Alert,
  BackHandler,
  InteractionManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {fetchNews, getCategories, setSelectedCategory, clearNews, fetchViralPostsRail, fetchNewsByTag, searchNews} from '../redux/reducers/news';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import CategoriesModal from '../components/CategoriesModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import OfflineFallback from '../components/OfflineFallback';
import FlipNewsScreen from './FlipNewsScreen';
import { getBookmarks } from '../redux/reducers/bookmarks';
import { postToken, registerGuestFCM } from '../redux/reducers/auth';
import notifee from '@notifee/react-native';

function HomeScreen({navigation, route}) {
  const dispatch = useDispatch();
  
  const { articles, categories, selectedCategory, loading, hasMore, currentPage, currentDayOffset, totalNews, isLoadingMore, error } = useSelector(state => state.news);
  
  // --- ADDED loading: locationLoading HERE ---
  const {currentLocation, loading: locationLoading} = useSelector(state => state.location);
  // Create tab (Requirement 21) - same reporterToken check CategoriesModal's
  // own Create menu item uses, so both entry points resolve to the same
  // screen for the same user.
  const {reporterToken, userToken} = useSelector(state => state.auth);
  const language = useSelector(state => state.settings.language);

  const [uiVisible, setUiVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('HomeTab');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('న్యూస్');
  // Generic temporary overlay on top of the current feed (never replaces
  // `articles`) so backing out returns to the exact card the reader was on —
  // see FlipNewsScreen's overrideItems prop. Used by both the viral posts
  // rail ("వైరల్ »") and hashtag browsing (tapping a "#tag" chip) - same
  // mechanism, just a different fetch and back-bar label per use.
  const [overlayItems, setOverlayItems] = useState(null);
  const [overlayLabel, setOverlayLabel] = useState('');
  const [overlayLoading, setOverlayLoading] = useState(false);
  const overlaySavedIndexRef = useRef(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;
  const flipScreenRef = useRef(null);

  // fetchFn: () => Promise<array of feed items>. Errors are reported with
  // errorMessage (already-localized, since callers know what they were
  // fetching) rather than a generic one so a viral-rail failure and a
  // hashtag failure don't read identically.
  const openOverlay = useCallback(async (label, fetchFn, errorMessage) => {
    overlaySavedIndexRef.current = flipScreenRef.current?.getCurrentIndex?.() ?? 0;
    setOverlayLabel(label);
    setOverlayLoading(true);
    try {
      const result = await fetchFn();
      setOverlayItems(result || []);
      // The card the reader tapped from often has the chrome hidden (swiping
      // into a card hides it) — force it visible so the new back bar is
      // actually on screen instead of translated away with the rest of the
      // hidden chrome.
      setUiVisible(true);
    } catch (e) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('సమాచారం', errorMessage);
      }
    } finally {
      setOverlayLoading(false);
    }
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlayItems(null);
    // Wait a frame so FlipNewsScreen re-renders against the restored
    // (untouched) main feed before jumping — jumping in the same tick would
    // clamp against the stale override list's length.
    requestAnimationFrame(() => {
      flipScreenRef.current?.jumpToIndex?.(overlaySavedIndexRef.current);
    });
  }, []);

  const openViralOverlay = useCallback(() => {
    openOverlay(
      'వైరల్',
      () => dispatch(fetchViralPostsRail()).unwrap(),
      'వైరల్ పోస్ట్‌లు లోడ్ కాలేదు'
    );
  }, [openOverlay, dispatch]);

  const openTagOverlay = useCallback((tag) => {
    if (!tag) return;
    openOverlay(
      `#${tag}`,
      () => dispatch(fetchNewsByTag(tag)).unwrap(),
      'ఈ హ్యాష్‌ట్యాగ్‌కి సంబంధించిన వార్తలు లోడ్ కాలేదు'
    );
  }, [openOverlay, dispatch]);

  const openSearchOverlay = useCallback((query) => {
    if (!query) return;
    openOverlay(
      `"${query}"`,
      () => dispatch(searchNews(query)).unwrap(),
      'శోధన ఫలితాలు లోడ్ కాలేదు'
    );
  }, [openOverlay, dispatch]);

  // SearchScreen navigates back here with { searchQuery } instead of
  // rendering its own results list — same overlay mechanism as tapping a
  // "#tag" chip. Consume the param once, then clear it so re-focusing this
  // screen doesn't replay the same search.
  //
  // A "#"-prefixed query is a hashtag lookup, not free text — /news/search
  // only matches title/short/body, so "#trend" would find nothing even
  // though the by-tag endpoint has an exact match. Route those to the tag
  // overlay instead.
  useEffect(() => {
    const query = route?.params?.searchQuery;
    if (query) {
      const trimmed = query.trim();
      if (trimmed.startsWith('#')) {
        openTagOverlay(trimmed.replace(/^#+/, ''));
      } else {
        openSearchOverlay(trimmed);
      }
      navigation.setParams({ searchQuery: undefined });
    }
  }, [route?.params?.searchQuery, openSearchOverlay, openTagOverlay, navigation]);

  // --- ADDED !locationLoading CHECK HERE ---
  const shouldShowFallback = !loading && !locationLoading && (!articles || articles.length === 0) && !!error;

  const displayLocationName = useMemo(() => {
    return (
      currentLocation?.village?.name?.te || 
      currentLocation?.village?.name?.en  ||
      currentLocation?.district?.name?.te || 
      currentLocation?.district?.name?.en ||
      'రాజమండ్రి'
    );
  }, [currentLocation]);

  // One-time startup work — runs once on mount, not on every location/category
  // change (was previously re-firing, causing duplicate categories/bookmarks/FCM).
  useEffect(() => {
    // getCategories drives header/category-modal labels — keep it on the immediate path.
    dispatch(getCategories())
    // #3: defer the rest off the first-paint path (bookmarks, FCM register,
    // notifee permission) so they don't compete with the initial feed render.
    const task = InteractionManager.runAfterInteractions(() => {
      notifee.requestPermission();
    });
    return () => task.cancel();
  }, [dispatch]);

  // Feed fetch driven by location/category. Guarded by a fetch-key so a fresh
  // `currentLocation` object with identical data (e.g. Splash re-resolving the
  // same area) doesn't trigger a duplicate page-1 fetch.
  const lastFetchKeyRef = useRef(null);
  useEffect(() => {
    // Header title reflects the selected category (always, even if fetch is deduped).
    if (selectedCategory === 'all') {
      setHeaderTitle('న్యూస్');
    } else {
      const activeCat = categories.find(c => c._id === selectedCategory);
      if (activeCat) {
        setHeaderTitle(activeCat.name?.te || activeCat.name?.en || 'న్యూస్');
      }
    }

    const fetchKey = [
      currentLocation?.village?._id || 'def',
      currentLocation?.district?._id || 'def',
      currentLocation?.state?._id || 'def',
      selectedCategory,
      activeTab === 'LocationTab' ? 'village' : 'main',
    ].join('|');
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    if (currentLocation) {
      // Don't clearNews before fetching — it creates a race condition that
      // briefly shows articles=[] and triggers the "no news" toast.
      // fetchNews page 1 already replaces articles in the reducer.
      dispatch(fetchNews({ currentLocation, category: selectedCategory, page: 1, isLocationMode: activeTab === 'LocationTab' }));
    } else {
      // No location yet — fetch with default/fallback location so feed isn't empty
      dispatch(fetchNews({ category: selectedCategory, page: 1, isLocationMode: false }));
    }
  }, [selectedCategory, currentLocation, dispatch]);

  // Refresh account-owned data when a guest signs in without remounting Home.
  useEffect(() => {
    if (userToken || reporterToken) dispatch(getBookmarks());
  }, [dispatch, userToken, reporterToken]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      dispatch(userToken || reporterToken ? postToken() : registerGuestFCM());
    });
    return () => task.cancel();
  }, [dispatch, userToken, reporterToken, language, currentLocation?.state?._id, currentLocation?.district?._id, currentLocation?.village?._id]);

  useEffect(() => {
    const articlesCount = (Array.isArray(articles) ? articles : (articles?.items || [])).length;
    // Guard: only trigger fallback logic when we're fully done loading and truly have no articles
    if (!loading && !isLoadingMore && articlesCount === 0 && !error) {
      let shouldFallback = false;
      let msg = "";

      if (activeTab === 'LocationTab') {
        msg = "ఈ ప్రాంతంలో వార్తలు లేవు. అన్ని వార్తలను చూపిస్తున్నాము.";
        shouldFallback = true;
      } else if (selectedCategory !== 'all') {
        msg = "ఈ వర్గంలో వార్తలు లేవు. అన్ని వార్తలను చూపిస్తున్నాము.";
        shouldFallback = true;
      }

      if (shouldFallback) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Alert.alert("సమాచారం", msg);
        }
        
        if (activeTab === 'LocationTab') {
          setActiveTab('HomeTab');
        }
        
        if (selectedCategory !== 'all') {
          dispatch(setSelectedCategory('all'));
        } else if (activeTab === 'LocationTab') {
          setHeaderTitle('న్యూస్');
          dispatch(fetchNews({ currentLocation, category: 'all', page: 1, isLocationMode: false }));
        }

        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
      }
    }
  }, [articles, loading, selectedCategory, activeTab, error, dispatch, currentLocation]);

  useEffect(() => {
    const handleBack = () => {
      if (overlayItems) {
        closeOverlay();
        return true;
      }
      if (selectedCategory !== 'all') {
        dispatch(setSelectedCategory('all'));
        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [selectedCategory, overlayItems, closeOverlay]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: uiVisible ? 0 : -200,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.spring(bottomTabAnim, {
        toValue: uiVisible ? 0 : 100,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
    ]).start();
  }, [uiVisible]);

  const toggleUI = () => setUiVisible(!uiVisible);
  const hideUI = () => setUiVisible(false);

  const handleTabPress = useCallback((tabId) => {
    if (tabId === 'CategoriesTab') {
      setCategoriesModalVisible(true);
    } else if (tabId === 'CreateTab') {
      // Same target CategoriesModal's Create menu item navigates to - not
      // marked active (no setActiveTab) since it leaves this screen rather
      // than switching the feed view, the same way CategoriesTab's modal
      // doesn't claim the active tab either.
      navigation.navigate(reporterToken ? "ReporterApp" : "Reporter");
    } else if (tabId === 'LocationTab') {
      setActiveTab(tabId);
      setHeaderTitle(displayLocationName);
      // Clear the old tab's news so the existing skeleton shows instantly on
      // switch (no lingering old news). Safe here: this batches with the
      // fetchNews.pending below (loading:true) in one render, so the "no news"
      // fallback (guarded by !loading) doesn't fire on the empty-but-loading state.
      dispatch(clearNews());
      dispatch(fetchNews({
        currentLocation,
        category: selectedCategory,
        page: 1,
        isLocationMode: true
      }));
      if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
    } else if (tabId === 'HomeTab') {
      setActiveTab(tabId);
      setHeaderTitle('న్యూస్');
      dispatch(setSelectedCategory('all'));
      // Clear-and-skeleton on switch back too (see LocationTab note above).
      dispatch(clearNews());
      dispatch(fetchNews({ currentLocation, category: 'all', page: 1, isLocationMode: false }));
      if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
    }
  }, [selectedCategory, currentLocation, displayLocationName, dispatch, navigation, reporterToken]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

     {!shouldShowFallback && (
        <Animated.View style={[styles.headerOverlay, {transform: [{translateY: headerAnim}]}]}>
          <Header 
            title={headerTitle} 
            onProfilePress={() => navigation.navigate("Profile")}
            onTogglePress={() => navigation.navigate("UnreadNewsScreen")} 
          />
        </Animated.View>
      )}

      {shouldShowFallback ? (
        <OfflineFallback onRetry={() => dispatch(fetchNews({currentLocation, category: 'all', page: 1}))} />
      ) : (
        <FlipNewsScreen
          ref={flipScreenRef}
          toggleUI={toggleUI}
          hideUI={hideUI}
          onCommentsPress={(item) => { setSelectedNews(item); setCommentsVisible(true); }}
          onRefresh={() => dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1, current_day_offset: 0, isLocationMode: activeTab === 'LocationTab', userRefresh: true}))}
          onEndReached={() => {
            if (!loading && hasMore) {
              dispatch(fetchNews({
                currentLocation,
                category: selectedCategory,
                page: currentPage + 1,
                current_day_offset: currentDayOffset,
                isLocationMode: activeTab === 'LocationTab'
              }));
            }
          }}
          // Tapping "వైరల్" on a viral post card, or a "#tag" chip on a news
          // card, opens the corresponding items as an overlay on top of the
          // current feed (see openOverlay) — the feed itself and the
          // reader's scroll position are untouched.
          onPressViral={openViralOverlay}
          onPressTag={openTagOverlay}
          overrideItems={overlayItems}
        />
      )}

      {overlayLoading && (
        <View style={styles.overlayLoading} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {!shouldShowFallback && (
        <Animated.View style={[styles.bottomTabOverlay, {transform: [{translateY: bottomTabAnim}]}]}>
          {overlayItems ? (
            // Replaces the normal tab bar while browsing an overlay (viral
            // posts or a hashtag) — its own tabs (న్యూస్/కేటగిరీలు/...) don't
            // apply here and would leave the overlay stuck open if pressed.
            <TouchableOpacity
              style={styles.viralBackBar}
              activeOpacity={0.8}
              onPress={closeOverlay}
            >
              <Icon name="chevron-left" size={22} color="#fff" />
              <Text style={styles.viralBackBarText}>{overlayLabel}</Text>
            </TouchableOpacity>
          ) : (
            <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} locationName={displayLocationName} />
          )}
        </Animated.View>
      )}

      <CategoriesModal
        visible={categoriesModalVisible}
        onClose={() => setCategoriesModalVisible(false)}
        onSelectCategory={(id) => {
          dispatch(setSelectedCategory(id));
          setCategoriesModalVisible(false);
        }}
        selectedCategory={selectedCategory}
      />

      {commentsVisible && (
        <View style={styles.commentContainer}>
          <CommentsBottomSheet
            visible={commentsVisible}
            onClose={() => setCommentsVisible(false)}
            newsId={selectedNews?.id}
            newsTitle={selectedNews?.title}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  bottomTabOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  commentContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  overlayLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 150 },
  viralBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    backgroundColor: 'rgba(11,11,13,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  viralBackBarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default HomeScreen;