import React, {useState, useRef} from 'react';
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
import {useSelector} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import RNShare from 'react-native-share';
import ViewShot, {captureRef} from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';

const {width} = Dimensions.get('window');

const NewsDetailScreen = ({route, navigation}) => {
  const {news: passedNews, newsId} = route.params || {};
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const loading = useSelector(state => state.news.loading);

  const reduxNews = useSelector(state => {
    if (!newsId) return null;
    const articles = state.news.articles;
    const items = Array.isArray(articles) ? articles : articles.items || [];
    return items.find(item => (item.data ? item.data._id : item._id) === newsId);
  });

  const rawNews = passedNews || reduxNews;
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

  if (loading && !news) {
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
              <Text style={[styles.reporter, {color: theme.primary}]}>
                By {news.reporter?.name || 'Admin'}
              </Text>
              <Text style={[styles.date, {color: theme.textSecondary}]}>
                {new Date(news.published_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.title, {color: theme.text}]}>{news.content?.title || news.title || ''}</Text>
            <View style={[styles.divider, {backgroundColor: theme.textSecondary + '20'}]} />
            <Text style={[styles.bodyText, {color: theme.text}]}>{news.content?.body || news.body || ''}</Text>
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
  scrollContent: {paddingBottom: 100},
  imageContainer: {width: width, height: 300},
  mainImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  backButton: {
    position: 'absolute', top: 50, left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20,
  },
  contentBody: {padding: 20, marginTop: -20, borderTopLeftRadius: 25, borderTopRightRadius: 25},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15},
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
