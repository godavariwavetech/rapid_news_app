import React, {useState, useRef, useEffect, useMemo} from 'react';
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
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
  FlatList 
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  responsiveFontSize, 
  responsiveWidth, 
  responsiveHeight 
} from 'react-native-responsive-dimensions';

// Assets
import { applogo } from '../assets'; 

// Redux Actions
import {getBookmarks, toggleBookmarkApi} from '../redux/reducers/bookmarks';
import { reactToNews, getComments, trackAdClick } from '../redux/reducers/news';
import { fonts } from '../config/theme';
import ReportModal from './ReportModal';
import { downloadImageToGallery, handleShare } from '../utils/FileHelpers';
import Video from 'react-native-video';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const ACTUAL_HEIGHT = SCREEN_HEIGHT + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0); 
const IMAGE_HEIGHT = ACTUAL_HEIGHT * 0.45;

function Way2NewsCard({news, onPress, onCommentsPress, isActive = true, isBottomHalf = false}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {bookmarkIds} = useSelector(state => state.bookmarks);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true); 
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef(null);
  const nudgeTimeout = useRef(null);
  const flatListRef = useRef(null);
  const videoRef = useRef(null);
  const hasNudged = useRef(false);
  const hasLoaded = useRef(false);

  const showControlsTemporarily = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    setShowControls(true);
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleToggleControls = () => {
    if (!showControls) {
      showControlsTemporarily();
    } else {
      setShowControls(false);
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    }
  };

  const handlePlayPauseToggle = () => { // New function for play/pause button
    if (nudgeTimeout.current) {
      clearTimeout(nudgeTimeout.current);
      nudgeTimeout.current = null;
      hasNudged.current = true; // Consider it nudged if user intervened
    }
    setIsVideoPaused(prev => !prev);
    showControlsTemporarily(); // Keep controls visible for a bit after play/pause
  };

  const triggerNudge = () => {
    if (nudgeTimeout.current) clearTimeout(nudgeTimeout.current);
    setIsVideoPaused(true);
    nudgeTimeout.current = setTimeout(() => {
      setIsVideoPaused(false);
      nudgeTimeout.current = null;
      hasNudged.current = true;
    }, 200);
  };

  useEffect(() => {
    setActiveSlide(0);
    hasNudged.current = false;
    hasLoaded.current = false;
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }

    if (!isActive || isBottomHalf) {
      setIsVideoPaused(true);
      if (nudgeTimeout.current) {
        clearTimeout(nudgeTimeout.current);
        nudgeTimeout.current = null;
      }
    } else if (isActive && !isBottomHalf && hasLoaded.current && !hasNudged.current) {
      triggerNudge();
    }
    
    setLiked(news.isLiked || news.myreaction === 'LIKE' || news.reactions?.my_reaction === 'LIKE');
    setDisliked(news.isDisliked || news.myreaction === 'DISLIKE' || news.reactions?.my_reaction === 'DISLIKE');
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      if (nudgeTimeout.current) {
        clearTimeout(nudgeTimeout.current);
      }
    };
  }, [news.id, news.isLiked, news.isDisliked, news.myreaction, news.reactions?.my_reaction, isActive, isBottomHalf]);

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index || 0);
    }
  });

  const images = news.images && news.images.length > 0 ? news.images : (news.image ? [news.image] : []);
  const hasMultipleImages = images.length > 1;
  const hasImage = images.length > 0;
  
  const imageResizeMode = hasImage ? FastImage.resizeMode.stretch : FastImage.resizeMode.contain;

  const videoUrls = news.videos || [];
  const hasVideos = videoUrls.length > 0 && !isBottomHalf;

  const videoSource = useMemo(() => {
    if (hasVideos) {
      return {uri: videoUrls[0]};
    }
    return null;
  }, [videoUrls[0], hasVideos]);

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

  const handleShareNews = () => {
     console.log("Share pressed for news:", news.id);
     handleShare(news.title, news.short || news.body);
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleMenuAction = (action) => {
    setMenuVisible(false);
    switch(action) {
      case 'bookmark':
          dispatch(toggleBookmarkApi({ newsId: news.id, isCurrentlyBookmarked: isBookmarked }));
        break;
      case 'report':
        setReportModalVisible(true);
        break;
      case 'download':
        downloadImageToGallery(news.image || (news.images && news.images[0]));
        break;
    }
  };

  if (news.isAd) {
    const imageSource = news.image ? { 
      uri: news.image, 
      priority: FastImage.priority.high, 
      cache: FastImage.cacheControl.immutable 
    } : applogo;

    return (
      <TouchableWithoutFeedback onPress={handleAdPress}>
        <View style={styles.card}>
          <FastImage 
            source={imageSource} 
            style={[styles.image, { height: '100%', width: '100%' }]} 
            resizeMode={imageResizeMode} 
          />
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

  const renderImageItem = ({ item }) => (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
        <FastImage 
          source={{ 
            uri: item, 
            priority: FastImage.priority.high, 
            cache: FastImage.cacheControl.immutable 
          }} 
          style={styles.image} 
          resizeMode={imageResizeMode}
        />
      </View>
    </TouchableWithoutFeedback>
  );
  const isBookmarked = bookmarkIds?.includes(news.id)

  return (
    <View style={styles.card}>
      <View style={styles.imageSection}>
        {hasVideos ? (
          <View style={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#000'}}>
            <TouchableWithoutFeedback 
              onPress={handleToggleControls}
              containerStyle={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT}}>
              <Video
                ref={videoRef}
                source={videoSource}
                style={styles.image}
                resizeMode="contain"
                repeat={true}
                paused={isVideoPaused}
                muted={false}
                volume={1.0}
                playInBackground={false}
                playWhenInactive={false}
                useTextureView={true}
                bufferConfig={{
                  minBufferMs: 15000,
                  maxBufferMs: 50000,
                  bufferForPlaybackMs: 2500,
                  bufferForPlaybackAfterRebufferMs: 5000,
                }}
                onBuffer={({isBuffering}) => setIsBuffering(isBuffering)}
                onError={() => setIsBuffering(false)}
                onReadyForDisplay={() => {
                  setIsBuffering(false);
                }}
                onLoad={() => {
                  hasLoaded.current = true;
                  showControlsTemporarily();
                  if (isActive && !isBottomHalf && !hasNudged.current) {
                    triggerNudge();
                  }
                }}
                controls={false}
              />
            </TouchableWithoutFeedback>

            {isBuffering && (
              <View style={[styles.videoOverlay, styles.centerOverlay]} pointerEvents="none">
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}

            {/* Conditional rendering for play/pause button */}
            {showControls && (
              <View style={[StyleSheet.absoluteFill, styles.centerOverlay]} pointerEvents="box-none">
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.playPauseButton}
                  onPress={handlePlayPauseToggle}>
                  <Icon
                    name={isVideoPaused ? 'play-circle' : 'pause-circle'}
                    size={80}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : hasMultipleImages ? (
          <View style={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT}}>
            <FlatList
              ref={flatListRef}
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewRef.current}
              viewabilityConfig={viewConfigRef.current}
              style={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT}}
            />
            <View style={styles.paginationContainer}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        i === activeSlide ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <FastImage
              source={hasImage ? {uri: images[0]} : applogo}
              style={styles.image}
              resizeMode={imageResizeMode}
            />
          </TouchableWithoutFeedback>
        )}

        {/* Standard News gets the logo */}
        <Image source={applogo} style={styles.watermarkLogo} />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableWithoutFeedback
          onPress={handleDoubleTap}
          containerStyle={{flex: 1}}
          style={{flex: 1}}>
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
            </ScrollView>

            <View style={styles.timestampContainer}>
              <Icon name="clock-outline" size={14} color="#999" />
              <Text style={styles.timestamp}>{news.timeAgo}</Text>
            </View>

            <View style={[styles.statsBar, {marginBottom: insets.bottom+10}]}>
              <View style={styles.statsLeft}>
                {news.commentsEnabled !== false && (
                  <TouchableOpacity
                    style={styles.statButton}
                    onPress={handleCommentsPress}>
                    <Icon name="comment-outline" size={20} color="#565B67" />
                    <Text style={styles.statText}>{news.comments}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.statButton}
                  onPress={handleLike}>
                  <Icon
                    name={liked ? 'thumb-up' : 'thumb-up-outline'}
                    size={20}
                    color={liked ? '#2196F3' : '#565B67'}
                  />
                  <Text style={[styles.statText, liked && {color: '#2196F3'}]}>
                    {liked ? parseInt(news?.likes || 0) + 1 : news.likes || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleDislike}>
                  <Icon
                    name={disliked ? 'thumb-down' : 'thumb-down-outline'}
                    size={20}
                    color={disliked ? '#F44336' : '#565B67'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRight}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleMenuPress}>
                  <Icon name="dots-vertical" size={22} color="#565B67" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    handleShareNews(news.title, news.short, news.id)
                  }>
                  <Icon name="share-variant" size={20} color="#565B67" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* --- MENU MODAL (Only 3 Options) --- */}

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        newsId={news.id} // Passing the news ID for the API call
      />

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <RNTouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <RNTouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.menuContainer}>
                <RNTouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('bookmark')}>
                  <Icon
                    name={isBookmarked ? 'bookmark-minus' : 'bookmark-outline'}
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.menuText}>
                    {isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                  </Text>
                </RNTouchableOpacity>

                <View style={styles.menuDivider} />

                <RNTouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('report')}>
                  <Icon name="alert-circle-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>Report</Text>
                </RNTouchableOpacity>

                <View style={styles.menuDivider} />

                <RNTouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction('download')}>
                  <Icon name="download-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>Download Image</Text>
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
        statusBarTranslucent={true}
        onRequestClose={() => setFullScreenImage(false)}>
        <View style={styles.fullScreenContainer}>
          <RNTouchableOpacity
            style={[styles.closeButton, {top: Math.max(insets.top, 20) + 15}]}
            onPress={() => setFullScreenImage(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </RNTouchableOpacity>

          <RNTouchableWithoutFeedback onPress={() => setFullScreenImage(false)}>
            <FastImage
              source={
                hasImage ? {uri: images[activeSlide] || images[0]} : applogo
              }
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
  bottomContainer: {
    flex: 1, 
    width: '100%',
  },
  image: {
    width: responsiveWidth(100),
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20, 
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
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
    borderRadius:12
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
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: responsiveFontSize(2.5), 
    color: '#1A1A1A',
    lineHeight: responsiveFontSize(4),
    marginBottom:7,
    // marginBottom: responsiveHeight(2), 
    letterSpacing: 0.2,
    fontFamily:fonts.bold
  },
  bodyContainer: {
    flex: 1,
  },
  body: {
    fontSize: responsiveFontSize(2.2),
    color: '#333',
    lineHeight: responsiveFontSize(4.0),
    paddingBottom: 10,
    fontWeight: '400', 
    letterSpacing: 0.3,
    fontFamily:fonts.medium
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 4,
    justifyContent: 'flex-start',
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
    maxWidth: 280,
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
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
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
    right: 20,
    zIndex: 20, 
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
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Dim the background slightly
    zIndex: 5,
  },
    loaderOverlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    minWidth: 120,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  centerOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5, // Lower zIndex so play/pause button is on top
  },
  playPauseButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensure it's above the video and overlay
  },
});

export default Way2NewsCard;