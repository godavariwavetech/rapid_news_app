import React, {useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle} from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, Modal, Linking, Alert,
  ActivityIndicator, Pressable, TouchableOpacity, TouchableWithoutFeedback, AppState, 
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';
import ViewShot from 'react-native-view-shot';

// Assets
import { applogo } from '../assets'; 

// Redux Actions
import {getBookmarks, toggleBookmarkApi} from '../redux/reducers/bookmarks';
import {reactToNews, getComments, trackAdClick} from '../redux/reducers/news';
import {fonts, lightTheme, darkTheme} from '../config/theme';
import ReportModal from './ReportModal';
import {downloadImageToGallery, handleShare, generateVideoThumbnail} from '../utils/FileHelpers';
import ShimmerLoader from './ShimmerLoader';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe'; 

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const ACTUAL_HEIGHT = SCREEN_HEIGHT;

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Way2NewsCard = forwardRef(({news, onPress, onCommentsPress, isActive = true, isBottomHalf = false}, ref) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {bookmarkIds} = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const cardHeight = ACTUAL_HEIGHT - insets.top;
  const IMAGE_HEIGHT = cardHeight * 0.40;  const viewShotRef = useRef(null); 

  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const flatListRef = useRef(null);
  const isManuallyPaused = useRef(false);
  const controlsTimeout = useRef(null);
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null);

  useImperativeHandle(ref, () => ({
    play: () => { setIsVideoPaused(false); isManuallyPaused.current = false; },
    pause: () => { setIsVideoPaused(true); isManuallyPaused.current = true; },
    toggle: () => { handlePlayPauseToggle(); }
  }));

  const videoUrls = useMemo(() => (news.videos && news.videos.length > 0) ? news.videos : [], [news.videos]); 
  const hasVideos = videoUrls.length > 0; // Removed !isBottomHalf so state is accurate in both halves

  const youtubeId = useMemo(() => {
    if (hasVideos) return getYoutubeId(videoUrls[0]);
    if (news.external_links && news.external_links.length > 0) return getYoutubeId(news.external_links[0]);
    return null;
  }, [videoUrls, news.external_links, hasVideos]);

  const videoSource = useMemo(() => {
    if (hasVideos && !youtubeId) return {
      uri: videoUrls[0],
      bufferConfig: { minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000, cacheSizeMB: 50 },
    };
    return null;
  }, [videoUrls, hasVideos, youtubeId]);

  const thumbnailUri = useMemo(() => {
    if (news.image) return news.image;
    if (news.images && news.images.length > 0) return news.images[0];
    if (news.thumbnail) return news.thumbnail;
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return null;
  }, [news.image, news.images, news.thumbnail, youtubeId]);

  const displayThumbnail = generatedThumbnail || thumbnailUri;

  useEffect(() => {
    console.log('[Thumbnail] Effect triggered | hasVideos:', hasVideos, '| youtubeId:', youtubeId, '| thumbnailUri:', thumbnailUri, '| videoUrl:', videoUrls[0]);
    let isCancelled = false;

    // Only pre-generate in the top half to avoid duplicate processing
    if (hasVideos && !youtubeId && !thumbnailUri && !isBottomHalf) {
      console.log('[Thumbnail] Starting generation for:', videoUrls[0]);
      generateVideoThumbnail(videoUrls[0]).then(path => {
        if (isCancelled) return;
        console.log('[Thumbnail] Generation result path:', path);
        if (path) {
          setGeneratedThumbnail(path);
          console.log('[Thumbnail] ✅ generatedThumbnail set to:', path);
        } else {
          console.log('[Thumbnail] ❌ Generation returned null/undefined');
        }
      }).catch(err => {
        if (!isCancelled) console.log('[Thumbnail] ❌ Generation threw error:', err?.message);
      });
    } else {
      console.log('[Thumbnail] Skipped generation — condition not met (isBottomHalf: ' + isBottomHalf + ')');
    }

    return () => { isCancelled = true; };
  }, [hasVideos, youtubeId, thumbnailUri, videoUrls, isBottomHalf]);

  const isOriginallyLiked = news.isLiked || news.myreaction === 'LIKE' || news.reactions?.my_reaction === 'LIKE';
  const isOriginallyDisliked = news.isDisliked || news.myreaction === 'DISLIKE' || news.reactions?.my_reaction === 'DISLIKE';

  const [liked, setLiked] = useState(isOriginallyLiked);
  const [disliked, setDisliked] = useState(isOriginallyDisliked);
  const [likeCount, setLikeCount] = useState(parseInt(news?.reactions?.likes || news?.likes || 0));
  const [dislikeCount, setDislikeCount] = useState(parseInt(news?.reactions?.dislikes || news?.dislikes || 0));

  useEffect(() => {
    setLiked(isOriginallyLiked); setDisliked(isOriginallyDisliked);
    setLikeCount(parseInt(news?.reactions?.likes || news?.likes || 0));
    setDislikeCount(parseInt(news?.reactions?.dislikes || news?.dislikes || 0));
    setGeneratedThumbnail(null); // Reset generated thumbnail for new news item
  }, [news.id, isOriginallyLiked, isOriginallyDisliked, news.likes, news.dislikes, news.reactions]);

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount(prev => Math.max(0, prev - 1)); dispatch(reactToNews({ newsId: news.id, type: 'LIKE' })); } 
    else { setLiked(true); setLikeCount(prev => prev + 1); if (disliked) { setDisliked(false); setDislikeCount(prev => Math.max(0, prev - 1)); } dispatch(reactToNews({ newsId: news.id, type: 'LIKE' })); }
  };

  const handleDislike = () => {
    if (disliked) { setDisliked(false); setDislikeCount(prev => Math.max(0, prev - 1)); dispatch(reactToNews({ newsId: news.id, type: 'DISLIKE' })); } 
    else { setDisliked(true); setDislikeCount(prev => prev + 1); if (liked) { setLiked(false); setLikeCount(prev => Math.max(0, prev - 1)); } dispatch(reactToNews({ newsId: news.id, type: 'DISLIKE' })); }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => { if (nextAppState.match(/inactive|background/)) setIsVideoPaused(true); });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    isManuallyPaused.current = true; setIsVideoPaused(true); setIsBuffering(false); setShowControls(false); setVideoReady(false);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    const t = setTimeout(() => setVideoReady(true), 4000);
    return () => clearTimeout(t);
  }, [news.id, isActive, isBottomHalf]);

  const showControlsTemporarily = () => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setShowControls(true);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2000);
  };

  const handlePlayPauseToggle = useCallback(() => { 
    setIsVideoPaused(prev => { const next = !prev; isManuallyPaused.current = next; return next; });
    showControlsTemporarily(); 
  }, []);

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewRef = useRef(({ viewableItems }) => { if (viewableItems.length > 0) setActiveSlide(viewableItems[0].index || 0); });

  const images = news.images && news.images.length > 0 ? news.images : (news.image ? [news.image] : []);
  const hasMultipleImages = images.length > 1;
  const hasImage = images.length > 0;
  const imageResizeMode = FastImage.resizeMode.cover;

  const onVideoReady = useCallback(() => { playerRef.current?.seekTo(0, true); setIsBuffering(false); setVideoReady(true); }, []);
  const onVideoLoad = useCallback(() => { setVideoReady(true); setIsBuffering(false); }, []);
  const onPlayerError = useCallback(() => { setIsBuffering(false); }, []);

  const onYoutubeStateChange = useCallback((state) => {
    if (state === "playing") { setIsBuffering(false); setIsVideoPaused(false); } 
    else if (state === "paused" || state === "ended") { setIsVideoPaused(true); if(state === "ended") { isManuallyPaused.current = true; setShowControls(true); } } 
    else if (state === "buffering") { setIsBuffering(true); }
  }, []);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < 300) { setFullScreenImage(true); setLastTap(0); } 
    else { setLastTap(now); if (onPress) onPress(); }
  };
  
  const handleAdPress = () => { if (news.id) dispatch(trackAdClick(news.id)); if (news.redirectUrl) Linking.openURL(news.redirectUrl).catch(err => console.log(err)); };
  const handleCommentsPress = () => { dispatch(getComments(news.id)); if (onCommentsPress) onCommentsPress(news); };

  const displayTitle = news.title || news.content?.te?.title || news.content?.title || '';
  const displayBody = news.body || news.description || news.content?.te?.body || news.content?.body || '';

  // --- VIEW SHOT SHARE FUNCTION (BASE64) ---
  const handleShareNews = async () => {
    let activeThumbnail = generatedThumbnail;

    // If sharing from the bottom half, the thumbnail won't be pre-generated. Generate it on-demand.
    if (hasVideos && !youtubeId && !activeThumbnail && !thumbnailUri) {
      console.log('[Share] Generating thumbnail on-demand during share (bottom half)...');
      activeThumbnail = await generateVideoThumbnail(videoUrls[0]);
      if (activeThumbnail) setGeneratedThumbnail(activeThumbnail);
    }

    const currentDisplayThumbnail = activeThumbnail || thumbnailUri;
    const imageUrl = news.images?.[0] || news.image || news.thumbnail || currentDisplayThumbnail;
    const articleId = news._id || news.id;

    console.log('[Share] ▶ handleShareNews triggered');
    console.log('[Share] news.id:', news.id, '| hasVideos:', hasVideos, '| youtubeId:', youtubeId);
    console.log('[Share] activeThumbnail:', activeThumbnail);
    console.log('[Share] thumbnailUri:', thumbnailUri);
    console.log('[Share] currentDisplayThumbnail:', currentDisplayThumbnail);
    console.log('[Share] imageUrl (fallback):', imageUrl);

    console.log('[Share] Path: ViewShot capture (with generatedThumbnail if available)');
    try {
      setScreenshotMode(true);
      // Allow image to fully render in place of the video before capture
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (!viewShotRef.current || !viewShotRef.current.capture) {
        throw new Error("ViewShot reference is missing or library is not linked correctly.");
      }

      console.log('[Share] Capturing ViewShot...');
      // Capture as Base64 String to completely avoid Android file permission errors
      const base64Data = await viewShotRef.current.capture();
      console.log('[Share] ViewShot captured, base64 length:', base64Data?.length);
      
      await handleShare(displayTitle, articleId, base64Data, imageUrl);
      console.log('[Share] ✅ ViewShot share completed');
    } catch (error) {
      console.log('[Share] ❌ ViewShot Share error:', error);
      Alert.alert("Share Failed", "Could not process screenshot: " + error.message);
    } finally {
      setScreenshotMode(false);
    }
  };

  const handleMenuPress = () => setMenuVisible(true);
  const handleMenuAction = (action) => {
    setMenuVisible(false);
    switch(action) {
      case 'bookmark': dispatch(toggleBookmarkApi({ newsId: news.id, isCurrentlyBookmarked: isBookmarked })); break;
      case 'report': setReportModalVisible(true); break;
      case 'download': downloadImageToGallery(news.image || (news.images && news.images[0])); break;
    }
  };

  if (news.isAd) {
    const imageSource = news.image ? { uri: news.image, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable } : applogo;
    return (
      <TouchableWithoutFeedback onPress={handleAdPress}>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }} style={styles.card}>
          <FastImage source={imageSource} style={[styles.image, { height: '100%', width: '100%' }]} resizeMode={imageResizeMode} onLoadStart={() => setIsBuffering(true)} onLoad={() => setIsBuffering(false)} onError={() => setIsBuffering(false)} />
          {isBuffering && <View style={styles.adPlaceholder}><ActivityIndicator size="large" color="#CCCCCC" /></View>}
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']} style={[styles.reporterGradient, { height: 120 }]} />
        </ViewShot>
      </TouchableWithoutFeedback>
    );
  }

  const renderImageItem = ({ item }) => (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
        <FastImage source={{ uri: item, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }} style={styles.image} resizeMode={imageResizeMode} />
      </View>
    </TouchableWithoutFeedback>
  );
  
  const isBookmarked = bookmarkIds?.includes(news.id);

  // Outer component handles ViewShot Base64 Capture
  return (
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }} style={[styles.card, { height: cardHeight }]}>
      <View style={[styles.imageSection, { height: IMAGE_HEIGHT }]}>

        {(hasVideos || youtubeId) ? (
          <View style={{ flex: 1, backgroundColor: '#000', width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
              <View style={StyleSheet.absoluteFillObject}>

                {/* --- FALLBACK IMAGE LAYER --- */}
                {((!isBottomHalf || screenshotMode) && (!videoReady || screenshotMode)) && (
                  displayThumbnail ? (
                    <FastImage source={{ uri: displayThumbnail, priority: FastImage.priority.high }} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                      <Image source={applogo} style={{ width: 150, height: 150, resizeMode: 'contain' }} />
                    </View>
                  )
                )}

                {/* --- VIDEO LAYER --- */}
                {isActive && !isBottomHalf && !screenshotMode && (
                  youtubeId ? (
                    <YoutubePlayer
                      ref={playerRef} key={youtubeId} height={IMAGE_HEIGHT} width={SCREEN_WIDTH} play={!isVideoPaused} videoId={youtubeId}
                      onChangeState={onYoutubeStateChange} onError={onPlayerError}
                      initialPlayerParams={{ autoplay: 1, controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0 }}
                      webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
                    />
                  ) : (
                    <Video
                      key={videoUrls[0]} ref={videoRef} source={videoSource} style={StyleSheet.absoluteFill} resizeMode="contain" repeat={true} paused={isVideoPaused} muted={isMuted} volume={1.0}
                      playInBackground={false} playWhenInactive={false} onBuffer={({isBuffering: b}) => setIsBuffering(b)} onReadyForDisplay={onVideoReady} onLoad={onVideoLoad} controls={false} 
                    />
                  )
                )}

              </View>
            </View>

            <Pressable onPress={handlePlayPauseToggle} style={styles.videoTouchOverlay}>
              <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {isBuffering && isActive && !isBottomHalf && !isVideoPaused && (
                  <View style={styles.loaderOverlay}><ActivityIndicator size="large" color="#FFFFFF" /></View>
                )}
                {((isVideoPaused || showControls) && !isBuffering && isActive && !isBottomHalf) && (
                  <View style={styles.playPauseIconContainer}><Icon name={isVideoPaused ? 'play' : 'pause'} size={50} color="#FFFFFF" /></View>
                )}
                {(!isActive || isBottomHalf) && (
                  <View style={styles.playPauseIconContainer}><Icon name="play" size={50} color="#FFFFFF" /></View>
                )}
                {isActive && !isBottomHalf && !youtubeId && (
                  <View style={styles.videoControls}>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setIsMuted(m => !m); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.videoControlBtn}>
                      <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setIsVideoFullScreen(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.videoControlBtn}>
                      <Icon name="fullscreen" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        ) : hasMultipleImages ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <FlatList ref={flatListRef} data={images} renderItem={renderImageItem} keyExtractor={(item, index) => index.toString()} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewRef.current} viewabilityConfig={viewConfigRef.current} style={{ width: SCREEN_WIDTH, height: '100%' }} />
            <View style={styles.paginationContainer}>
              {images.map((_, i) => <View key={i} style={[styles.paginationDot, {backgroundColor: i === activeSlide ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}]} />)}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableWithoutFeedback onPress={handleDoubleTap}>
              <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
                <View style={[StyleSheet.absoluteFill]}><ShimmerLoader height={IMAGE_HEIGHT} borderRadius={0} /></View>
                <FastImage source={hasImage ? {uri: images[0], priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable} : applogo} style={styles.image} resizeMode={imageResizeMode} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
        <Image source={applogo} style={styles.watermarkLogo} />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.contentSection}>
            <Text style={styles.title} numberOfLines={3} allowFontScaling={false}>{displayTitle}</Text>
            <View style={styles.bodyContainer}>
              <Text style={styles.body} allowFontScaling={false}>
                {displayBody}
                {news.fullContent && (<Text allowFontScaling={false}>{'\n\n' + news.fullContent}</Text>)}
              </Text>
            </View>

            <View style={styles.timestampRow}>
              <View style={styles.timestampContainer}>
                <Icon name="clock-outline" size={14} color="#999" />
                <Text style={styles.timestamp}  allowFontScaling={false}>{news.timeAgo}</Text>
              </View>
              {news.itemIndex && news.totalNews ? (
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp}>{news.itemIndex} of {news.totalNews}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableWithoutFeedback>

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon name={liked ? 'thumb-up' : 'thumb-up-outline'} size={22} color={liked ? '#4dabf5' : '#E0E0E0'} />
              <Text style={[styles.actionText, liked && { color: '#4dabf5' }]}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
              <Icon name={disliked ? 'thumb-down' : 'thumb-down-outline'} size={22} color={disliked ? '#F44336' : '#E0E0E0'} />
              <Text style={[styles.actionText, disliked && { color: '#F44336' }]}>{dislikeCount}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRight}>
            {news.commentsEnabled !== false && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCommentsPress}>
                <Icon name="comment-outline" size={22} color="#E0E0E0" />
                <Text style={styles.actionText}>{news?.comments?.count || news?.comments || 0}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionIconButton} onPress={handleMenuPress}>
              <Icon name="dots-vertical" size={24} color="#E0E0E0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => handleShareNews()}>
              <Icon name="share" size={24} color="#2196F3" /> 
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ReportModal visible={reportModalVisible} onClose={() => setReportModalVisible(false)} newsId={news.id} />

      <Modal visible={isVideoFullScreen} transparent={false} animationType="fade" statusBarTranslucent={true} onRequestClose={() => setIsVideoFullScreen(false)}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={[styles.closeButton, { top: Math.max(insets.top, 20) + 10 }]} onPress={() => setIsVideoFullScreen(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {videoSource && (
            <Video source={videoSource} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} resizeMode="contain" repeat={true} paused={isVideoPaused} muted={isMuted} volume={1.0} playInBackground={false} playWhenInactive={false} onBuffer={({ isBuffering: b }) => setIsBuffering(b)} controls={true} />
          )}
          <TouchableOpacity style={[styles.videoControlBtn, { position: 'absolute', bottom: 30, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }]} onPress={() => setIsMuted(m => !m)}>
            <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.menuContainer, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('bookmark')}>
                  <Icon name={isBookmarked ? 'bookmark-minus' : 'bookmark-outline'} size={24} color={theme.text} />
                  <Text style={[styles.menuText, { color: theme.text }]}>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]} />
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('report')}>
                  <Icon name="alert-circle-outline" size={24} color={theme.text} />
                  <Text style={[styles.menuText, { color: theme.text }]}>Report</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={fullScreenImage} transparent animationType="fade" statusBarTranslucent={true} onRequestClose={() => setFullScreenImage(false)}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={[styles.closeButton, {top: Math.max(insets.top, 20) + 15}]} onPress={() => setFullScreenImage(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableWithoutFeedback onPress={() => setFullScreenImage(false)}>
            <FastImage source={hasImage ? {uri: images[activeSlide] || images[0]} : applogo} style={styles.fullScreenImage} resizeMode={FastImage.resizeMode.contain} />
          </TouchableWithoutFeedback>
          <View style={styles.imageInfo}><Text style={styles.imageTitle}>{displayTitle}</Text></View>
        </View>
      </Modal>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  card: { width: SCREEN_WIDTH, height: ACTUAL_HEIGHT, backgroundColor: '#FFFFFF' },
  imageSection: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT, position: 'relative', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { flex: 1, width: '100%', backgroundColor: '#2C2C2C' },
  image: { width: responsiveWidth(100), height: '100%', justifyContent: 'center', alignItems: 'center' },
  paginationContainer: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 15 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  watermarkLogo: { position: 'absolute', bottom: -10, left: 15, width: 120, height: 60, resizeMode: 'contain', zIndex: 100000, opacity: 0.9, borderRadius: 16 },  
  adBadgeContainer: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  adBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  adPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  reporterGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  contentSection: { flex: 1, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, paddingHorizontal: 18, paddingTop: 0, paddingBottom: 10 },
  title: { fontFamily: fonts.medium, fontSize: responsiveFontSize(2.8), color: '#000000', lineHeight: responsiveFontSize(3.4), includeFontPadding: false, paddingTop: 8, paddingBottom: 3 },
  bodyContainer: { flex: 1, overflow: 'hidden' },
  body: { fontFamily: fonts.description, fontSize: responsiveFontSize(3.5), lineHeight: responsiveFontSize(3.5), color: '#555555', fontWeight: '400' },
  timestampRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  timestampContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timestamp: { fontSize: responsiveFontSize(1.5), color: '#999', fontWeight: '500' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2C2C2C', width: '100%', paddingTop: 8, paddingHorizontal: 16 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIconButton: { padding: 4 },
  actionText: { fontSize: 14, color: '#E0E0E0', fontWeight: '600' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuContainer: { borderRadius: 12, width: '100%', maxWidth: 280, paddingVertical: 8, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 16 },
  menuText: { fontSize: 16, fontWeight: '500', flex: 1 },
  menuDivider: { height: 1, marginHorizontal: 16 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', right: 20, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  fullScreenImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  imageInfo: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 16, borderRadius: 12 },
  imageTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', lineHeight: 22 },
  loaderOverlay: { position: 'absolute', top: '25%', left: '25%', right: '25%', bottom: '25%', zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  videoTouchOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 20, justifyContent: 'center', alignItems: 'center' },
  playPauseIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  videoControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 8 },
  videoControlBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});

export default Way2NewsCard;