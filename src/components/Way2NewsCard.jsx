import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
// CHANGE: Import Touchables from gesture-handler to fix conflicts with Flip gesture
import {
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {addBookmark, removeBookmark} from '../redux/reducers/bookmarks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {responsiveFontSize, responsiveScreenWidth, responsiveWidth} from 'react-native-responsive-dimensions'

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;
const ACTUAL_HEIGHT = SCREEN_HEIGHT + STATUS_BAR_HEIGHT;
const IMAGE_HEIGHT = ACTUAL_HEIGHT * 0.45;

function Way2NewsCard({news, onPress, onCommentsPress}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets()
  const bookmarks = useSelector(state => state.bookmarks.items);
  const isBookmarked = bookmarks.some(item => item.id === news.id);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  // Check if this news has reporter info
  const hasReporter = news.reporter && news.reporter.name;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected - open full screen image
      setFullScreenImage(true);
      setLastTap(0); // Reset
    } else {
      // Single tap - toggle UI
      setLastTap(now);
      if (onPress) {
        onPress();
      }
    }
  };

  const handleShare = e => {
    // Prevent event bubbling
    // if (e && e.stopPropagation) e.stopPropagation();
    // Note: RNGH events behave slightly differently, usually handled by component structure
  };

  const handleCommentsPress = () => {
    if (onCommentsPress) {
      onCommentsPress(news);
    }
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setDisliked(false);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
    }
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuAction = (action) => {
    setMenuVisible(false);
    switch(action) {
      case 'bookmark':
        if (isBookmarked) {
          dispatch(removeBookmark(news.id));
        } else {
          dispatch(addBookmark(news));
        }
        break;
      case 'report':
        console.log('Report news:', news.id);
        break;
      case 'notInterested':
        console.log('Not interested:', news.id);
        break;
      case 'block':
        console.log('Block source:', news.id);
        break;
    }
  };
  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap} >
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Image source={{uri: news.image}} style={styles.image} />

          {/* Reporter Section with Gradient */}
          {hasReporter && (
            <>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.reporterGradient}
              />
              <View style={styles.reporterSection}>
                <Image
                  source={{uri: news.reporter.imageUrl}}
                  style={styles.reporterImage}
                />
                <View style={styles.reporterInfo}>
                  <Text style={styles.reporterName}>{news.reporter.name}</Text>
                  <View style={styles.reporterLocationRow}>
                    <Icon name="map-marker" size={14} color="#FFFFFFCC" />
                    <Text style={styles.reporterLocation}>
                      {news.reporter.location}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title */}
          <Text style={styles.title}>{news.title}</Text>

          {/* Body - Scrollable */}
          {/* Note: ScrollView inside GestureHandler needs careful handling usually,
              but standard ScrollView often works for simple cases */}
          <ScrollView
            style={styles.bodyContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}>
            <Text style={styles.body}>
              {news.body || news.description}
              {news.fullContent && (
                <Text style={styles.body}>{'\n\n' + news.fullContent}</Text>
              )}
            </Text>

            {/* Timestamp at Bottom */}
            <View style={styles.timestampContainer}>
              <Icon name="clock-outline" size={14} color="#999" />
              <Text style={styles.timestamp}>{news.timeAgo}</Text>
            </View>
          </ScrollView>

          {/* Stats and Actions Bar */}
          <View style={[styles.statsBar,{marginBottom:insets.bottom}]}>
            {/* Left Side - Comment, Like, Dislike */}
            <View style={styles.statsLeft}>
              {/* Comment Button */}
              <TouchableOpacity
                style={styles.statButton}
                onPress={handleCommentsPress}>
                <Icon name="comment-outline" size={20} color="#565B67" />
                <Text style={styles.statText}>{news.comments}</Text>
              </TouchableOpacity>

              {/* Like Button */}
              <TouchableOpacity style={styles.statButton} onPress={handleLike}>
                <Icon
                  name={liked ? 'thumb-up' : 'thumb-up-outline'}
                  size={20}
                  color={liked ? '#2196F3' : '#565B67'}
                />
                <Text style={[styles.statText, liked && {color: '#2196F3'}]}>
                  {liked ? parseInt(news.likes) + 1 : news.likes}
                </Text>
              </TouchableOpacity>

              {/* Dislike Button */}
              <TouchableOpacity style={styles.iconButton} onPress={handleDislike}>
                <Icon
                  name={disliked ? 'thumb-down' : 'thumb-down-outline'}
                  size={20}
                  color={disliked ? '#F44336' : '#565B67'}
                />
              </TouchableOpacity>
            </View>

            {/* Right Side - Menu first, Share last */}
            <View style={styles.actionsRight}>
              {/* Three Dots Menu */}
              <TouchableOpacity style={styles.iconButton} >
                <Icon name="dots-vertical" size={22} color="#565B67" />
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="share-variant" size={20} color="#565B67" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.menuContainer}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('bookmark')}>
                    <Icon
                      name={isBookmarked ? 'bookmark-minus' : 'bookmark-plus'}
                      size={24}
                      color="#333"
                    />
                    <Text style={styles.menuText}>
                      {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('report')}>
                    <Icon name="flag" size={24} color="#333" />
                    <Text style={styles.menuText}>Report</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('notInterested')}>
                    <Icon name="eye-off" size={24} color="#333" />
                    <Text style={styles.menuText}>Not Interested</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuAction('block')}>
                    <Icon name="cancel" size={24} color="#333" />
                    <Text style={styles.menuText}>Block this source</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Full Screen Image Modal */}
        <Modal
          visible={fullScreenImage}
          transparent
          animationType="fade"
          onRequestClose={() => setFullScreenImage(false)}>
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenImage(false)}>
              <Icon name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableWithoutFeedback
              onPress={() => setFullScreenImage(false)}
              activeOpacity={0.8}>
              <Image
                source={{uri: news.imageUrl}}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableWithoutFeedback>
            <View style={styles.imageInfo}>
              <Text style={styles.imageTitle}>{news.title}</Text>
            </View>
          </View>
        </Modal>
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
    width: responsiveWidth(100),
    height: '100%',
    resizeMode: 'cover',
  },
  reporterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  reporterSection: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reporterImage: {
    width: responsiveScreenWidth(10),
    height: responsiveScreenWidth(10),
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E0E0E0',
  },
  reporterInfo: {
    flex: 1,
  },
  reporterName: {
    fontSize: responsiveFontSize(1.8),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reporterLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reporterLocation: {
    fontSize: responsiveFontSize(1.6),
    fontWeight: '500',
    color: '#FFFFFFCC',
  },
  contentSection: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize:responsiveFontSize(2.6),
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 32,
    // marginBottom: 14,
  },
  bodyContainer: {
    flex: 1,
  },
  body: {
    fontSize: responsiveFontSize(2.4),
    color: '#333',
    lineHeight: 27,
    paddingBottom: 10,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 10,
  },
  timestamp: {
    fontSize: responsiveFontSize(1.5),
    color: '#999',
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  statText: {
    fontSize: 13,
    color: '#565B67',
    fontWeight: '600',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 16,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});

export default Way2NewsCard;