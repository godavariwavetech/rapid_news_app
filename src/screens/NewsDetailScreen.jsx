import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {lightTheme, darkTheme} from '../config/theme';
import {fetchArticleById} from '../redux/reducers/news';
import FlipNewsScreen from './FlipNewsScreen';
import CommentsBottomSheet from '../components/CommentsBottomSheet';

const NewsDetailScreen = ({route, navigation}) => {
  const {news: passedNews, newsId, articleId} = route.params || {};
  const deepLinkNewsId = articleId || newsId;

  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

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

  useEffect(() => {
    let active = true;
    if (passedNews || reduxNews || !deepLinkNewsId) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    dispatch(fetchArticleById(deepLinkNewsId))
      .unwrap()
      .then(article => {
        if (active) {
          setFetchedNews({id: deepLinkNewsId, article});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setIsFetching(false);
        }
      });
    return () => { active = false; };
  }, [deepLinkNewsId, passedNews, reduxNews, dispatch]);

  const rawNews = passedNews || reduxNews || (fetchedNews?.id === deepLinkNewsId ? fetchedNews.article : null);
  const news = rawNews?.data || rawNews;

  // Reuse the feed's formatting and media players. Raw API articles store
  // images, uploaded videos, and YouTube links alongside content.
  const articleItems = useMemo(() => rawNews ? [rawNews] : [], [rawNews]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Main');
    }
  };

  useEffect(() => {
    setCommentsVisible(false);
    setSelectedNews(null);
  }, [deepLinkNewsId]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} accessibilityLabel="Go back" style={styles.backButton}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>Rapid News</Text>
      </View>
      {news ? (
        <FlipNewsScreen
          key={news._id || news.id || deepLinkNewsId}
          overrideItems={articleItems}
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
  header: {height: 48, flexDirection: 'row', alignItems: 'center'},
  backButton: {padding: 10},
  headerTitle: {fontSize: 18},
  messageContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export default NewsDetailScreen;
