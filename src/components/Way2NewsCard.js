import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {addBookmark, removeBookmark} from '../redux/reducers/bookmarks';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;
const ACTUAL_HEIGHT = SCREEN_HEIGHT + STATUS_BAR_HEIGHT;
const IMAGE_HEIGHT = ACTUAL_HEIGHT * 0.45;

function Way2NewsCard({news, onPress}) {
  const dispatch = useDispatch();
  const bookmarks = useSelector(state => state.bookmarks.items);
  const isBookmarked = bookmarks.some(item => item.id === news.id);

  const handleBookmark = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (isBookmarked) {
      dispatch(removeBookmark(news.id));
    } else {
      dispatch(addBookmark(news));
    }
  };

  const handleShare = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Image source={{uri: news.image}} style={styles.image} />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
            locations={[0, 0.6, 1]}
          />

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{news.category.toUpperCase()}</Text>
          </View>

          {/* Time Badge */}
          <View style={styles.timeBadge}>
            <Icon name="clock-outline" size={13} color="#FFFFFF" />
            <Text style={styles.timeText}>{news.timeAgo}</Text>
          </View>

          {/* Location on Image */}
          <View style={styles.imageLocationRow}>
            <Icon name="map-marker" size={16} color="#FFFFFF" />
            <Text style={styles.imageLocationText}>{news.location}</Text>
            <Text style={styles.imagePageText}>• {news.page}/{news.totalPages}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title */}
          <Text style={styles.title}>{news.title}</Text>

          {/* Body - Scrollable */}
          <ScrollView
            style={styles.bodyContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}>
            <Text style={styles.body}>{news.body || news.description}</Text>
            {news.fullContent && (
              <Text style={styles.body}>{'\n\n' + news.fullContent}</Text>
            )}
          </ScrollView>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statsLeft}>
              <View style={styles.stat}>
                <Icon name="eye-outline" size={20} color="#888" />
                <Text style={styles.statText}>{news.views}</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="thumb-up-outline" size={20} color="#888" />
                <Text style={styles.statText}>{news.likes}</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="comment-outline" size={20} color="#888" />
                <Text style={styles.statText}>{news.comments}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleBookmark} style={styles.actionBtn}>
                <Icon
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isBookmarked ? '#FF6B35' : '#888'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                <Icon name="share-variant" size={24} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    height: ACTUAL_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  imageSection: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timeBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  imageLocationRow: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePageText: {
    color: '#FFFFFFAA',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentSection: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 32,
    marginBottom: 14,
  },
  bodyContainer: {
    flex: 1,
  },
  body: {
    fontSize: 17,
    color: '#333',
    lineHeight: 27,
    paddingBottom: 10,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    marginTop: 10,
  },
  statsLeft: {
    flexDirection: 'row',
    gap: 18,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#565B67',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  actionBtn: {
    padding: 4,
  },
});

export default Way2NewsCard;
