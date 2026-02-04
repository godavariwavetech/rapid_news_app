import { useNavigation } from '@react-navigation/native';
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Keyboard,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import { getCategories } from '../redux/reducers/news';

const {width, height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const CategoriesModal = ({visible, onClose, onSelectCategory, selectedCategory}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {reporterToken} = useSelector((state) => state.auth);
  const {categories, loadingCategories} = useSelector((state) => state.news);
  
  const [activeSection, setActiveSection] = useState('news');
  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingToSection = useRef(false);

  const catStyles = [
    { bg: '#FF6B35', size: 'full' },
    { bg: '#6C5CE7', size: 'half' },
    { bg: '#00B894', size: 'half' },
    { bg: '#D63031', size: 'full' },
    { bg: '#0984E3', size: 'half' },
    { bg: '#E84393', size: 'half' },
  ];

  const sidebarItems = [
    {id: 'news', icon: 'volume-high', label: 'న్యూస్'},
    {id: 'videos', icon: 'play-box-multiple', label: 'వీడియోస్'},
    {id: 'astrology', icon: 'om', label: 'జ్యోతిష్'},
    {id: 'stocks', icon: 'chart-line', label: 'స్టాక్స్'},
    {id: 'sports', icon: 'cricket', label: 'స్పోర్ట్స్'},
    {id: 'settings', icon: 'cog', label: 'సెట్టింగ్స్'},
    {id: 'reporter', icon: 'microphone', label: 'రిపోర్టర్'},
  ];

  const getCategoryIcon = (nameEn) => {
    const name = nameEn?.toLowerCase() || '';
    if (name.includes('politics')) return 'gavel';
    if (name.includes('sports')) return 'cricket';
    if (name.includes('cinema')) return 'movie';
    if (name.includes('job')) return 'briefcase-variant';
    if (name.includes('panta')) return 'sprout';
    return 'newspaper-variant-outline';
  };

  const closeModal = useCallback(() => {
    'worklet';
    runOnJS(Keyboard.dismiss)();
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, (finished) => {
      if (finished && onClose) runOnJS(onClose)();
    });
    opacity.value = withTiming(0, { duration: 250 });
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      dispatch(getCategories());
      translateY.value = withSpring(0, { damping: 18, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, dispatch]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) runOnJS(closeModal)();
      else translateY.value = withSpring(0);
    });

  const handleSelection = (catId) => {
    runOnJS(closeModal)();
    if(onSelectCategory) setTimeout(() => onSelectCategory(catId), 150);
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    isScrollingToSection.current = true;
    const yOffset = sectionRefs.current[sectionId];
    if (scrollViewRef.current && yOffset !== undefined) {
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    }
    setTimeout(() => { isScrollingToSection.current = false; }, 500);
  };

  const handleScroll = (event) => {
    if (isScrollingToSection.current) return;
    const scrollY = event.nativeEvent.contentOffset.y;
    const sections = Object.entries(sectionRefs.current).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < sections.length; i++) {
      const [id, offset] = sections[i];
      const nextOffset = sections[i + 1] ? sections[i + 1][1] : Infinity;
      if (scrollY >= offset - 150 && scrollY < nextOffset - 150) {
        if (activeSection !== id) setActiveSection(id);
        break;
      }
    }
  };

  if (!visible && opacity.value === 0) return null;

  return (
    <GestureHandlerRootView style={[styles.overlayWrapper, { zIndex: visible ? 999 : -1 }]}>
      <Animated.View style={[styles.backdrop, { opacity: opacity.value }]}>
        <TouchableOpacity style={styles.absoluteFill} activeOpacity={1} onPress={closeModal} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: translateY.value }] }]}>
        <GestureDetector gesture={pan}>
          <View style={styles.handleBarContainer}><View style={styles.handleBar} /></View>
        </GestureDetector>

        <View style={styles.contentWrapper}>
          <View style={styles.sidebar}>
            {sidebarItems.map(item => (
              <TouchableOpacity key={item.id} style={[styles.sidebarItem, activeSection === item.id && styles.sidebarItemActive]} onPress={() => scrollToSection(item.id)}>
                <Icon name={item.icon} size={22} color={activeSection === item.id ? '#FF6B35' : '#888'} />
                <Text style={[styles.sidebarLabel, activeSection === item.id && styles.sidebarLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView ref={scrollViewRef} style={styles.scrollView} onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section} onLayout={(e) => sectionRefs.current['news'] = e.nativeEvent.layout.y}>
              <TouchableOpacity style={styles.searchContainer} onPress={() => { closeModal(); navigation.navigate('Search'); }}>
                <Icon name="magnify" size={20} color="#999" />
                <Text style={styles.searchPlaceholder}>సెర్చ్ చేయండి</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.mainEditionCard} onPress={() => handleSelection('all')}>
              <Text style={styles.mainEditionLabel}>Main Edition</Text>
              <Text style={styles.mainEditionText}>మెయిన్ ఎడిషన్</Text>
              <View style={styles.arrowButton}><Icon name="chevron-right" size={24} color="#FFF" /></View>
            </TouchableOpacity>

            <View style={styles.section} onLayout={(e) => sectionRefs.current['videos'] = e.nativeEvent.layout.y}>
              <Text style={styles.sectionTitle}>వర్గాలు</Text>
              {loadingCategories ? <ActivityIndicator color="#FF6B35" /> : (
                <View style={styles.categoryGrid}>
                  {categories.map((cat, idx) => {
                    const design = catStyles[idx % catStyles.length];
                    const isFull = design.size === 'full';
                    return (
                      <TouchableOpacity key={cat._id} style={[styles.catCard, { backgroundColor: design.bg, width: isFull ? '100%' : '48.5%' }]} onPress={() => handleSelection(cat._id)}>
                        <View style={isFull ? styles.fullCardInner : styles.halfCardInner}>
                          <View style={styles.iconCircle}><Icon name={getCategoryIcon(cat.name?.en)} size={isFull ? 24 : 20} color="#FFF" /></View>
                          <View style={isFull ? {marginLeft: 12, flex: 1} : {marginTop: 10}}>
                            <Text style={styles.catLabelEn}>{cat.name?.en}</Text>
                            <Text style={styles.catLabelTe}>{cat.name?.te || cat.name?.en}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.bottomSection} onLayout={(e) => sectionRefs.current['settings'] = e.nativeEvent.layout.y}>
              <TouchableOpacity style={styles.optionCard} onPress={() => { closeModal(); navigation.navigate('Settings'); }}>
                <Icon name="cog-outline" size={22} color="#333" /><Text style={styles.optionText}>సెట్టింగ్స్</Text><Icon name="chevron-right" size={20} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.section} onLayout={(e) => sectionRefs.current['reporter'] = e.nativeEvent.layout.y}>
              <TouchableOpacity style={styles.reporterCard} onPress={() => { closeModal(); navigation.navigate(reporterToken ? "ReporterApp" : "Reporter"); }}>
                <View style={styles.reporterIconWrap}><Icon name="microphone" size={22} color="#E91E63" /></View>
                <View style={{flex: 1, marginLeft: 12}}><Text style={styles.reporterTitle}>రిపోర్టర్ అవ్వండి</Text></View>
              </TouchableOpacity>
            </View>
            <View style={{height: 150}} />
          </ScrollView>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: { ...StyleSheet.absoluteFillObject },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  absoluteFill: { width: '100%', height: '100%' },
  sheetContainer: { position: 'absolute', bottom: 0, width: width, height: SHEET_HEIGHT, backgroundColor: '#F8F9FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 25 },
  handleBarContainer: { width: '100%', alignItems: 'center', paddingVertical: 14 },
  handleBar: { width: 36, height: 4, backgroundColor: '#DDD', borderRadius: 2 },
  contentWrapper: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 75, backgroundColor: '#1C1C1E', paddingVertical: 10 },
  sidebarItem: { alignItems: 'center', paddingVertical: 14 },
  sidebarItemActive: { backgroundColor: 'rgba(255, 107, 53, 0.12)', borderLeftWidth: 3, borderLeftColor: '#FF6B35' },
  sidebarLabel: { fontSize: 10, color: '#777', marginTop: 4, textAlign: 'center' },
  sidebarLabelActive: { color: '#FF6B35' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  section: { marginVertical: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#999', marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchPlaceholder: { color: '#AAA', marginLeft: 8, fontSize: 14 },
  mainEditionCard: { backgroundColor: '#00BFFF', padding: 18, borderRadius: 16, marginBottom: 20 },
  mainEditionLabel: { fontSize: 11, color: '#FFF' },
  mainEditionText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  arrowButton: { position: 'absolute', right: 16, top: 22, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  catCard: { borderRadius: 16, padding: 16 },
  fullCardInner: { flexDirection: 'row', alignItems: 'center' },
  halfCardInner: { flexDirection: 'column' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  catLabelEn: { fontSize: 11, color: '#FFF', opacity: 0.8 },
  catLabelTe: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  optionCard: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14 },
  optionText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, marginLeft: 12 },
  reporterCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  reporterIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  reporterTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
});

export default CategoriesModal;