import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { addBookmark, removeBookmark } from '../redux/reducers/bookmarks';
import NewsInteractions from '../components/NewsInteractions'; // Import new component

const NewsDetailScreen = ({ route, navigation }) => {
  const { news } = route.params;
  const dispatch = useDispatch();
  const bookmarks = useSelector(state => state.bookmarks.items);
  const isBookmarked = bookmarks.some(item => item.id === news.id);

  const handleBookmark = () => {
    if (isBookmarked) {
      dispatch(removeBookmark(news.id));
    } else {
      dispatch(addBookmark(news));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>News Detail</Text>
        <TouchableOpacity onPress={handleBookmark}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#FF6B35' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: news.image }} style={styles.mainImage} />

        <View style={styles.content}>
          {/* Category & Date */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {news.category ? news.category.toUpperCase() : 'NEWS'}
              </Text>
            </View>
            <Text style={styles.dateText}>{news.date}</Text>
          </View>

          <Text style={styles.title}>{news.title}</Text>

          {/* Stats Row (Only Views & Location now, others handled by Interactions) */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="eye-outline" size={18} color="#888" />
              <Text style={styles.statText}>{news.views || 0} Views</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="map-marker" size={18} color="#4ECDC4" />
              <Text style={styles.statText}>{news.location || 'Global'}</Text>
            </View>
          </View>

          <Text style={styles.body}>{news.body}</Text>

          {news.fullContent && (
            <Text style={styles.fullContent}>{news.fullContent}</Text>
          )}
        </View>

        {/* --- NEW INTERACTION COMPONENT --- */}
        <NewsInteractions 
          newsId={news.id} 
          likeCount={news.likes} 
          commentCount={news.comments} 
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mainImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  content: {
    backgroundColor: '#fff',
    padding: 18,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202631',
    marginBottom: 14,
    lineHeight: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#565B67',
    fontWeight: '500',
  },
  body: {
    fontSize: 17,
    color: '#202631',
    lineHeight: 27,
    marginBottom: 16,
  },
  fullContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
  },
});

export default NewsDetailScreen;