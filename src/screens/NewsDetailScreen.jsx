import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../utils/colors';
import { handleShare } from '../utils/FileHelpers';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ route, navigation }) => {
  const { news: passedNews, newsId } = route.params || {};
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const reduxNews = useSelector(state => {
    if (!newsId) return null;
    const articles = state.news.articles;
    const items = Array.isArray(articles) ? articles : (articles.items || []);
    return items.find(item => (item.data ? item.data._id : item._id) === newsId);
  });

  const rawNews = passedNews || reduxNews;
  const news = rawNews?.data || rawNews;
  const loading = useSelector(state => state.news.loading);

  if (loading && !news) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  if (!news) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
          <Text style={{ color: theme.text }}>News not found. Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onShare = () => {
    const articleId = newsId || news?._id;
    const newsTitle = news?.content?.title || news?.title || '';
    const imageUrl = news?.images?.[0] || news?.image;
    handleShare(newsTitle, articleId, imageUrl);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: news.images?.[0] }} 
            style={styles.mainImage} 
          />
          {/* Custom Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.contentBody, { backgroundColor: theme.background }]}>
          {/* Category & Date */}
          <View style={styles.metaRow}>
            <Text style={[styles.reporter, { color: theme.primary }]}>
              By {news.reporter?.name || 'Admin'}
            </Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {new Date(news.published_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {news.content.title}
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.textSecondary + '20' }]} />

          {/* Full Body Text */}
          <Text style={[styles.bodyText, { color: theme.text }]}>
            {news.content.body}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Share Button */}
      <TouchableOpacity style={[styles.shareFab, { backgroundColor: theme.primary }]} onPress={onShare}>
        <Icon name="share-variant" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { width: width, height: 300 },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  contentBody: { padding: 20, marginTop: -20, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  reporter: { fontWeight: 'bold', fontSize: 14 },
  date: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 15 },
  divider: { height: 1, width: '100%', marginBottom: 20 },
  bodyText: { fontSize: 16, lineHeight: 26 },
  shareFab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default NewsDetailScreen;