import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import { shareMagazine } from '../redux/reducers/magazine';

const { width, height } = Dimensions.get('window');

// Full-bleed, horizontally-swipeable magazine viewer (status/story style).
// Each card fills the screen; dots indicate position; WhatsApp/native share
// records a share on completion.
const MagazineViewerScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const magazine = route?.params?.magazine || { cards: [] };
  const cards = magazine.cards || [];

  const [index, setIndex] = useState(0);
  const [shares, setShares] = useState(magazine.shares || 0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length > 0) setIndex(viewableItems[0].index || 0);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleShare = useCallback(async () => {
    const current = cards[index];
    try {
      await Share.open({
        title: magazine.title || 'Magazine',
        message: magazine.title || '',
        url: current?.image,
      });
      // Only count once the share sheet completes successfully.
      const res = await dispatch(shareMagazine(magazine._id)).unwrap();
      if (res?.data?.shares != null) setShares(res.data.shares);
    } catch (e) {
      // User cancelled the share sheet — do nothing.
    }
  }, [cards, index, magazine, dispatch]);

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      {item.caption ? (
        <View style={styles.captionWrap}>
          <Text style={styles.caption}>{item.caption}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <FlatList
        data={cards}
        keyExtractor={(_, i) => `card-${i}`}
        renderItem={renderCard}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Dot indicator */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Bottom bar: Viral entry + share count + share */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.viralBtn} onPress={() => navigation.goBack()}>
          <Icon name="fire" size={18} color="#fb923c" />
          <Text style={styles.viralText}>Viral</Text>
        </TouchableOpacity>

        <Text style={styles.shareCount}>{shares} SHARES</Text>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Icon name="whatsapp" size={20} color="#fff" />
          <Text style={styles.shareText}>SHARE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  card: { width, height },
  image: { width, height },
  captionWrap: {
    position: 'absolute',
    bottom: height * 0.18,
    left: 24,
    right: 24,
  },
  caption: {
    color: '#fde68a',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dots: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  viralBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viralText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  shareCount: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  shareText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
});

export default MagazineViewerScreen;
