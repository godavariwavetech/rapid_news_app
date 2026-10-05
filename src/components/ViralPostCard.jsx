import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { shareMagazine } from '../redux/reducers/magazine';
import { handleShare, handleWhatsAppShare } from '../utils/FileHelpers';

const { width } = Dimensions.get('window');
const SWIPE_VELOCITY_THRESHOLD = 500;
// Matches the Way2News reference: a taller white toolbar than the old dark
// one, tall enough to stack [FAB straddling the top edge] > [share count] >
// [వైరల్ / SHARE row, anchored to the very bottom] without crowding.
const FOOTER_HEIGHT = 62;
const WHATSAPP_SIZE = 52;
// Sits in the gap between the row's top (~32, see footerBar's paddingBottom)
// and the FAB's bottom edge (FOOTER_HEIGHT - WHATSAPP_SIZE/2 = 52) — clear of
// both.
const SHARES_TEXT_BOTTOM = 20;

// Full-screen feed card for a VIRAL_POST item injected into the main scroll
// (see injectViralPostsIntoFeed on the backend). The post's cards are
// swipeable directly inline — horizontal drag, no tap needed.
//
// FlipNewsScreen renders the active card as TWO SEPARATE mounts — a top half
// and a bottom half (CardHalf) — that together compose one full-height card
// for its flip animation. A native FlatList's scroll position can't be
// shared between two separate mounts, so a drag starting in one half would
// only move that half in real time, leaving the other half showing the old
// slide until some later sync caught up ("half old image / half new image").
//
// `panX` fixes that at the root: it's a Reanimated SHARED VALUE, the same
// object handed to both halves by FlipNewsScreen. A mutation from either
// half's gesture handler is visible to both halves' useAnimatedStyle on the
// UI thread in the same frame, so both halves move in lockstep pixel-for-
// pixel DURING the drag, not just once it settles.
//
// `activeSlide`/`onSlideChange` remain the settled integer index (JS state,
// for the dot indicator + caption text, which don't need per-frame updates).
// Falls back to owning both locally when used without those props (e.g. a
// future non-split usage).
const ViralPostCard = ({ news, height, activeSlide: controlledSlide, onSlideChange, panX: sharedPanX, onPress, onPressViral }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const data = news?.data || news || {};
  const cards = data.cards?.length ? data.cards : [{ image: null, caption: null }];
  const lastIndex = cards.length - 1;
  const [shares, setShares] = useState(data.shares || 0);

  const localPanX = useSharedValue(0);
  const panX = sharedPanX || localPanX;
  const isControlled = controlledSlide != null;

  const [localSlide, setLocalSlide] = useState(0);
  const activeSlide = isControlled ? controlledSlide : localSlide;
  const activeCaption = cards[activeSlide]?.caption;
  const activeImage = cards[activeSlide]?.image;

  const dragStartX = useSharedValue(0);

  const recordShare = async () => {
    try {
      const res = await dispatch(shareMagazine(data._id)).unwrap();
      if (res?.data?.shares != null) setShares(res.data.shares);
    } catch (_) {
      // Non-fatal — the share itself already happened, only the count failed to update.
    }
  };

  const onWhatsAppPress = async () => {
    const shared = await handleWhatsAppShare(data.title, data._id, null, activeImage);
    if (shared) recordShare();
  };

  const onGenericSharePress = async () => {
    const shared = await handleShare(data.title, data._id, null, activeImage);
    if (shared) recordShare();
  };

  const commitSlide = (index) => {
    setLocalSlide(index);
    onSlideChange?.(index);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onStart(() => {
      dragStartX.value = panX.value;
    })
    .onUpdate((e) => {
      const next = dragStartX.value + e.translationX;
      // Rubber-band clamp past the ends instead of dragging into empty space.
      const min = -lastIndex * width;
      panX.value = Math.min(width * 0.3, Math.max(min - width * 0.3, next));
    })
    .onEnd((e) => {
      let target = Math.round(-panX.value / width);
      if (Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD) {
        target += e.velocityX < 0 ? 1 : -1;
      }
      target = Math.min(lastIndex, Math.max(0, target));
      panX.value = withTiming(-target * width, { duration: 220 });
      runOnJS(commitSlide)(target);
    });

  // A plain tap (no drag) toggles the app's header/bottom-tab-bar chrome —
  // same as tapping a normal news card. Without this, the outer feed's own
  // swipe gesture hides that chrome on the way IN to a viral card (it calls
  // hideUI() on every swipe, regardless of card type), and since nothing
  // here ever called the matching toggleUI(), it stayed hidden for as long
  // as a viral card was on screen — no way to bring it back.
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success && onPress) runOnJS(onPress)();
    });

  const composedGesture = Gesture.Race(pan, tap);

  // External change (reset to a new item, or the OTHER half's gesture
  // already committed a new index) -> animate this mount to match.
  useEffect(() => {
    if (!isControlled) return;
    panX.value = withTiming(-controlledSlide * width, { duration: 220 });
  }, [controlledSlide]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
  }));

  return (
    <View style={[styles.container, { height }]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.track, { width: width * cards.length, height }, trackStyle]}>
          {cards.map((card, i) => (
            <View key={i} style={[styles.slide, { width, height }]}>
              {card.image ? (
                <Image source={{ uri: card.image }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.placeholder]} />
              )}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {cards.length > 1 && (
        <View style={[styles.paginationContainer, { bottom: 196 + insets.bottom }]} pointerEvents="none">
          {cards.map((_, i) => (
            <View
              key={i}
              style={[styles.paginationDot, { backgroundColor: i === activeSlide ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}
            />
          ))}
        </View>
      )}

      {/* Scrim behind the title/caption and the WhatsApp FAB so both stay
          readable over any image, instead of floating unstyled on top of it. */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={[styles.bottomScrim, { height: 220 + insets.bottom }]}
        pointerEvents="none"
      />

      {/* Title is intentionally not shown here — it's an internal label for
          the dashboard only (see ViralPosts.jsx), not reader-facing content.
          Only the per-card caption, if any, is shown in the app. */}
      {activeCaption && (
        <View style={[styles.textOverlay, { bottom: 140 + insets.bottom }]} pointerEvents="none">
          <Text style={styles.caption} numberOfLines={2} allowFontScaling={false}>
            {activeCaption}
          </Text>
        </View>
      )}

      {/* Extra bottom padding keeps the bar's content above the on-screen
          nav bar (3-button Android nav) instead of it drawing over the
          text, same fix as Way2NewsCard's actionBar. Solid white, matching
          the Way2News reference — the footer is a fixed toolbar, not part
          of the image, so it doesn't fade with the scrim above it. */}
      <View style={[styles.footerBar, { height: FOOTER_HEIGHT + insets.bottom, paddingBottom: 12 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.viralLabel}
          onPress={onPressViral}
          activeOpacity={0.7}
          disabled={!onPressViral}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 24 }}
        >
          <Text style={styles.viralLabelText} allowFontScaling={false}>వైరల్</Text>
          <Icon name="chevron-double-right" size={16} color="#000000" />
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.shareButton} onPress={onGenericSharePress} activeOpacity={0.8}>
            <Icon name="share-variant" size={18} color="#2196F3" />
            <Text style={styles.shareButtonText} allowFontScaling={false}>SHARE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WhatsApp button + share count, straddling the footer bar's top edge
          exactly like the reference — half over the image, half over the
          white bar. Two independent siblings (not a stacked column) so each
          one's own `bottom` places it precisely: the FAB's bottom edge is
          set so its CENTER lands exactly on the bar's top edge, and the text
          sits just under that, still inside the white bar. Both rendered
          AFTER footerBar so they draw on top of it. */}
      <TouchableOpacity
        style={[styles.whatsappFab, { bottom: FOOTER_HEIGHT - WHATSAPP_SIZE / 2 + insets.bottom }]}
        onPress={onWhatsAppPress}
        activeOpacity={0.85}
      >
        <Icon name="whatsapp" size={30} color="#fff" />
      </TouchableOpacity>
      {/* Sits in the gap between the FAB and the icon row below, which is
          itself anchored to the very bottom of the (now taller) bar. */}
      <Text style={[styles.sharesText, { bottom: SHARES_TEXT_BOTTOM + insets.bottom }]} allowFontScaling={false}>
        {shares} SHARES
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width, backgroundColor: '#000', overflow: 'hidden' },
  track: { flexDirection: 'row' },
  slide: { backgroundColor: '#000' },
  image: { ...StyleSheet.absoluteFillObject },
  placeholder: { backgroundColor: '#1a1a1a' },
  // Sits just above the title block (textOverlay starts at bottom: 140)
  // instead of the top, where it had nothing to do with the rest of the
  // card's bottom-anchored controls.
  paginationContainer: {
    position: 'absolute',
    bottom: 196,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: { width: 8, height: 8, borderRadius: 4 },
  // Covers the title, the WhatsApp FAB and the footer bar so all three read
  // clearly over any image instead of relying on per-element backgrounds.
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  // Sits clearly above the WhatsApp FAB (bottom 76 + height 52 = 128 from
  // the bottom) rather than sharing its row, which was reading as a stray
  // label floating next to the button instead of a title.
  textOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    paddingHorizontal: 18,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  whatsappFab: {
    position: 'absolute',
    alignSelf: 'center',
    width: WHATSAPP_SIZE,
    height: WHATSAPP_SIZE,
    borderRadius: WHATSAPP_SIZE / 2,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
    backgroundColor: '#fff',
    flexDirection: 'row',
    // flex-end, not center: the bar is taller than one icon row now (room
    // for the FAB + share count above it), so the వైరల్/dots/SHARE row must
    // anchor to the bottom edge instead of centering across the full height.
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  viralLabel: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viralLabelText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  // Dark-on-white now that the bar is solid white, not a dark scrim.
  sharesText: { position: 'absolute', alignSelf: 'center', color: '#475569', fontSize: 12, fontWeight: '600' },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shareButtonText: { color: '#2196F3', fontSize: 13, fontWeight: '700' },
});

export default ViralPostCard;
