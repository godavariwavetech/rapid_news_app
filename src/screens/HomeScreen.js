import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Text,
  FlatList,
  Platform,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {setMockNews, setSelectedCategory} from '../redux/reducers/news';
import Way2NewsCard from '../components/Way2NewsCard';
import Header from '../components/Header';
import BottomTabBar from '../components/BottomTabBar';
import CategoriesModal from '../components/CategoriesModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import {MOCK_NEWS} from '../utils/constants';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;
const ACTUAL_HEIGHT = SCREEN_HEIGHT + STATUS_BAR_HEIGHT;

function HomeScreen({navigation}) {
  const dispatch = useDispatch();
  const articles = useSelector(state => state.news.articles);
  const selectedCategory = useSelector(state => state.news.selectedCategory);
  const [uiVisible, setUiVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('HomeTab');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('న్యూస్');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    dispatch(setMockNews(MOCK_NEWS));
  }, [dispatch]);

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

  const handleCategorySelect = category => {
    dispatch(setSelectedCategory(category));
    setCurrentIndex(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({index: 0, animated: false});
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
        setActiveTab('ReloadTab');
        setHeaderTitle('రిలోడ్');
        dispatch(setMockNews(MOCK_NEWS));
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({index: 0, animated: true});
        }
        break;
    }
  };

  const handleScrollBeginDrag = () => {
    if (uiVisible) {
      setUiVisible(false);
    }
  };

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Handle opening comments
  const handleCommentsPress = newsItem => {
    setSelectedNews(newsItem);
    setCommentsVisible(true);
  };

  const renderItem = ({item, index}) => (
    <Way2NewsCard
      news={item}
      onPress={toggleUI}
      isActive={index === currentIndex}
      onCommentsPress={() => handleCommentsPress(item)}
    />
  );

  const getItemLayout = (data, index) => ({
    length: ACTUAL_HEIGHT,
    offset: ACTUAL_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Top Header - Animated Overlay */}
      <Animated.View
        style={[
          styles.headerOverlay,
          {transform: [{translateY: headerAnim}]},
        ]}
        pointerEvents={uiVisible ? 'auto' : 'none'}>
        <Header
          onProfilePress={() => navigation.navigate('Profile')}
          onTogglePress={toggleUI}
          title={headerTitle}
        />
      </Animated.View>

      {/* Full Screen News Cards - FlatList */}
      <FlatList
        ref={flatListRef}
        data={filteredNews}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ACTUAL_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews={true}
      />

      {/* News Counter */}
      {uiVisible && (
        <Animated.View
          style={[
            styles.counterContainer,
            {transform: [{translateY: headerAnim}]},
          ]}
          pointerEvents="none">
          <Text style={styles.counterText}>
            {currentIndex + 1} / {filteredNews.length}
          </Text>
        </Animated.View>
      )}

      {/* Bottom Tab Bar - Animated Overlay */}
      <Animated.View
        style={[
          styles.bottomTabOverlay,
          {transform: [{translateY: bottomTabAnim}]},
        ]}
        pointerEvents={uiVisible ? 'auto' : 'none'}>
        <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      </Animated.View>

      {/* Categories Modal */}
      <CategoriesModal
        visible={categoriesModalVisible}
        onClose={() => setCategoriesModalVisible(false)}
        onSelectCategory={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      {/* Comments Bottom Sheet */}
      <CommentsBottomSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        newsId={selectedNews?.id}
        newsTitle={selectedNews?.title}
      />
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
  counterContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 50,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
