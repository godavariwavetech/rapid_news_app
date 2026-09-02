import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { generateVideoThumbnail } from '../utils/FileHelpers';

const { width } = Dimensions.get('window');

const NewsDetailModal = ({ visible, newsItem, onClose }) => {
  if (!newsItem) return null;

  const [videoPaused, setVideoPaused] = useState(true);
  // The player isn't mounted until this flips true (see the tap handler below) —
  // react-native-video starts loading/buffering as soon as it's mounted, even
  // while paused, so mounting it eagerly meant the video started downloading the
  // instant the modal opened instead of waiting for the user to tap play.
  const [videoActivated, setVideoActivated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbnail, setThumbnail] = useState(newsItem.thumbnail);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [seekBarWidth, setSeekBarWidth] = useState(0);
  const imageScrollRef = useRef(null);
  const videoRef = useRef(null);
  const wasPlayingBeforeScrub = useRef(false);

  const hasVideo = newsItem.videos && newsItem.videos.length > 0;
  const videoUri = hasVideo ? newsItem.videos[0] : null;

  useEffect(() => {
    if (hasVideo && !newsItem.thumbnail && videoUri) {
      generateVideoThumbnail(videoUri).then(path => {
        if (path) setThumbnail(path);
      });
    }
  }, [hasVideo, newsItem.thumbnail, videoUri]);
  const allImages = newsItem.images || [];
  const title = newsItem.content?.te?.title || newsItem.content?.en?.title || newsItem.content?.title || '';
  const body = newsItem.content?.te?.body || newsItem.content?.en?.body || newsItem.content?.body || '';

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleClose = () => {
    setVideoPaused(true);
    setActiveIndex(0);
    setVideoDuration(0);
    setVideoCurrentTime(0);
    onClose();
  };

  const formatPlaybackTime = (seconds) => {
    if (!seconds || !isFinite(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Dragging the red duration line: while scrubbing we only move the fill
  // visually (setVideoCurrentTime) and pause playback, then seek the actual
  // player once the finger lifts — seeking on every pixel of movement is
  // what makes native scrubbers stutter. Before the video is activated there
  // is nothing to seek yet, so a drag there just starts playback instead.
  const scrubToLocationX = (x) => {
    if (!seekBarWidth || !videoDuration) return;
    const clampedX = Math.max(0, Math.min(seekBarWidth, x));
    setVideoCurrentTime((clampedX / seekBarWidth) * videoDuration);
  };

  // Recreated every render (not memoized in a ref) so its callbacks always
  // close over the current seekBarWidth/videoDuration/videoPaused — a
  // useRef-memoized PanResponder would freeze those at their first-render
  // values (seekBarWidth stuck at 0) and the drag would never move anything.
  const seekPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (evt) => {
      if (!videoActivated) setVideoActivated(true);
      wasPlayingBeforeScrub.current = !videoPaused;
      setVideoPaused(true);
      scrubToLocationX(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => {
      scrubToLocationX(evt.nativeEvent.locationX);
    },
    onPanResponderRelease: (evt) => {
      const clampedX = Math.max(0, Math.min(seekBarWidth, evt.nativeEvent.locationX));
      const target = seekBarWidth && videoDuration ? (clampedX / seekBarWidth) * videoDuration : videoCurrentTime;
      setVideoCurrentTime(target);
      videoRef.current?.seek(target);
      if (wasPlayingBeforeScrub.current) setVideoPaused(false);
    },
  });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#FF9D00';
      case 'APPROVED': return '#28A745';
      case 'REJECTED': return '#DC3545';
      default: return '#C2C2C2';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'పరిశీలనలో ఉంది';
      case 'APPROVED': return 'ఆమోదించబడింది';
      case 'REJECTED': return 'తిరస్కరించబడింది';
      default: return status;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with Close Button */}
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>వార్త వివరాలు</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Media: video takes priority, then image pager */}
            <View style={styles.mediaContainer}>
              {hasVideo ? (
                <>
                  <TouchableOpacity
                    activeOpacity={1}
                    style={styles.videoWrapper}
                    onPress={() => {
                      if (!videoActivated) setVideoActivated(true);
                      setVideoPaused(p => !p);
                    }}>
                    {videoActivated ? (
                      <Video
                        ref={videoRef}
                        source={{ uri: videoUri }}
                        style={styles.fullMedia}
                        resizeMode="cover"
                        paused={videoPaused}
                        repeat={false}
                        onEnd={() => setVideoPaused(true)}
                        onLoad={(data) => setVideoDuration(data.duration)}
                        onProgress={(data) => setVideoCurrentTime(data.currentTime)}
                      />
                    ) : thumbnail ? (
                      <Image source={{ uri: thumbnail }} style={styles.fullMedia} resizeMode="cover" />
                    ) : (
                      <View style={[styles.fullMedia, styles.placeholderImage]}>
                        <Icon name="video" size={40} color="#C2C2C2" />
                      </View>
                    )}
                    {videoPaused && (
                      <View style={styles.playOverlay}>
                        <Icon name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
                      </View>
                    )}
                  </TouchableOpacity>
                  {/* Red duration/seek line, directly under the video (matches the
                      reference: not overlaid on the picture). Shown immediately —
                      even before the video has been played — so the duration is
                      visible on screen right away. Reads 00:00/--:-- until the
                      player actually mounts and reports its real length; dragging
                      before that point just starts playback. */}
                  <View
                    style={styles.seekBarHitArea}
                    onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                    {...seekPanResponder.panHandlers}>
                    <View style={styles.seekBarTrack}>
                      <View
                        style={[
                          styles.seekBarFill,
                          {
                            width: videoDuration
                              ? `${Math.min(100, (videoCurrentTime / videoDuration) * 100)}%`
                              : 0,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.durationText}>
                      {formatPlaybackTime(videoCurrentTime)} / {videoDuration ? formatPlaybackTime(videoDuration) : '--:--'}
                    </Text>
                  </View>
                </>
              ) : allImages.length > 0 ? (
                <>
                  <ScrollView
                    ref={imageScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    style={styles.imagePager}>
                    {allImages.map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={styles.fullMedia}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                  {allImages.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {allImages.map((_, i) => (
                        <View
                          key={i}
                          style={[styles.dot, i === activeIndex && styles.dotActive]}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.fullMedia, styles.placeholderImage]}>
                  <Icon name="image-off" size={40} color="#C2C2C2" />
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Meta Info Row */}
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(newsItem.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(newsItem.status)}</Text>
              </View>
              <Text style={styles.dateText}>{formatTime(newsItem.createdAt)}</Text>
            </View>

            {/* Why an editor rejected it. Absent for anything rejected before
                the reason field existed, so render only when there is one. */}
            {newsItem.status?.toUpperCase() === 'REJECTED' && newsItem.rejection_reason ? (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>తిరస్కరణ కారణం</Text>
                <Text style={styles.rejectionText}>{newsItem.rejection_reason}</Text>
              </View>
            ) : null}

            {/* Full Body */}
            <View style={styles.bodyContainer}>
              <Text style={styles.bodyText}>{body}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  mediaContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  imagePager: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    width: '100%',
    height: 250,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  seekBarHitArea: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#000',
  },
  seekBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  seekBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF0000',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  fullMedia: {
    width,
    height: 250,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    padding: 16,
    paddingBottom: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#666',
    fontSize: 13,
  },
  rejectionBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
  },
  rejectionLabel: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  rejectionText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyContainer: {
    padding: 16,
    paddingTop: 0,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default NewsDetailModal;
