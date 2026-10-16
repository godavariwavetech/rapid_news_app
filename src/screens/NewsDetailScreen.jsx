import React, {useState, useEffect, useMemo, useRef, useLayoutEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {lightTheme, darkTheme} from '../config/theme';
import {fetchArticleById, setSelectedCategory} from '../redux/reducers/news';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import FlipNewsScreen from './FlipNewsScreen';
import {linkedArticleCardInterpolator} from '../navigation/linkedArticleTransition';

const {width} = Dimensions.get('window');

const NewsDetailScreen = ({route, navigation}) => {

  const {news: passedNews, newsId, articleId, fromArticleLink = false} = route.params || {};
  const deepLinkNewsId = articleId || newsId;

  const dispatch = useDispatch();
  const exitDirection = useRef(new Animated.Value(-1)).current;
  const cardInterpolator = useMemo(
    () => props => linkedArticleCardInterpolator(props, exitDirection),
    [exitDirection],
  );
  useLayoutEffect(() => {
    if (fromArticleLink) {
      navigation.setOptions({cardStyleInterpolator: cardInterpolator});
    }
  }, [fromArticleLink, navigation, cardInterpolator]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const currentLocation = useSelector(state => state.location.currentLocation);
  const {loading, isLoadingMore, hasMore, currentPage, currentDayOffset} = useSelector(state => state.news);

  const reduxNews = useSelector(state => {
    if (!deepLinkNewsId) {
      return null;
    }
    const articles = state.news.articles;
    const items = Array.isArray(articles) ? articles : articles?.items || [];
    return items.find(item => (item.data ? item.data._id : item._id) === deepLinkNewsId);
  });

  // Not passed via navigation param and not already in the loaded feed —
  // this is a deep link opened cold, so the article has to be fetched directly.
  const [fetchedNews, setFetchedNews] = useState(null);
  const [isFetching, setIsFetching] = useState(!!deepLinkNewsId && !passedNews && !reduxNews);
  // Shared links must fetch/prepend their article even if it is already cached.
  const cachedNews = deepLinkNewsId ? null : reduxNews;

  useEffect(() => {
    let active = true;
    if (passedNews || cachedNews || !deepLinkNewsId) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    dispatch(fetchArticleById(fromArticleLink ? {id: deepLinkNewsId, addToFeed: false} : deepLinkNewsId))
      .unwrap()
      .then(article => {
        if (active) {
          setFetchedNews({id: deepLinkNewsId, article});
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setIsFetching(false); });
    return () => { active = false; };
  }, [deepLinkNewsId, passedNews, cachedNews, fromArticleLink, dispatch]);

  const rawNews = passedNews || reduxNews || (fetchedNews?.id === deepLinkNewsId ? fetchedNews.article : null);
  const news = rawNews?.data || rawNews;

  // Reuse the feed's formatting and media players. Raw API articles store
  // images, uploaded videos, and YouTube links alongside content.
  const articleItems = useMemo(() => rawNews ? [rawNews] : [], [rawNews]);
  // const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Main');
    }
  };
  const swipeDownBack = () => {
    exitDirection.setValue(1);
    goBack();
  };

  useEffect(() => {
    setCommentsVisible(false);
    setSelectedNews(null);
  }, [deepLinkNewsId]);

  // Shared links use Home's normal header, bottom navigation, and pagination.
  // Wait until the requested article has been fetched and pinned in the feed.
  useEffect(() => {
    if (!fromArticleLink && (passedNews || fetchedNews?.id === deepLinkNewsId)) {
      dispatch(setSelectedCategory('all'));
      navigation.replace('Main', {
        screen: 'HomeTab',
        params: {sharedArticleId: deepLinkNewsId || news?._id},
      });
    }
  }, [fromArticleLink, passedNews, fetchedNews, deepLinkNewsId, news?._id, dispatch, navigation]);

  return (
    <SafeAreaView edges={fromArticleLink ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom']} style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar translucent={fromArticleLink} barStyle={fromArticleLink || isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={fromArticleLink ? 'transparent' : theme.background} />
      {!fromArticleLink && <View style={styles.header}>
        <TouchableOpacity onPress={goBack} accessibilityLabel="Go back" style={styles.backButton}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>Rapid News</Text>
      </View>}
      {news ? (
        <FlipNewsScreen
          key={news._id || news.id || deepLinkNewsId}
          overrideItems={fromArticleLink ? articleItems : undefined}
          fitToContainer={fromArticleLink}
          onSwipeUpAtEnd={fromArticleLink ? goBack : undefined}
          onSwipeDownAtStart={fromArticleLink ? swipeDownBack : undefined}
          onCommentsPress={item => {
            setSelectedNews(item);
            setCommentsVisible(true);
          }}
        />
      ) : (
        <View style={styles.messageContainer}>
          {isFetching ? (
            <ActivityIndicator color={theme.primary} accessibilityLabel="Loading news" />
          ) : (
            <Text style={{color: theme.text}}>News not found.</Text>
          )}
        </View>
      )}
      {fromArticleLink && (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" activeOpacity={0.8}
          style={styles.linkedBackBar}
          onPress={goBack}>
          <Icon name="chevron-left" size={22} color="#FFF" />
          <Text style={styles.linkedBackBarText} allowFontScaling={false}>Back</Text>
        </TouchableOpacity>
      )}
      {commentsVisible && (
        <CommentsBottomSheet
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          newsId={selectedNews?.id}
          newsTitle={selectedNews?.title}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  linkedBackBar: {
    flexShrink: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    height: 48, backgroundColor: '#000000',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)',
  },
  linkedBackBarText: {color: '#fff', fontSize: 15, lineHeight: 20, includeFontPadding: false, fontWeight: '700'},
  scrollContent: {paddingBottom: 100},
  imageContainer: {width: width, height: 300},
  mainImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  backButton: {
    position: 'absolute', top: 50, left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20,
  },
  contentBody: {padding: 20, marginTop: -20, borderTopLeftRadius: 25, borderTopRightRadius: 25},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15},
  reporterRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1},
  reporterAvatar: {width: 22, height: 22, borderRadius: 11},
  reporter: {fontWeight: 'bold', fontSize: 14},
  date: {fontSize: 12},
  title: {fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 15},
  divider: {height: 1, width: '100%', marginBottom: 20},
  bodyText: {fontSize: 16, lineHeight: 26},
  shareFab: {
    position: 'absolute', bottom: 30, right: 30,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
});

export default NewsDetailScreen;
