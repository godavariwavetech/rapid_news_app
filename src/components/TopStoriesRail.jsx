import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchTopStories } from '../redux/reducers/topStories';
import { trackAdClick } from '../redux/reducers/news';
import { lightTheme, darkTheme } from '../utils/colors';

// Label shown on each card — mirrors way2news' "Most Liked Story" /
// "Top Commented Story" tags. The qualifying metric comes from the backend.
const METRIC_LABELS = {
  most_viewed: 'Most Viewed',
  most_liked: 'Most Liked Story',
  top_commented: 'Top Commented Story',
};

const StoryCard = ({ data, theme, onPress }) => {
  const tag = METRIC_LABELS[data.top_story?.metric] || 'Top Story';
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground || '#1e1e1e' }]}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(data)}
    >
      {data.images?.[0] ? (
        <Image source={{ uri: data.images[0] }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.cardBody}>
        <View style={styles.tagRow}>
          <Icon name="thumb-up-outline" size={12} color="#22c55e" />
          <Text style={styles.metricTag} numberOfLines={1}>{tag}</Text>
        </View>
        <Text style={[styles.title, { color: theme.textPrimary || '#fff' }]} numberOfLines={3}>
          {data.content?.title || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AdCard = ({ data, onPress }) => (
  <TouchableOpacity style={styles.adCard} activeOpacity={0.9} onPress={() => onPress(data)}>
    {data.media_type === 'video' && data.video ? (
      // Muted, looping mini-video. The rail holds few items so the cost is
      // capped; tap opens the redirect like an image ad.
      <Video
        source={{ uri: data.video }}
        style={styles.adImage}
        resizeMode="cover"
        repeat
        muted
        paused={false}
        controls={false}
        playInBackground={false}
        playWhenInactive={false}
      />
    ) : data.image ? (
      <Image source={{ uri: data.image }} style={styles.adImage} />
    ) : null}
    <Text style={styles.adLabel}>{data.label || 'Sponsored'}</Text>
  </TouchableOpacity>
);

const TopStoriesRail = ({ onPressStory }) => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.topStories);
  const isDarkMode = useSelector((s) => s.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    dispatch(fetchTopStories());
  }, [dispatch]);

  const handleAdPress = (ad) => {
    if (ad?._id) dispatch(trackAdClick(ad._id));
    if (ad?.redirect_url) Linking.openURL(ad.redirect_url).catch(() => {});
  };

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.textPrimary || '#fff' }]}>Top Stories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, idx) => {
          if (item.type === 'AD') {
            return <AdCard key={`ad-${item.data?._id || idx}`} data={item.data} onPress={handleAdPress} />;
          }
          return (
            <StoryCard
              key={`ts-${item.data?._id || idx}`}
              data={item.data}
              theme={theme}
              onPress={onPressStory}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  card: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumb: {
    width: '100%',
    height: 120,
  },
  thumbPlaceholder: {
    backgroundColor: '#333',
  },
  cardBody: {
    padding: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metricTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  adCard: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#000',
  },
  adImage: {
    width: '100%',
    height: 150,
  },
  adLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
});

export default TopStoriesRail;
