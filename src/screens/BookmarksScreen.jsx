import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Platform,
  ToastAndroid,
  Dimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable'; // Recommended for the 'Magic' feel
import { getBookmarks, toggleBookmarkApi, toggleAdBookmarkApi } from '../redux/reducers/bookmarks';
import { lightTheme, darkTheme } from '../utils/colors';

const { width, height } = Dimensions.get('window');

const BookmarksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const { bookmarks, loading } = useSelector(state => state.bookmarks);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const fetchBookmarks = useCallback(async () => {
    await dispatch(getBookmarks());
  }, [dispatch]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (newsId) => {
    const response = await dispatch(toggleBookmarkApi({ newsId, isCurrentlyBookmarked: true }));
    if (response) {
      fetchBookmarks();
      if (Platform.OS === 'android') {
        ToastAndroid.show("Removed from collection", ToastAndroid.SHORT);
      }
    }
  };

  const handleRemoveAd = async (adId) => {
    const response = await dispatch(toggleAdBookmarkApi({ adId, isCurrentlyBookmarked: true }));
    if (response) {
      fetchBookmarks();
      if (Platform.OS === 'android') {
        ToastAndroid.show("Removed from collection", ToastAndroid.SHORT);
      }
    }
  };

  const renderItem = ({ item, index }) => {
    const news = item.news;
    const ad = item.ad;
    if (!news && !ad) return null;

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        useNativeDriver
      >
        <TouchableOpacity
          style={styles.premiumCard}
          onPress={() => ad
            ? Linking.openURL(ad.redirect_url).catch(() => {})
            : navigation.navigate('NewsDetail', { news })}
          activeOpacity={0.95}
        >
          <Image source={{ uri: ad ? ad.image : news.images?.[0] }} style={styles.cardImage} />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.95)']}
            style={styles.cardGradient}
          />

          <View style={styles.cardContent}>
            <View style={styles.topRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{ad ? 'SPONSORED' : (news.reporter?.name || 'EDITORIAL')}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeCircle}
                onPress={() => ad ? handleRemoveAd(ad._id) : handleRemove(news._id)}
              >
                <Icon name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomInfo}>
              <Text style={styles.premiumTitle} numberOfLines={3}>
                {ad ? ad.title : news.content?.title}
              </Text>
              <View style={styles.metaRow}>
                {ad ? (
                  <Text style={styles.metaText}>Saved Ad</Text>
                ) : (
                  <>
                    <Icon name="calendar-month-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.metaText}>
                      {new Date(news.published_at).toLocaleDateString('te-IN', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.dot} />
                    <Text style={styles.metaText}>Saved Item</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0f0f0f' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* MINIMALIST BLUR HEADER */}
      <View style={styles.minimalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="chevron-left" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Collection</Text>
        <TouchableOpacity 
            onPress={() => navigation.reset({index: 0, routes: [{name: 'Main'}]})}
            style={styles.homeIcon}
        >
          <Icon name="home-variant" size={26} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={item => item.news?._id || item.ad?._id}
        contentContainerStyle={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchBookmarks} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="bookmark-minus-outline" size={80} color="#333" />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyDesc}>Articles you save will appear in this elegant list.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  minimalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 15,
    backgroundColor: '#0f0f0f',
  },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1, textTransform: 'uppercase' },
  scrollArea: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  
  // PREMIUM CARD UI
  premiumCard: {
    width: '100%',
    height: height * 0.4, // Large editorial height
    borderRadius: 24,
    marginBottom: 25,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: 20 },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  removeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  
  bottomInfo: { marginBottom: 5 },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 32,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 10 },
  
  emptyState: { flex: 1, alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginTop: 20 },
  emptyDesc: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 }
});

export default BookmarksScreen;