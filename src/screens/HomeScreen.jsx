import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Text,
  Platform,
  ToastAndroid, 
  Alert,
  BackHandler,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {fetchNews, getCategories, setSelectedCategory, clearNews} from '../redux/reducers/news';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import CategoriesModal from '../components/CategoriesModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import OfflineFallback from '../components/OfflineFallback';
import FlipNewsScreen from './FlipNewsScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { articles, selectedCategory, error, loading, hasMore, currentPage, isLoadingMore } = useSelector(state => state.news);
  const {currentLocation} = useSelector(state => state.location);

  const [uiVisible, setUiVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('HomeTab');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('న్యూస్');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;
  const flipScreenRef = useRef(null);

  const shouldShowFallback = !loading && (!articles || articles.length === 0) && (error || !hasMore);

  // --- 1. Category Change & Initial Fetch ---
  useEffect(() => {
    dispatch(clearNews());
    dispatch(fetchNews({ currentLocation, category: selectedCategory, page: 1 }));
    dispatch(getCategories());
  }, [dispatch, currentLocation, selectedCategory]);

  // --- 2. Hardware Back Button Logic ---
useEffect(() => {
  const handleBackButtonClick = () => {
    // If a category other than 'all' is selected, reset it to 'all'
    if (selectedCategory !== 'all') {
      dispatch(setSelectedCategory('all'));
      if (flipScreenRef.current) {
        flipScreenRef.current.scrollToTop();
      }
      return true; // Prevent default back behavior
    }
    return false; // Allow default behavior (exit app)
  };

  // addEventListener now returns a subscription object
  const subscription = BackHandler.addEventListener(
    'hardwareBackPress',
    handleBackButtonClick,
  );

  // Clean up using the .remove() method on the subscription
  return () => {
    subscription.remove();
  };
}, [selectedCategory, dispatch]);

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

  const toggleUI = () => setUiVisible(prev => !prev);
  const hideUI = () => uiVisible && setUiVisible(false);

  const handleCategorySelect = categoryId => {
    dispatch(setSelectedCategory(categoryId));
    setCategoriesModalVisible(false);
  };

  const handleRefresh = () => {
    dispatch(clearNews());
    dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1}));
  };

  const handleLoadMore = () => {
    if (!loading && !isLoadingMore && hasMore) {
      dispatch(fetchNews({currentLocation, category: selectedCategory, page: currentPage + 1 }));
    }
  };

  const handleTabPress = tabId => {
    switch (tabId) {
      case 'HomeTab':
        setActiveTab('HomeTab');
        setHeaderTitle('న్యూస్');
        break;
      case 'CategoriesTab':
        setCategoriesModalVisible(true);
        break;
      case 'LocationTab':
        setActiveTab('LocationTab');
        setHeaderTitle('రాజమండ్రి');
        break;
      case 'TrendingTab':
        setActiveTab('TrendingTab');
        setHeaderTitle('ట్రెండ్ల్');
        break;
      case 'ReloadTab':
        handleRefresh();
        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
        break;
    }
  };

  const handleCommentsPress = newsItem => {
    setSelectedNews(newsItem);
    setCommentsVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {!shouldShowFallback && (
        <Animated.View style={[styles.headerOverlay, {transform: [{translateY: headerAnim}]}]}>
          <Header title={headerTitle} onProfilePress={() => navigation.navigate("Profile")}/>
        </Animated.View>
      )}

      {shouldShowFallback ? (
        <OfflineFallback onRetry={handleRefresh} />
      ) : (
        <FlipNewsScreen
          ref={flipScreenRef}
          toggleUI={toggleUI}
          hideUI={hideUI}
          onCommentsPress={handleCommentsPress}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
        />
      )}

      {!shouldShowFallback && (
        <Animated.View style={[styles.bottomTabOverlay, {transform: [{translateY: bottomTabAnim}]}]}>
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
        </Animated.View>
      )}

      <CategoriesModal
        visible={categoriesModalVisible}
        onClose={() => setCategoriesModalVisible(false)}
        onSelectCategory={handleCategorySelect}
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
  container: { flex: 1, backgroundColor: '#000000' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  bottomTabOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  commentContainer: { flex:1, position:"absolute", top:0, left:0, bottom:0, right:0, zIndex: 200 }
});

export default HomeScreen;