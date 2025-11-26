import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {addBookmark, removeBookmark} from '../redux/reducers/bookmarks';
import {CARD_HEIGHT, SCREEN_WIDTH, CARD_PADDING} from '../utils/constants';

const NewsCard = ({news, index, scrollY, onPress, theme}) => {
  const dispatch = useDispatch();
  const bookmarks = useSelector(state => state.bookmarks.items);
  const isBookmarked = bookmarks.some(item => item.id === news.id);

  const inputRange = [
    (index - 1) * CARD_HEIGHT,
    index * CARD_HEIGHT,
    (index + 1) * CARD_HEIGHT,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP,
    );

    const rotateX = interpolate(
      scrollY.value,
      inputRange,
      [30, 0, -30],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [50, 0, -50],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        {scale},
        {perspective: 1000},
        {rotateX: `${rotateX}deg`},
        {translateY},
      ],
      opacity,
    };
  });

  const handleBookmark = () => {
    if (isBookmarked) {
      dispatch(removeBookmark(news.id));
    } else {
      dispatch(addBookmark(news));
    }
  };

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.card, {backgroundColor: theme.cardBackground}]}
        activeOpacity={0.95}
        onPress={onPress}>
        <Image source={{uri: news.image}} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <View style={styles.metaInfo}>
            <View
              style={[styles.categoryBadge, {backgroundColor: theme.primary}]}>
              <Text style={styles.categoryText}>
                {news.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.timeText, {color: theme.textSecondary}]}>
              {news.timeAgo}
            </Text>
          </View>

          <Text style={[styles.title, {color: theme.text}]} numberOfLines={3}>
            {news.title}
          </Text>
          <Text
            style={[styles.description, {color: theme.textSecondary}]}
            numberOfLines={3}>
            {news.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.locationContainer}>
              <Icon name="map-marker" size={16} color={theme.secondary} />
              <Text style={[styles.location, {color: theme.textSecondary}]}>
                {news.location}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleBookmark}
                style={styles.actionButton}>
                <Icon
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isBookmarked ? theme.primary : theme.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon
                  name="share-variant"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});

export default NewsCard;
