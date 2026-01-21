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
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {fetchNews, setMockNews, setSelectedCategory} from '../redux/reducers/news';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import CategoriesModal from '../components/CategoriesModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import OfflineFallback from '../components/OfflineFallback';
import {MOCK_NEWS} from '../utils/constants';
import FlipNewsScreen from './FlipNewsScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // Get pagination state from Redux
  const { articles, selectedCategory, error, loading, hasMore, currentPage, isLoadingMore } = useSelector(state => state.news);
  const {currentLocation} = useSelector(state => state.location)

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

  const shouldShowFallback = !loading && (!articles || articles.length === 0);

  let fallbackConfig = {
    title: "No News Available",
    message: "There are no stories to display right now. Please check back later.",
    icon: "newspaper-variant-outline",
    buttonText: "Refresh Feed"
  };

  if (error === 'No internet connection. Showing cached news.') {
    fallbackConfig = {
      title: "No Internet Connection",
      message: "You seem to be offline. Check your Wi-Fi or mobile data and try again.",
      icon: "wifi-off",
      buttonText: "Retry Connection"
    };
  } else if (error) {
    fallbackConfig = {
      title: "Server Unavailable",
      message: "We're having trouble connecting to Way2News servers. Please try again in a moment.",
      icon: "server-network-off", 
      buttonText: "Try Again"
    };
  }

  useEffect(() => {
    dispatch(fetchNews())
  }, [dispatch]);

  useEffect(() => {
    if (error === 'No internet connection. Showing cached news.' && articles.length > 0) {
      const friendlyMessage = "You seem to be offline. Showing previously fetched news.";
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(friendlyMessage, ToastAndroid.LONG, ToastAndroid.BOTTOM);
      } else {
        Alert.alert('Offline', friendlyMessage);
      }
    }
  }, [error, articles.length]);

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

  const filteredNews =
    selectedCategory === 'all'
      ? articles
      : articles.filter(item => item.category === selectedCategory);

  const toggleUI = () => {
    setUiVisible(prev => !prev);
  };

  const hideUI = () => {
    if (uiVisible) {
      setUiVisible(false);
    }
  };

  const handleCategorySelect = category => {
    dispatch(setSelectedCategory(category));
    setCurrentIndex(0);
    setCategoriesModalVisible(false);
  };

  const handleRefresh = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show("Refreshing news...", ToastAndroid.SHORT);
    }
    dispatch(fetchNews(selectedCategory));
  };

  // --- NEW: Handle Load More (Pagination) ---
  const handleLoadMore = () => {
    if (!loading && !isLoadingMore && hasMore) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Loading more news...", ToastAndroid.SHORT);
      }
      // Pass the NEXT page index
      dispatch(fetchNews({ category: selectedCategory, page: currentPage + 1 }));
    } else if (!hasMore) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("No more news to load", ToastAndroid.SHORT);
      }
    }
  };

  const handleIndexChange = (index) => {
    setCurrentIndex(index);
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
        setActiveTab('ReloadTab');
        setHeaderTitle('రిలోడ్');
        if (flipScreenRef.current) {
          flipScreenRef.current.scrollToTop();
        }
        break;
    }
  };

  const handleCommentsPress = newsItem => {
    setSelectedNews(newsItem);
    setCommentsVisible(true);
  };

  const onProfilePress = () => {
    navigation.navigate("Profile");
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {!shouldShowFallback && (
        <Animated.View
          style={[styles.headerOverlay, {transform: [{translateY: headerAnim}]}]}>
          <Header title={headerTitle} onProfilePress={onProfilePress}/>
        </Animated.View>
      )}

      {shouldShowFallback ? (
        <OfflineFallback 
          onRetry={handleRefresh} 
          title={fallbackConfig.title}
          message={fallbackConfig.message}
          icon={fallbackConfig.icon}
          buttonText={fallbackConfig.buttonText} 
        />
      ) : (
        <FlipNewsScreen
          ref={flipScreenRef}
          toggleUI={toggleUI}
          hideUI={hideUI}
          onCommentsPress={handleCommentsPress}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore} // Pass the handler
          onIndexChange={handleIndexChange} // Capture index updates
        />
      )}

      {/* Counter Removed as per previous request, but logic kept in case you want it back */}

      {!shouldShowFallback && (
        <Animated.View
          style={[styles.bottomTabOverlay, {transform: [{translateY: bottomTabAnim}]}]}>
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
        <View style={{flex:1, position:"absolute", top:0, left:0, bottom:0, right:0, zIndex: 200}}>
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
  bottomTabOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
});

export default HomeScreen;