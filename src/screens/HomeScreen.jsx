import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
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
import { getBookmarks } from '../redux/reducers/bookmarks';
import { fetchFCMToken } from '../services/NotificationsService';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  
  const { articles, categories, selectedCategory, loading, hasMore, currentPage, isLoadingMore, error } = useSelector(state => state.news);
  const {currentLocation} = useSelector(state => state.location);


  const [uiVisible, setUiVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('HomeTab');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('న్యూస్');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;
  const flipScreenRef = useRef(null);

  const shouldShowFallback = !loading && (!articles || articles.length === 0) && (error || !hasMore);

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

    dispatch(clearNews());
    dispatch(fetchNews({ currentLocation, category: selectedCategory, page: 1 }));
    dispatch(getBookmarks())
  }, [selectedCategory, currentLocation, dispatch]);



  useEffect(() => {
    if (!loading && articles && articles?.items?.length === 0 && selectedCategory !== 'all' && !error) {
      const msg = "ఈ వర్గంలో వార్తలు లేవు. అన్ని వార్తలను చూపిస్తున్నాము.";
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.LONG);
      } else {
        Alert.alert("సమాచారం", msg);
      }
      dispatch(setSelectedCategory('all'));
    }
  }, [articles, loading, selectedCategory, error]);


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
    getToken()
  }, [uiVisible]);

  const toggleUI = () => setUiVisible(!uiVisible);
  const hideUI = () => setUiVisible(false);

  const handleTabPress = useCallback((tabId) => {
    if (tabId === 'CategoriesTab') {
      setCategoriesModalVisible(true);
    }else if (tabId === 'LocationTab') {
    setActiveTab(tabId);
    dispatch(clearNews());
    dispatch(fetchNews({
      currentLocation, 
      category: selectedCategory, 
      page: 1, 
      isLocationMode: true 
    }));
  } else {
      setActiveTab(tabId);
      if (tabId === 'ReloadTab') {
        dispatch(clearNews());
        dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1}));
        if (flipScreenRef.current) flipScreenRef.current.scrollToTop();
      }
    }
  }, [selectedCategory, currentLocation]);



  const getToken =async () =>{
    const token = await fetchFCMToken()
    console.log(token,"<>>>>>>>>>>>TOKEN");
  }


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {!shouldShowFallback && (
        <Animated.View style={[styles.headerOverlay, {transform: [{translateY: headerAnim}]}]}>
          <Header title={headerTitle} onProfilePress={() => navigation.navigate("Profile")}/>
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
          onRefresh={() => dispatch(fetchNews({currentLocation, category: selectedCategory, page: 1}))}
          onEndReached={() => !loading && hasMore && dispatch(fetchNews({currentLocation, category: selectedCategory, page: currentPage + 1}))}
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