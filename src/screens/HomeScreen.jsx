import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  ToastAndroid,
  Alert,
  BackHandler,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {fetchNews, getCategories, setSelectedCategory} from '../redux/reducers/news';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import CategoriesModal from '../components/CategoriesModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import OfflineFallback from '../components/OfflineFallback';
import FlipNewsScreen from './FlipNewsScreen';
import { getBookmarks } from '../redux/reducers/bookmarks';
import { postToken, registerGuestFCM } from '../redux/reducers/auth';
import notifee from '@notifee/react-native';

function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  
  const { articles, categories, selectedCategory, loading, hasMore, currentPage, currentDayOffset, totalNews, isLoadingMore, error } = useSelector(state => state.news);
  
  // --- ADDED loading: locationLoading HERE ---
  const {currentLocation, loading: locationLoading} = useSelector(state => state.location);

  const [uiVisible, setUiVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('HomeTab');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('న్యూస్');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;
  const flipScreenRef = useRef(null);

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

  useEffect(() => {
    dispatch(getCategories())
    if (selectedCategory === 'all') {
      setHeaderTitle('న్యూస్');
    } else {
      const activeCat = categories.find(c => c._id === selectedCategory);
      if (activeCat) {
        setHeaderTitle(activeCat.name?.te || activeCat.name?.en || 'న్యూస్');
      }
    }

    if (currentLocation) {
      // Don't clearNews before fetching — it creates a race condition that
      // briefly shows articles=[] and triggers the "no news" toast.
      // fetchNews page 1 already replaces articles in the reducer.
      dispatch(fetchNews({ currentLocation, category: selectedCategory, page: 1, isLocationMode: activeTab === 'LocationTab' }));
    } else {
      // No location yet — fetch with default/fallback location so feed isn't empty
      dispatch(fetchNews({ category: selectedCategory, page: 1, isLocationMode: false }));
    }

    dispatch(getBookmarks())
    sendToken()
    notifee.requestPermission();
  }, [selectedCategory, currentLocation, dispatch]);

  const sendToken = async () =>{
    const res = await dispatch(postToken())
    console.log(res,">>>>>>>>>>>>FCM RES");
    dispatch(registerGuestFCM());
  }

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
      if (selectedCategory !== 'all') {
        dispatch(setSelectedCategory('all'));
        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
        return true; 
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [selectedCategory]);

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
    } else if (tabId === 'LocationTab') {
      setActiveTab(tabId);
      setHeaderTitle(displayLocationName);
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
      dispatch(fetchNews({ currentLocation, category: 'all', page: 1, isLocationMode: false }));
      if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
    } else {
      setActiveTab(tabId);
      if (tabId === 'ReloadTab') {
        dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1, isLocationMode: activeTab === 'LocationTab'}));
        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
      }
    }
  }, [selectedCategory, currentLocation, displayLocationName, dispatch]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />

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
          onRefresh={() => dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1, current_day_offset: 0, isLocationMode: activeTab === 'LocationTab'}))}
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
        />
      )}

      {!shouldShowFallback && (
        <Animated.View style={[styles.bottomTabOverlay, {transform: [{translateY: bottomTabAnim}]}]}>
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} locationName={displayLocationName} />
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
  commentContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 }
});

export default HomeScreen;