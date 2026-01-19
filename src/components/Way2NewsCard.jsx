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
  Linking,
  // Import standard RN components for use inside Modal to ensure clicks work
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  TouchableOpacity as RNTouchableOpacity,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {responsiveFontSize, responsiveScreenWidth, responsiveWidth} from 'react-native-responsive-dimensions';

// Assets
import { applogo } from '../assets'; 

// Redux Actions
import {addBookmark, removeBookmark} from '../redux/reducers/bookmarks';
import { reactToNews, getComments, trackAdClick } from '../redux/reducers/news';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
// We remove the hardcoded STATUS_BAR_HEIGHT logic in favor of insets
const ACTUAL_HEIGHT = SCREEN_HEIGHT + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0); 
const IMAGE_HEIGHT = ACTUAL_HEIGHT * 0.45;

function Way2NewsCard({news, onPress, onCommentsPress}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // Selectors
  const bookmarks = useSelector(state => state.bookmarks.items);
  const isBookmarked = news.id ? bookmarks.some(item => item.id === news.id) : false;

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const hasReporter = news.reporter && news.reporter.name;

  // --- DETERMINE IMAGE SOURCE ---
  const hasImage = !!news.image;
  const imageSource = hasImage 
    ? { 
        uri: news.image, 
        priority: FastImage.priority.high, 
        cache: FastImage.cacheControl.immutable 
      } 
    : applogo; 

  const imageResizeMode = hasImage ? FastImage.resizeMode.cover : FastImage.resizeMode.contain;

  // --- Handlers ---

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      setFullScreenImage(true);
      setLastTap(0); 
    } else {
      setLastTap(now);
      if (onPress) {
        onPress();
      }
    }
  };
  
  const handleAdPress = () => {
    if (news.id) {
        dispatch(trackAdClick(news.id));
    }
    if (news.redirectUrl) {
      Linking.openURL(news.redirectUrl).catch(err => 
        console.error("Failed to open URL:", err)
      );
    }
  };

  const handleCommentsPress = () => {
    dispatch(getComments(news.id));
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
      dispatch(reactToNews({ newsId: news.id, type: 'LIKE' }));
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
      dispatch(reactToNews({ newsId: news.id, type: 'DISLIKE' }));
    }
  };

  const handleShare = () => {
     console.log("Share pressed for news:", news.id);
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

  // --- RENDER AD CARD ---
  if (news.isAd) {
    return (
      <TouchableWithoutFeedback onPress={handleAdPress}>
        <View style={styles.card}>
          <FastImage 
            source={imageSource} 
            style={[styles.image, { height: '100%', width: '100%' }]} 
            resizeMode={imageResizeMode} 
          />
          {/* Ad Watermark */}
          <Image source={applogo} style={styles.watermarkLogo} /> 
          
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={[styles.reporterGradient, { height: 120 }]}
          />
          <View style={styles.adBadgeContainer}>
            <Text style={styles.adBadgeText}>{news.label || 'Sponsored'}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // --- RENDER NEWS CARD ---
  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap} >
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <FastImage 
            source={imageSource} 
            style={styles.image} 
            resizeMode={imageResizeMode}
          />

          <Image source={applogo} style={styles.watermarkLogo} />

          {hasReporter && (
            <>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.reporterGradient}
              />
              <View style={styles.reporterSection}>
                <FastImage
                  source={{
                    uri: news.reporter.imageUrl,
                    priority: FastImage.priority.normal
                  }}
                  style={styles.reporterImage}
                  resizeMode={FastImage.resizeMode.cover}
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
          <Text style={styles.title}>{news.title}</Text>

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

            <View style={styles.timestampContainer}>
              <Icon name="clock-outline" size={14} color="#999" />
              <Text style={styles.timestamp}>{news.timeAgo}</Text>
            </View>
          </ScrollView>

          <View style={[styles.statsBar,{marginBottom:insets.bottom}]}>
            <View style={styles.statsLeft}>
              <TouchableOpacity style={styles.statButton} onPress={handleCommentsPress}>
                <Icon name="comment-outline" size={20} color="#565B67" />
                <Text style={styles.statText}>{news.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statButton} onPress={handleLike}>
                <Icon name={liked ? 'thumb-up' : 'thumb-up-outline'} size={20} color={liked ? '#2196F3' : '#565B67'} />
                <Text style={[styles.statText, liked && {color: '#2196F3'}]}>
                  {liked ? parseInt(news?.likes || 0) + 1 : (news.likes || 0)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={handleDislike}>
                <Icon name={disliked ? 'thumb-down' : 'thumb-down-outline'} size={20} color={disliked ? '#F44336' : '#565B67'} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRight}>
              <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
                <Icon name="dots-vertical" size={22} color="#565B67" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Icon name="share-variant" size={20} color="#565B67" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- MENU MODAL --- */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}>
          <RNTouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <RNTouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.menuContainer}>
                  <RNTouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('bookmark')}>
                    <Icon name={isBookmarked ? 'bookmark-minus' : 'bookmark-plus'} size={24} color="#333" />
                    <Text style={styles.menuText}>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</Text>
                  </RNTouchableOpacity>
                  <View style={styles.menuDivider} />
                  <RNTouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('report')}>
                    <Icon name="flag" size={24} color="#333" />
                    <Text style={styles.menuText}>Report</Text>
                  </RNTouchableOpacity>
                  <View style={styles.menuDivider} />
                  <RNTouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('notInterested')}>
                    <Icon name="eye-off" size={24} color="#333" />
                    <Text style={styles.menuText}>Not Interested</Text>
                  </RNTouchableOpacity>
                  <View style={styles.menuDivider} />
                  <RNTouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('block')}>
                    <Icon name="cancel" size={24} color="#333" />
                    <Text style={styles.menuText}>Block this source</Text>
                  </RNTouchableOpacity>
                </View>
              </RNTouchableWithoutFeedback>
            </View>
          </RNTouchableWithoutFeedback>
        </Modal>

        {/* --- FULL SCREEN IMAGE MODAL --- */}
        <Modal
          visible={fullScreenImage}
          transparent
          animationType="fade"
          statusBarTranslucent={true} // Allow content to draw under status bar
          onRequestClose={() => setFullScreenImage(false)}>
          <View style={styles.fullScreenContainer}>
            {/* FIX 1: Use RNTouchableOpacity (Standard RN) 
              FIX 2: Use insets.top for dynamic padding 
            */}
            <RNTouchableOpacity
              style={[styles.closeButton, { top: Math.max(insets.top, 20) + 15 }]} 
              onPress={() => setFullScreenImage(false)}>
              <Icon name="close" size={28} color="#FFF" />
            </RNTouchableOpacity>

            <RNTouchableWithoutFeedback
              onPress={() => setFullScreenImage(false)}>
              <FastImage
                source={imageSource} 
                style={styles.fullScreenImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            </RNTouchableWithoutFeedback>
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
    backgroundColor: '#f0f0f0', 
  },
  image: {
    width: responsiveWidth(100),
    height: '100%',
  },
  watermarkLogo: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 45, 
    height: 45, 
    resizeMode: 'contain',
    zIndex: 10, 
    opacity: 0.9,
  },
  adBadgeContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  adBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  // Full Screen Modal Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 20, // High Z-Index
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