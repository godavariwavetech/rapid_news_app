import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import RNShare from 'react-native-share';
import ViewShot, {captureRef} from 'react-native-view-shot';
import RNFetchBlob from 'react-native-blob-util';
import {fetchArticleById} from '../redux/reducers/news';
import ArticleLinks from '../components/ArticleLinks';
import LinkedArticleText from '../components/LinkedArticleText';
import Way2NewsCard from '../components/Way2NewsCard';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const NewsDetailScreen = ({route, navigation}) => {

  const {news: passedNews, newsId, articleId, fromArticleLink = false} = route.params || {};
  const deepLinkNewsId = articleId || newsId;

  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [linkedCardHeight, setLinkedCardHeight] = useState(null);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const reduxNews = useSelector(state => {
    if (!deepLinkNewsId) return null;
    const articles = state.news.articles;
    const items = Array.isArray(articles) ? articles : articles.items || [];
    return items.find(item => (item.data ? item.data._id : item._id) === deepLinkNewsId);
  });

  // Not passed via navigation param and not already in the loaded feed —
  // this is a deep link opened cold, so the article has to be fetched directly.
  const [fetchedNews, setFetchedNews] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const cachedNews = fromArticleLink ? null : reduxNews;

  useEffect(() => {
    if (passedNews || cachedNews || !deepLinkNewsId) return;
    setIsFetching(true);
    dispatch(fetchArticleById(fromArticleLink ? {id: deepLinkNewsId, addToFeed: false} : deepLinkNewsId))
      .unwrap()
      .then(article => setFetchedNews(article))
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [deepLinkNewsId, passedNews, cachedNews, fromArticleLink, dispatch]);

  const rawNews = fromArticleLink ? fetchedNews : passedNews || reduxNews || fetchedNews;
  const news = rawNews?.data || rawNews;

  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef(null);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    const destPath = `${RNFetchBlob.fs.dirs.CacheDir}/share_${Date.now()}.jpg`;
    try {
      const appUrl = 'https://play.google.com/store/apps/details?id=com.rapidnews&pcampaignid=web_share';
      const newsTitle = news?.content?.title ?? news?.title ?? '';
      const message = `${newsTitle}\n\n${appUrl}`;

      console.log('[Share] viewShotRef exists:', !!viewShotRef?.current);

      await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
        path: destPath,
      });

      const fileExists = await RNFetchBlob.fs.exists(destPath);
      const fileStat = fileExists ? await RNFetchBlob.fs.stat(destPath) : null;
      console.log('[Share] file exists:', fileExists, 'size:', fileStat?.size);

      if (!fileExists || fileStat?.size === 0) throw new Error('Captured file empty or missing');

      await RNShare.open({
        title: newsTitle,
        message,
        url: `file://${destPath}`,
        type: 'image/jpeg',
        failOnCancel: false,
      });
    } catch (err) {
      console.log('[Share] error:', err?.message, err?.stack);
      Alert.alert('Share Debug', `Error: ${err?.message}`);
    } finally {
      RNFetchBlob.fs.unlink(destPath).catch(() => {});
      setSharing(false);
    }
  };

  if (isFetching && !news) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: theme.text}}>Loading...</Text>
      </View>
    );
  }

  if (!news) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center'}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 20}}>
          <Text style={{color: theme.text}}>News not found. Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fromArticleLink) {
    const article = {
      ...news,
      id: news._id,
      title: news.content?.title || news.title || '',
      body: news.content?.body || news.body || '',
      image: news.images?.[0] || null,
      publishedAt: news.published_at,
      timeAgo: news.published_at ? new Date(news.published_at).toLocaleDateString() : '',
      likes: news.reactions?.likes || 0,
      dislikes: news.reactions?.dislikes || 0,
      isLiked: news.reactions?.my_reaction === 'LIKE',
      isDisliked: news.reactions?.my_reaction === 'DISLIKE',
      commentsEnabled: news.comments?.enabled !== false,
      comments: news.comments?.count ?? 0,
      isPinned: news.is_feed_pinned === true,
    };
    return <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{flex: 1}} onLayout={event => setLinkedCardHeight(event.nativeEvent.layout.height)}>
        <Way2NewsCard news={article} cardHeight={linkedCardHeight} isActive={isFocused} onCommentsPress={() => setCommentsVisible(true)} />
      </View>
      <TouchableOpacity accessibilityLabel="Go back" activeOpacity={0.8} style={[styles.linkedBackBar, {paddingBottom: 14 + insets.bottom}]} onPress={() => navigation.goBack()}>
        <Icon name="chevron-left" size={22} color="#FFF" />
        <Text style={styles.linkedBackBarText}>Back</Text>
      </TouchableOpacity>
      {commentsVisible && <View style={{...StyleSheet.absoluteFillObject, zIndex: 200}}>
        <CommentsBottomSheet visible={commentsVisible} onClose={() => setCommentsVisible(false)} newsId={article.id} newsTitle={article.title} />
      </View>}
    </View>;
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ViewShot wraps only the content — FAB stays outside so it won't appear in capture */}
        <ViewShot ref={viewShotRef} options={{format: 'jpg', quality: 0.9}}>
          <View style={styles.imageContainer}>
            <Image source={{uri: news.images?.[0]}} style={styles.mainImage} />
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.contentBody, {backgroundColor: theme.background}]}>
            <View style={styles.metaRow}>
              {/* Editor/admin stories come back with reporter: null and are
                  published as the paper itself — no byline at all, not "By Admin". */}
              {news.reporter?.name ? (
                <View style={styles.reporterRow}>
                  {news.reporter.photo ? (
                    <Image source={{uri: news.reporter.photo}} style={styles.reporterAvatar} />
                  ) : null}
                  <Text style={[styles.reporter, {color: theme.primary}]}>
                    By {news.reporter.name}
                    {news.reporter.village ? `, ${news.reporter.village}` : ''}
                  </Text>
                </View>
              ) : <View />}
              <Text style={[styles.date, {color: theme.textSecondary}]}>
                {new Date(news.published_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.title, {color: theme.text}]}>{news.content?.title || news.title || ''}</Text>
            <View style={[styles.divider, {backgroundColor: theme.textSecondary + '20'}]} />
            <LinkedArticleText style={[styles.bodyText, {color: theme.text}]} text={news.content?.body || news.body || ''} links={news.article_links} />
            <ArticleLinks links={news.article_links} />
          </View>
        </ViewShot>
      </ScrollView>

      {/* FAB outside ViewShot — won't appear in the captured image */}
      <TouchableOpacity
        style={[styles.shareFab, {backgroundColor: theme.primary, opacity: sharing ? 0.8 : 1}]}
        onPress={onShare}
        disabled={sharing}>
        {sharing
          ? <ActivityIndicator size="small" color="#FFF" />
          : <Icon name="share-variant" size={24} color="#FFF" />
        }
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  linkedBackBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 14, backgroundColor: 'rgba(11,11,13,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)',
  },
  linkedBackBarText: {color: '#fff', fontSize: 15, fontWeight: '700'},
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
