import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchViralMagazines } from '../redux/reducers/magazine';
import { lightTheme, darkTheme } from '../utils/colors';

// "Viral" rail of digital magazines. Tapping a card opens the full-bleed
// swipeable viewer.
const MagazineViralRail = ({ navigation }) => {
  const dispatch = useDispatch();
  const { viral, loadingViral } = useSelector((s) => s.magazine);
  const isDarkMode = useSelector((s) => s.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    dispatch(fetchViralMagazines());
  }, [dispatch]);

  if (!loadingViral && (!viral || viral.length === 0)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Icon name="fire" size={18} color="#fb923c" />
        <Text style={[styles.heading, { color: theme.textPrimary || '#fff' }]}>Viral</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {viral.map((m, idx) => {
          const cover = m.cards?.[0]?.image;
          return (
            <TouchableOpacity
              key={m._id || idx}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation?.navigate('MagazineViewer', { magazine: m })}
            >
              {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : <View style={[styles.cover, styles.placeholder]} />}
              <View style={styles.overlay}>
                <View style={styles.viralBadge}>
                  <Icon name="fire" size={11} color="#fff" />
                  <Text style={styles.viralBadgeText}>VIRAL</Text>
                </View>
                <Text style={styles.shares}>{m.shares || 0} shares</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginBottom: 10 },
  heading: { fontSize: 16, fontWeight: '700', marginLeft: 4 },
  scroll: { paddingHorizontal: 14, gap: 12 },
  card: { width: 130, height: 200, borderRadius: 12, overflow: 'hidden', marginRight: 12, backgroundColor: '#111' },
  cover: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#333' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 8 },
  viralBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: '#ea580c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  viralBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', marginLeft: 2 },
  shares: { color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 3 },
});

export default MagazineViralRail;
