import { useNavigation } from '@react-navigation/native';
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
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

const CategoriesModal = ({visible, onClose, onSelectCategory}) => {
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
  const scrollTimeout = useRef(null);

  // Cleaner color palette and balanced sizes
  const catStyles = [
    { bg: '#FF6B35', size: 'full' },
    { bg: '#6C5CE7', size: 'half' },
    { bg: '#00B894', size: 'half' },
    { bg: '#D63031', size: 'full' },
    { bg: '#0984E3', size: 'half' },
    { bg: '#E84393', size: 'half' },
  ];

  const getCategoryIcon = (nameEn) => {
    const name = nameEn?.toLowerCase() || '';
    if (name.includes('politics')) return 'gavel';
    if (name.includes('sports')) return 'cricket';
    if (name.includes('cinema') || name.includes('movie')) return 'movie';
    if (name.includes('job')) return 'briefcase-variant';
    if (name.includes('agriculture') || name.includes('panta')) return 'sprout';
    return 'newspaper-variant-outline';
  };

  const sidebarItems = [
    {id: 'news', icon: 'volume-high', label: 'న్యూస్'},
    {id: 'videos', icon: 'play-box-multiple', label: 'వీడియోస్'},
    {id: 'astrology', icon: 'om', label: 'జ్యోతిష్'},
    {id: 'stocks', icon: 'chart-line', label: 'స్టాక్స్'},
    {id: 'sports', icon: 'cricket', label: 'స్పోర్ట్స్'},
    {id: 'videos2', icon: 'video', label: 'వీడియోస్'},
    {id: 'settings', icon: 'cog', label: 'సెట్టింగ్స్'},
    {id: 'reporter', icon: 'microphone', label: 'రిపోర్టర్'},
  ];

  const closeModal = useCallback(() => {
    'worklet';
    runOnJS(Keyboard.dismiss)();
    translateY.value = withTiming(SHEET_HEIGHT, { 
      duration: 250, 
      easing: Easing.out(Easing.quad) 
    }, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)();
      }
    });
    opacity.value = withTiming(0, { duration: 250 });
  }, [onClose, translateY, opacity]);

  useEffect(() => {
    const handleBackPress = () => {
      if (visible) {
        closeModal();
        return true; 
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [visible, closeModal]);

  useEffect(() => {
    if (visible) {
      dispatch(getCategories());
      translateY.value = withSpring(0, { damping: 18, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      const offset = event.translationY;
      if (offset > 0) translateY.value = offset;
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    isScrollingToSection.current = true;
    const yOffset = sectionRefs.current[sectionId];
    if (scrollViewRef.current && yOffset !== undefined) {
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrollingToSection.current = false;
    }, 500);
  };

  const handleScroll = (event) => {
    if (isScrollingToSection.current) return;
    const { contentOffset } = event.nativeEvent;
    const scrollY = contentOffset.y;
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

  const handleSelection = (cat) => {
    runOnJS(closeModal)();
    if(onSelectCategory) setTimeout(() => onSelectCategory(cat), 100);
  };

  return (
    <GestureHandlerRootView 
      style={[styles.overlayWrapper, { zIndex: visible ? 999 : -1 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={styles.absoluteFill} activeOpacity={1} onPress={closeModal} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        <GestureDetector gesture={pan}>
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>
        </GestureDetector>

        <View style={styles.contentWrapper}>
          <View style={styles.sidebar}>
            {sidebarItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.sidebarItem, activeSection === item.id && styles.sidebarItemActive]}
                onPress={() => scrollToSection(item.id)}>
                <Icon name={item.icon} size={22} color={activeSection === item.id ? '#FF6B35' : '#888'} />
                <Text style={[styles.sidebarLabel, activeSection === item.id && styles.sidebarLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            
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

            <View style={styles.localNewsContainer} onLayout={(e) => sectionRefs.current['videos'] = e.nativeEvent.layout.y}>
              <Text style={styles.sectionTitle}>LOCAL NEWS</Text>
              <TouchableOpacity style={styles.locationCard} onPress={() => handleSelection('local')}>
                <View style={{flex: 1}}>
                  <Text style={styles.locationName}>BABA NAGAR</Text>
                  <Text style={styles.locationAddress} numberOfLines={2}>Rajamahendravaram Urban, East Godavari</Text>
                </View>
                <View style={styles.locationArrow}><Icon name="chevron-right" size={20} color="#666" /></View>
              </TouchableOpacity>
            </View>

            {loadingCategories ? (
              <ActivityIndicator color="#FF6B35" style={{marginVertical: 30}} />
            ) : (
              <View style={styles.categoryGrid} onLayout={(e) => sectionRefs.current['astrology'] = e.nativeEvent.layout.y}>
                {categories.map((cat, idx) => {
                  const design = catStyles[idx % catStyles.length];
                  const isFull = design.size === 'full';
                  
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      activeOpacity={0.85}
                      style={[
                        styles.catCard, 
                        { backgroundColor: design.bg, width: isFull ? '100%' : '48.5%' }
                      ]}
                      onPress={() => handleSelection(cat._id)}
                    >
                      <View style={isFull ? styles.fullCardInner : styles.halfCardInner}>
                        <View style={styles.iconCircle}>
                           <Icon name={getCategoryIcon(cat.name?.en)} size={isFull ? 24 : 20} color="#FFF" />
                        </View>
                        <View style={isFull ? {marginLeft: 12, flex: 1} : {marginTop: 10}}>
                          <Text style={styles.catLabelEn}>{cat.name?.en}</Text>
                          <Text style={styles.catLabelTe}>{cat.name?.te || cat.name?.en}</Text>
                        </View>
                        {isFull && <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.bottomSection} onLayout={(e) => sectionRefs.current['settings'] = e.nativeEvent.layout.y}>
               <Text style={styles.sectionTitle}>SETTINGS</Text>
              <TouchableOpacity style={styles.optionCard} onPress={() => { closeModal(); navigation.navigate('Settings'); }}>
                <Icon name="cog-outline" size={22} color="#333" />
                <Text style={styles.optionText}>సెట్టింగ్స్</Text>
                <Icon name="chevron-right" size={20} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.reporterSection} onLayout={(e) => sectionRefs.current['reporter'] = e.nativeEvent.layout.y}>
              <Text style={styles.sectionTitle}>REPORTER</Text>
              <TouchableOpacity style={styles.reporterCard} onPress={() => { closeModal(); navigation.navigate(reporterToken ? "ReporterApp" : "Reporter"); }}>
                <View style={styles.reporterIconWrap}>
                   <Icon name="microphone" size={22} color="#E91E63" />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.reporterTitle}>రిపోర్టర్ అవ్వండి</Text>
                  <Text style={styles.reporterSub}>వార్తలను రిపోర్ట్ చేయండి</Text>
                </View>
                <Icon name="chevron-right" size={22} color="#CCC" />
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
  sidebarItem: { alignItems: 'center', paddingVertical: 14, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  sidebarItemActive: { backgroundColor: 'rgba(255, 107, 53, 0.12)', borderLeftColor: '#FF6B35' },
  sidebarLabel: { fontSize: 10, fontWeight: '600', color: '#777', marginTop: 4, textAlign: 'center' },
  sidebarLabelActive: { color: '#FF6B35' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  section: { marginVertical: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#999', marginBottom: 10, letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 46, borderSize: 1, borderColor: '#EEE' },
  searchPlaceholder: { color: '#AAA', marginLeft: 8, fontSize: 14 },
  mainEditionCard: { backgroundColor: '#00BFFF', padding: 18, borderRadius: 16, marginBottom: 20 },
  mainEditionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
  mainEditionText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 2 },
  arrowButton: { position: 'absolute', right: 16, top: 22, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  localNewsContainer: { marginBottom: 20 },
  locationCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  locationName: { fontSize: 15, fontWeight: '700', color: '#333' },
  locationAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  locationArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F6F8', alignItems: 'center', justifyContent: 'center' },
  
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 25 },
  catCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  fullCardInner: { flexDirection: 'row', alignItems: 'center' },
  halfCardInner: { flexDirection: 'column', alignItems: 'flex-start' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  catLabelEn: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
  catLabelTe: { fontSize: 16, fontWeight: '800', color: '#FFF', marginTop: 1 },

  bottomSection: { marginBottom: 20 },
  optionCard: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14 },
  optionText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, marginLeft: 12 },
  reporterSection: { marginBottom: 20 },
  reporterCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  reporterIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  reporterTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  reporterSub: { fontSize: 12, color: '#888', marginTop: 1 },
});

export default CategoriesModal;