import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import {generateVideoThumbnail} from '../utils/FileHelpers';

const {width} = Dimensions.get('window');

const VideoCard = ({video, onPress}) => {
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [thumbnail, setThumbnail] = useState(video.thumbnail);

  useEffect(() => {
    if (!video.thumbnail && video.url) {
      generateVideoThumbnail(video.url).then(path => {
        if (path) setThumbnail(path);
      });
    }
  }, [video.thumbnail, video.url]);

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: theme.cardBackground}]}
      onPress={onPress}
      activeOpacity={0.9}>
      <View style={styles.thumbnailContainer}>
        {thumbnail ? (
          <Image source={{uri: thumbnail}} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, {backgroundColor: '#333', justifyContent: 'center', alignItems: 'center'}]}>
             <Icon name="video" size={50} color="#666" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        <View style={styles.playButton}>
          <Icon name="play-circle" size={50} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, {color: theme.text}]} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.metaInfo}>
          <Icon name="eye-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.views, {color: theme.textSecondary}]}>
            {video.views} views
          </Text>
          <View
            style={[styles.categoryBadge, {backgroundColor: theme.secondary}]}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  views: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default VideoCard;
