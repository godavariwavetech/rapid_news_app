import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, Modal, Linking, Alert,
  ActivityIndicator, Pressable, TouchableOpacity, TouchableWithoutFeedback, AppState, PanResponder,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FlatList } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';
import ViewShot from 'react-native-view-shot';

// Assets
import { applogo } from '../assets';

// Redux Actions
import { getBookmarks, toggleBookmarkApi } from '../redux/reducers/bookmarks';
import { reactToNews, getComments, trackAdClick, shareNews } from '../redux/reducers/news';
import { fonts, lightTheme, darkTheme } from '../config/theme';
import ReportModal from './ReportModal';
import { downloadImageToGallery, handleShare, handleWhatsAppShare, generateVideoThumbnail } from '../utils/FileHelpers';
import { getCachedVideo } from '../utils/videoFileCache';
import ShimmerLoader from './ShimmerLoader';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACTUAL_HEIGHT = SCREEN_HEIGHT;
// Foldables/tablets (unfolded) have a wide/short aspect ratio; normal phones are ~1.8–2.2.
// ONLY on these wide screens do we shrink the media + body text and reserve tab-bar space,
// so the long article body fits above the bottom tab bar instead of clipping behind it.
// Normal phones keep the original 0.40 media height and font sizes (untouched).
const IS_WIDE_SCREEN = SCREEN_HEIGHT / SCREEN_WIDTH < 1.6;
const IMAGE_HEIGHT = ACTUAL_HEIGHT * (IS_WIDE_SCREEN ? 0.30 : 0.40);
// react-native-youtube-iframe hard-codes its internal HTML to a 16:9 box (padding-bottom: 56.25%)
// that isn't vertically centered inside the WebView. Sizing the player to the true 16:9 height and
// centering it ourselves (see imageSection/mediaLayer styles) avoids it being pinned to the top of
// the media box with dead space below whenever mediaHeight isn't already 16:9.
const YOUTUBE_PLAYER_HEIGHT = Math.round(SCREEN_WIDTH * 9 / 16);
// Dark space reserved below the action bar so the last content lines clear the tabs (wide only).
// Matches the shrunk BottomTabBar height on wide screens (~40px above the safe-area inset).
const WIDE_TAB_BAR_CLEARANCE = IS_WIDE_SCREEN ? 42 : 0;

const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Way2NewsCard = forwardRef(({ news, onPress, onCommentsPress, isActive = true, isBottomHalf = false, onPressTag }, ref) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { bookmarkIds } = useSelector(state => state.bookmarks);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const viewShotRef = useRef(null);

  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // The native video/YouTube player is NOT mounted until the user starts playback.
  // Videos never autoplay here, so deferring the mount removes the black native
  // surface that used to paint over the thumbnail on a freshly-arrived card.
  const [hasActivatedVideo, setHasActivatedVideo] = useState(false);
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
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const [videoCurrentTimeSec, setVideoCurrentTimeSec] = useState(0);
  const [seekBarWidth, setSeekBarWidth] = useState(0);
  const wasPlayingBeforeScrub = useRef(false);
  const fullScreenVideoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => { setIsVideoPaused(false); isManuallyPaused.current = false; setHasActivatedVideo(true); },
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

  // True only while a video is actually rolling. Image cards keep isVideoPaused
  // at its initial true, so they never match. Drives both the video controls and
  // the byline/logo strip they'd otherwise sit on top of.
  const isVideoPlaying = (hasVideos || !!youtubeId) && hasActivatedVideo && !isVideoPaused;

  const videoSource = useMemo(() => {
    if (hasVideos && !youtubeId) return {
      // Use the locally-prefetched file if ready (instant, no buffering); else stream.
      uri: getCachedVideo(videoUrls[0]) || videoUrls[0],
      // bufferForPlaybackAfterRebufferMs was 5000 — every drag-seek on the red
      // seek bar counts as a rebuffer, so playback sat frozen for a full 5s
      // after every scrub. Also tightened minBufferMs/maxBufferMs/
      // bufferForPlaybackMs (were 15000/50000/2500) — ExoPlayer was targeting
      // a huge buffer window before calling itself "ready" post-seek, which
      // adds to the stall on top of bufferForPlaybackAfterRebufferMs. These
      // still leave enough cushion for smooth normal playback.
      bufferConfig: { minBufferMs: 8000, maxBufferMs: 25000, bufferForPlaybackMs: 1000, bufferForPlaybackAfterRebufferMs: 1000, cacheSizeMB: 50 },
    };
    return null;
    // hasActivatedVideo is a dep on purpose: the player only mounts once it flips
    // true (see the VIDEO LAYER below), and the prefetch download often finishes
    // AFTER this card first mounts. Without it here, this stayed frozen at the
    // mount-time remote URL forever, so the local cached file was never picked up
    // and every video streamed over the network regardless of how early it was
    // prefetched — re-check right before the player actually needs the source.
  }, [videoUrls, hasVideos, youtubeId, hasActivatedVideo]);

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
      // Prefer the locally-prefetched file: extracting the poster frame from it
      // is local disk I/O instead of a second network fetch/seek into the remote
      // video just to grab a frame.
      const thumbnailSource = getCachedVideo(videoUrls[0]) || videoUrls[0];
      console.log('[Thumbnail] Starting generation for:', thumbnailSource);
      generateVideoThumbnail(thumbnailSource).then(path => {
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
    setHasActivatedVideo(false); // new card → back to thumbnail-only until the user taps play
    setVideoDurationSec(0); setVideoCurrentTimeSec(0);
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
    setIsVideoPaused(prev => {
      const next = !prev;
      isManuallyPaused.current = next;
      if (!next) setHasActivatedVideo(true); // first play → mount the actual player
      return next;
    });
    showControlsTemporarily();
  }, []);

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewRef = useRef(({ viewableItems }) => { if (viewableItems.length > 0) setActiveSlide(viewableItems[0].index || 0); });

  const images = news.images && news.images.length > 0 ? news.images : (news.image ? [news.image] : []);
  const hasMultipleImages = images.length > 1;
  const hasImage = images.length > 0;
  const imageResizeMode = FastImage.resizeMode.cover;

  // Media box is always IMAGE_HEIGHT (40%) for BOTH image and video cards, so
  // every card's media is the same height and the headline below sits in the
  // same place as you swipe. Video fills this box via resizeMode="cover"
  // (matching how images fill their box) — no letterbox gap, no shrinking.
  const mediaHeight = IMAGE_HEIGHT;

  const onVideoReady = useCallback(() => { playerRef.current?.seekTo(0, true); setIsBuffering(false); setVideoReady(true); }, []);
  const onVideoLoad = useCallback((data) => {
    setVideoReady(true);
    setIsBuffering(false);
    if (data?.duration) setVideoDurationSec(data.duration);
  }, []);

  // Dragging the red duration line under the mute/fullscreen row: while
  // scrubbing we only move the fill visually and pause playback, then seek
  // the real player once the finger lifts (seeking every pixel is what
  // makes native scrubbers stutter). Before the video has ever been played
  // there's nothing to seek yet, so a drag there just starts playback.
  const scrubVideoToLocationX = (x) => {
    if (!seekBarWidth || !videoDurationSec) return;
    const clampedX = Math.max(0, Math.min(seekBarWidth, x));
    setVideoCurrentTimeSec((clampedX / seekBarWidth) * videoDurationSec);
  };

  // Recreated every render (not memoized in a ref) so its callbacks always
  // close over the current seekBarWidth/videoDurationSec/isVideoPaused — a
  // useRef-memoized PanResponder would freeze those at their first-render
  // values and the drag would never move anything.
  const seekPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (evt) => {
      if (!hasActivatedVideo) setHasActivatedVideo(true);
      wasPlayingBeforeScrub.current = !isVideoPaused;
      setIsVideoPaused(true);
      scrubVideoToLocationX(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => {
      scrubVideoToLocationX(evt.nativeEvent.locationX);
    },
    onPanResponderRelease: (evt) => {
      const clampedX = Math.max(0, Math.min(seekBarWidth, evt.nativeEvent.locationX));
      const target = seekBarWidth && videoDurationSec ? (clampedX / seekBarWidth) * videoDurationSec : videoCurrentTimeSec;
      setVideoCurrentTimeSec(target);
      videoRef.current?.seek(target);
      if (wasPlayingBeforeScrub.current) { setIsVideoPaused(false); isManuallyPaused.current = false; }
    },
  });
  const onPlayerError = useCallback(() => { setIsBuffering(false); }, []);

  const onYoutubeStateChange = useCallback((state) => {
    if (state === "playing") { setIsBuffering(false); setIsVideoPaused(false); setVideoReady(true); }
    else if (state === "paused" || state === "ended") { setIsVideoPaused(true); if (state === "ended") { isManuallyPaused.current = true; setShowControls(true); } }
    else if (state === "buffering") { setIsBuffering(true); }
  }, []);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < 300) { setFullScreenImage(true); setLastTap(0); }
    else { setLastTap(now); if (onPress) onPress(); }
  };

  const handleAdPress = () => {
    if (news.id) dispatch(trackAdClick(news.id)); if (news.redirectUrl) Linking.openURL(news.redirectUrl).catch(err => console.log(err));
  };
  const handleCommentsPress = () => { dispatch(getComments(news.id)); if (onCommentsPress) onCommentsPress(news); };

  const displayTitle = news.title || news.content?.te?.title || news.content?.title || '';
  const displayBody = news.body || news.description || news.content?.te?.body || news.content?.body || '';

  // --- VIEW SHOT SHARE FUNCTION (BASE64) ---
  const handleShareNews = async (target = 'generic') => {
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

      const shareFn = target === 'whatsapp' ? handleWhatsAppShare : handleShare;
      const shared = await shareFn(displayTitle, articleId, base64Data, imageUrl);
      console.log('[Share] ✅ ViewShot share completed | counted:', shared);
      // Only record a share once the user actually completed it (not on cancel).
      if (shared && articleId) dispatch(shareNews(articleId));
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
    switch (action) {
      case 'bookmark': dispatch(toggleBookmarkApi({ newsId: news.id, isCurrentlyBookmarked: isBookmarked })); break;
      case 'report': setReportModalVisible(true); break;
      case 'download': downloadImageToGallery(news.image || (news.images && news.images[0])); break;
    }
  };

  if (news.isAd) {
    const imageSource = news.image ? { uri: news.image, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable } : applogo;
    // Video ads: full-fill the card (explicit pixel size, like the news video) so
    // the box matches an image ad. Reuses the feed's react-native-video player —
    // cover fill, looping, no controls; mounts only while this is the active card
    // (unmounts off-screen for a clean replay on return). Autoplays WITH sound;
    // a single tap opens redirect_url.
    const isVideoAd = news.mediaType === 'video' && !!news.video;
    // Play the locally-prefetched file if it's ready (instant, no network buffer);
    // otherwise fall back to the remote URL. Prefetch happens ahead in FlipNewsScreen.
    const adVideoUri = getCachedVideo(news.video) || news.video;
    return (
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }} style={styles.card}>
        <Pressable onPress={handleAdPress} style={{ flex: 1 }}>
          {isVideoAd ? (
            <>
              {/* Poster behind the player so the card is never blank while the
                  Video is unmounted off-screen (and during its first load). */}
              <FastImage
                source={imageSource}
                style={StyleSheet.absoluteFillObject}
                resizeMode={imageResizeMode}
              />
              {/* Mount the player ONLY while this ad is the active, top-half card
                  — mirrors the news-video lifecycle (see the NEWS branch below).
                  Scrolling away unmounts it and releases the surface; scrolling
                  back remounts a fresh one, so it replays cleanly instead of
                  resuming a stale/garbled frame. key forces a clean remount per
                  source. Sizing/resizeMode left as-is (that's Issue 1). */}
              {isActive && !isBottomHalf && (
                <Video
                  key={news.video}
                  source={{ uri: adVideoUri }}
                  style={{ width: SCREEN_WIDTH, height: ACTUAL_HEIGHT }}
                  resizeMode="cover"
                  repeat={true}
                  // Autoplays WITH sound. rn-video v6 (Android) won't change audio
                  // after mount, so the player must be born unmuted to be audible;
                  // a single tap redirects (see overlay below).
                  muted={false}
                  volume={1.0}
                  paused={false}
                  playInBackground={false}
                  playWhenInactive={false}
                  controls={false}
                  // Start playing with minimal pre-buffer so the ad shows fast even
                  // when streamed remotely (local cached files ignore this anyway).
                  bufferConfig={{ minBufferMs: 2000, maxBufferMs: 8000, bufferForPlaybackMs: 800, bufferForPlaybackAfterRebufferMs: 1500, cacheSizeMB: 50 }}
                  onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
                  onLoad={() => setIsBuffering(false)}
                  onError={() => setIsBuffering(false)}
                />
              )}
              {/* Transparent tap overlay above the native video surface (which
                  otherwise swallows touches), so a tap anywhere on the video
                  redirects. */}
              <Pressable onPress={handleAdPress} style={styles.videoTouchOverlay} />
            </>
          ) : (
            <FastImage source={imageSource} style={[styles.image, { height: '100%', width: '100%' }]} resizeMode={imageResizeMode} onLoadStart={() => setIsBuffering(true)} onLoad={() => setIsBuffering(false)} onError={() => setIsBuffering(false)} />
          )}
          {isBuffering && (
            // Video ads: keep the poster visible (only a light dim + spinner) so the
            // ad image shows immediately instead of a black void while it loads.
            // Image ads: keep the opaque placeholder (there's nothing to show yet).
            <View style={isVideoAd ? styles.adSpinnerOverlay : styles.adPlaceholder}>
              <ActivityIndicator size="large" color="#CCCCCC" />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']} style={[styles.reporterGradient, { height: 120 }]} />
        </Pressable>
      </ViewShot>
    );
  }

  const renderImageItem = ({ item }) => (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
        {/* Shimmer behind the image (parity with the single-image branch) so a
            not-yet-decoded carousel frame shows a placeholder instead of black. */}
        <View style={StyleSheet.absoluteFill}><ShimmerLoader height={IMAGE_HEIGHT} borderRadius={0} /></View>
        <FastImage source={{ uri: item, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }} style={styles.image} resizeMode={imageResizeMode} />
      </View>
    </TouchableWithoutFeedback>
  );

  const isBookmarked = bookmarkIds?.includes(news.id);

  // Outer component handles ViewShot Base64 Capture
  return (
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, result: 'base64' }} style={styles.card}>
      <View style={[styles.imageSection, { height: mediaHeight }]}>

        {(hasVideos || youtubeId) ? (
          <View style={{ flex: 1, backgroundColor: '#000', width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <View style={{ width: SCREEN_WIDTH, height: mediaHeight }}>
              <View style={[StyleSheet.absoluteFillObject, youtubeId && styles.youtubePlayerLayer]}>

                {/* --- VIDEO LAYER ---
                    Mounted ONLY after the user starts playback (hasActivatedVideo).
                    Videos never autoplay, so a paused/just-arrived card no longer
                    mounts the native player and therefore never paints its black
                    surface — the poster below shows instantly instead. */}
                {isActive && !isBottomHalf && !screenshotMode && hasActivatedVideo && (
                  youtubeId ? (
                    <YoutubePlayer
                      ref={playerRef} key={youtubeId} height={YOUTUBE_PLAYER_HEIGHT} width={SCREEN_WIDTH} play={!isVideoPaused} videoId={youtubeId}
                      onChangeState={onYoutubeStateChange} onError={onPlayerError}
                      initialPlayerParams={{ autoplay: 1, controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0 }}
                      webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
                    />
                  ) : (
                    <Video
                      key={videoUrls[0]} ref={videoRef} source={videoSource} style={StyleSheet.absoluteFill} resizeMode="cover" repeat={true} paused={isVideoPaused || isVideoFullScreen} muted={isMuted} volume={1.0}
                      playInBackground={false} playWhenInactive={false} onBuffer={({ isBuffering: b }) => setIsBuffering(b)} onReadyForDisplay={onVideoReady} onLoad={onVideoLoad} controls={false}
                      onProgress={(data) => setVideoCurrentTimeSec(data.currentTime)}
                    />
                  )
                )}

                {/* --- POSTER / THUMBNAIL LAYER ---
                    Rendered AFTER the player so it sits ON TOP and hides the black
                    first-frame gap until the video reports ready (onReadyForDisplay /
                    onLoad / YouTube "playing"). Always visible while paused or not yet
                    activated, so the thumbnail is the very first thing drawn. Never the
                    Rapid News banner — a neutral dark shimmer fills in only when no
                    thumbnail exists yet (e.g. a pure video whose frame is still being
                    generated), so the banner→black→thumbnail sequence is gone. */}
                {((!isBottomHalf || screenshotMode) && (!hasActivatedVideo || !videoReady || screenshotMode)) && (
                  displayThumbnail ? (
                    <FastImage source={{ uri: displayThumbnail, priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable }} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]}>
                      <ShimmerLoader height={mediaHeight} borderRadius={0} />
                    </View>
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
                {/* Controls show only while the video rolls — paused/first-view
                    cards keep the bottom strip clear for the byline + logo. */}
                {isActive && !isBottomHalf && !youtubeId && isVideoPlaying && (
                  <View style={styles.videoControls}>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setIsMuted(m => !m); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.videoControlBtn}>
                      <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setIsVideoFullScreen(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.videoControlBtn}>
                      <Icon name="fullscreen" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
                {/* Red duration/seek line pinned to the very bottom edge of the
                    video. Shown as soon as the video has ever been played (not
                    just while actively rolling) so the duration stays visible
                    even if the user pauses again. Drag anywhere on it to scrub
                    backward/forward. */}
                {isActive && !isBottomHalf && !youtubeId && hasActivatedVideo && (
                  <View
                    style={styles.videoSeekBarHitArea}
                    onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                    {...seekPanResponder.panHandlers}>
                    <View style={styles.videoSeekBarTrack}>
                      <View
                        style={[
                          styles.videoSeekBarFill,
                          {
                            width: videoDurationSec
                              ? `${Math.min(100, (videoCurrentTimeSec / videoDurationSec) * 100)}%`
                              : 0,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        ) : hasMultipleImages ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <FlatList ref={flatListRef} data={images} renderItem={renderImageItem} keyExtractor={(item, index) => index.toString()} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewRef.current} viewabilityConfig={viewConfigRef.current} style={{ width: SCREEN_WIDTH, height: '100%' }} />
            <View style={styles.paginationContainer}>
              {images.map((_, i) => <View key={i} style={[styles.paginationDot, { backgroundColor: i === activeSlide ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]} />)}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableWithoutFeedback onPress={handleDoubleTap}>
              <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}>
                <View style={[StyleSheet.absoluteFill]}><ShimmerLoader height={IMAGE_HEIGHT} borderRadius={0} /></View>
                <FastImage source={hasImage ? { uri: images[0], priority: FastImage.priority.high, cache: FastImage.cacheControl.immutable } : applogo} style={styles.image} resizeMode={imageResizeMode} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
        {/* Bottom strip of the image. A reporter's story gets the byline on the
            left AND the RapidNews logo on the right; everything else keeps the
            plain bottom-left watermark. The backend returns reporter: null for
            editor/admin-authored stories (most of the feed), so those carry no
            attribution at all.
            While a video is actually playing the strip is hidden so the video
            controls own the bottom-right corner (see the videoControls block). */}
        {isVideoPlaying ? null : news.reporter?.name ? (
          <>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.bylineGradient}
              pointerEvents="none"
            />
            <Image source={applogo} style={styles.bylineLogo} pointerEvents="none" />
            <View style={styles.bylineRow} pointerEvents="none">
              {news.reporter.photo ? (
                <FastImage source={{ uri: news.reporter.photo }} style={styles.bylineAvatar} />
              ) : (
                <View style={[styles.bylineAvatar, styles.bylineAvatarFallback]}>
                  <Text style={styles.bylineInitial} allowFontScaling={false}>
                    {news.reporter.name.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.bylineText}>
                <Text style={styles.bylineName} numberOfLines={1} allowFontScaling={false}>
                  {news.reporter.name}
                </Text>
                <Text style={styles.bylineMeta} numberOfLines={1} allowFontScaling={false}>
                  {news.reporter.village ? `Reporter, ${news.reporter.village}` : 'Reporter'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Image source={applogo} style={styles.watermarkLogo} />
        )}
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

            {/* Requirement 16: tags are now tappable "#tag" chips - tapping
                one opens every other APPROVED article carrying that exact
                tag (see HomeScreen's openTagOverlay), the same overlay
                mechanism the viral posts rail already uses.
                Rendered whenever news.tags has content, regardless of
                onPressTag - the flip animation's transitional "back face"
                halves (FlipNewsScreen's nextBackStyle/prevBackStyle) mount
                a separate instance of this card, and any one of them missing
                the prop must not make the tags flash away and back during a
                swipe. Falls back to plain (non-tappable) text in that case. */}
            {Array.isArray(news.tags) && news.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {news.tags.map((tag, i) => {
                  // Some articles already have the tag stored with a leading
                  // "#" (e.g. "#trend"), others without (e.g. "sports") -
                  // strip any existing "#" before adding one, so it never
                  // renders doubled ("##trend").
                  const label = `#${String(tag).replace(/^#+/, '')}`;
                  return onPressTag ? (
                    <TouchableOpacity
                      key={`${tag}-${i}`}
                      onPress={() => onPressTag(tag)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    >
                      <Text style={styles.tagChipText} allowFontScaling={false}>{label}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text key={`${tag}-${i}`} style={styles.tagChipText} allowFontScaling={false}>{label}</Text>
                  );
                })}
              </View>
            )}

            <View style={styles.timestampRow}>
              <View style={styles.timestampContainer}>
                {/* Manual "Rapid Exclusive" badge (Requirement 20) takes top
                    priority in this slot, ahead of Top Story/Pinned/timestamp
                    — same reasoning as Top Story below, just one step more
                    deliberate an admin action. */}
                {news.is_rapid_exclusive ? (
                  <Text style={styles.timestamp} allowFontScaling={false}>Rapid Exclusive</Text>
                ) : news.is_top_story ? (
                  <Text style={styles.timestamp} allowFontScaling={false}>Top Story</Text>
                ) : news.isPinned ? (
                  <>
                    <Icon name="pin" size={14} color="#000000" />
                    <Text style={styles.pinnedInlineText} allowFontScaling={false}>Pinned article</Text>
                  </>
                ) : (
                  <>
                    <Icon name="clock-outline" size={14} color="#999" />
                    <Text style={styles.timestamp} allowFontScaling={false}>{news.timeAgo}</Text>
                  </>
                )}
              </View>
              {/* Manual "Trending" badge (Requirement 19) takes this slot's
                  place over the "N of M" swipe counter — same reasoning as
                  Top Story above. */}
              {news.is_trending ? (
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp} allowFontScaling={false}>Trending</Text>
                </View>
              ) : news.itemIndex && news.totalNews ? (
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp}>{news.itemIndex} of {news.totalNews}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableWithoutFeedback>

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
          style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}
        >
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon name={liked ? 'thumb-up' : 'thumb-up-outline'} size={20} color={liked ? '#4dabf5' : '#FFFFFF'} />
              <Text style={[styles.actionText, liked && { color: '#4dabf5' }]}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
              <Icon name={disliked ? 'thumb-down' : 'thumb-down-outline'} size={20} color={disliked ? '#F44336' : '#FFFFFF'} />
              <Text style={[styles.actionText, disliked && { color: '#F44336' }]}>{dislikeCount}</Text>
            </TouchableOpacity>

            {news.commentsEnabled !== false && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCommentsPress}>
                <Icon name="comment-processing-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionText}>{news?.comments?.count || news?.comments || 0}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionRight}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleShareNews('whatsapp')}>
              <Icon name="whatsapp" size={20} color="#25D366" />
              <Text style={styles.shareText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton} onPress={handleMenuPress}>
              <Icon name="dots-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => handleShareNews()}>
              <Icon name="share" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ReportModal visible={reportModalVisible} onClose={() => setReportModalVisible(false)} newsId={news.id} />

      <Modal visible={isVideoFullScreen} transparent={false} animationType="fade" statusBarTranslucent={true} onRequestClose={() => setIsVideoFullScreen(false)}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={[styles.closeButton, { top: Math.max(insets.top, 20) + 10 }]} onPress={() => setIsVideoFullScreen(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {videoSource && (
            <Video
              ref={fullScreenVideoRef}
              source={videoSource} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} resizeMode="contain" repeat={true} paused={isVideoPaused} muted={isMuted} volume={1.0} playInBackground={false} playWhenInactive={false} onBuffer={({ isBuffering: b }) => setIsBuffering(b)} controls={true}
              // The fullscreen player is a separate Video instance from the inline
              // one, so it always mounts at time 0 — resume from wherever the
              // inline player had gotten to instead of restarting the clip.
              onLoad={() => { if (videoCurrentTimeSec > 0) fullScreenVideoRef.current?.seek(videoCurrentTimeSec); }}
              onProgress={(data) => setVideoCurrentTimeSec(data.currentTime)}
            />
          )}
          <TouchableOpacity style={[styles.videoControlBtn, { position: 'absolute', bottom: 30, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 }]} onPress={() => setIsMuted(m => !m)}>
            <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
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
          <TouchableOpacity style={[styles.closeButton, { top: Math.max(insets.top, 20) + 15 }]} onPress={() => setFullScreenImage(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableWithoutFeedback onPress={() => setFullScreenImage(false)}>
            <FastImage source={hasImage ? { uri: images[activeSlide] || images[0] } : applogo} style={styles.fullScreenImage} resizeMode={FastImage.resizeMode.contain} />
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
  youtubePlayerLayer: { justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { flex: 1, width: '100%', backgroundColor: '#2C2C2C', paddingBottom: WIDE_TAB_BAR_CLEARANCE },
  image: { width: responsiveWidth(100), height: '100%', justifyContent: 'center', alignItems: 'center' },
  paginationContainer: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 15 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  watermarkLogo: { position: 'absolute', bottom: -10, left: 15, width: 120, height: 60, resizeMode: 'contain', zIndex: 100000, opacity: 0.9, borderRadius: 16 },
  adBadgeContainer: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  adBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  pinnedInlineText: { fontSize: responsiveFontSize(1.5), color: '#000000', fontWeight: '600' },
  adPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  adSpinnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  reporterGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  contentSection: { flex: 1, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, paddingHorizontal: 18, paddingTop: 0, paddingBottom: 10 },
  title: { fontFamily: fonts.medium, fontSize: responsiveFontSize(IS_WIDE_SCREEN ? 2.3 : 2.8), color: '#000000', lineHeight: responsiveFontSize(IS_WIDE_SCREEN ? 2.8 : 3.4), includeFontPadding: false, paddingTop: 8, paddingBottom: 3 },
  bodyContainer: { flex: 1, overflow: 'hidden' },
  body: { fontFamily: fonts.description, fontSize: responsiveFontSize(IS_WIDE_SCREEN ? 2.6 : 3.5), lineHeight: responsiveFontSize(IS_WIDE_SCREEN ? 2.9 : 3.5), color: '#555555', fontWeight: '400' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  tagChipText: { fontFamily: fonts.medium, fontSize: responsiveFontSize(IS_WIDE_SCREEN ? 2.0 : 2.4), color: '#2196F3' },
  // Byline sits ON the image, so it is white on a bottom gradient rather than
  // themed — same zIndex as the watermark it replaces, or the video layer covers it.
  bylineGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, zIndex: 99999 },
  // maxWidth leaves room for bylineLogo on the right — widen only if that goes.
  bylineRow: { position: 'absolute', left: 14, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: SCREEN_WIDTH * 0.6, zIndex: 100000 },
  bylineLogo: { position: 'absolute', right: 10, bottom: 10, width: 96, height: 44, resizeMode: 'contain', zIndex: 100000, opacity: 0.95 },
  bylineAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  bylineAvatarFallback: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  bylineInitial: { color: '#FFFFFF', fontSize: responsiveFontSize(1.7), fontWeight: '700' },
  bylineText: { flexShrink: 1 },
  bylineName: { fontSize: responsiveFontSize(1.7), color: '#FFFFFF', fontWeight: '700', flexShrink: 1 },
  bylineMeta: { fontSize: responsiveFontSize(1.35), color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  timestampRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  timestampContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timestamp: { fontSize: responsiveFontSize(1.5), color: '#999', fontWeight: '500' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 20, paddingHorizontal: 16 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIconButton: { padding: 4 },
  actionText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  shareText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', marginLeft: 2 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuContainer: { borderRadius: 12, width: '100%', maxWidth: 280, paddingVertical: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
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
  // bottom raised from 12 to 26 (was overlapping the new seek bar's hit area
  // pinned at the very bottom edge — see videoSeekBarHitArea below).
  videoControls: { position: 'absolute', bottom: 26, right: 12, flexDirection: 'row', gap: 8 },
  videoControlBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  videoSeekBarHitArea: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, justifyContent: 'flex-end' },
  videoSeekBarTrack: { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  videoSeekBarFill: { height: 3, backgroundColor: '#FF0000' },
});

export default Way2NewsCard;