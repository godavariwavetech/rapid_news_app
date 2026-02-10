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
  const {reporterToken} = useSelector((state)=>state.auth);
  const {categories} = useSelector((state) => state.news);

  const [activeSection, setActiveSection] = useState('news');
  
  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingToSection = useRef(false);
  const scrollTimeout = useRef(null);

  // Simplified Sidebar: Only items actually used in the ScrollView sections
  const sidebarItems = [
    {id: 'news', icon: 'volume-high', label: 'న్యూస్'},
    {id: 'categories', icon: 'apps', label: 'వర్గాలు'},
    {id: 'reporter', icon: 'microphone', label: 'రిపోర్టర్'},
  ];

  const cardColors = ['#FF6B35', '#6C5CE7', '#00B894', '#D63031', '#0984E3', '#E84393', '#F0932B', '#2C3E50'];

  const getCategoryIcon = (nameEn) => {
    const name = nameEn?.toLowerCase() || '';
    if (name.includes('politics')) return 'gavel';
    if (name.includes('sports')) return 'cricket';
    if (name.includes('cinema') || name.includes('movie')) return 'movie';
    if (name.includes('business')) return 'briefcase';
    if (name.includes('job')) return 'briefcase-variant';
    if (name.includes('panta') || name.includes('agriculture')) return 'sprout';
    return 'newspaper-variant-outline';
  };

  const closeModal = useCallback(() => {
    'worklet';
    Keyboard.dismiss();
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
      translateY.value = withSpring(0, { damping: 15, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      if (translateY.value < SHEET_HEIGHT) {
        closeModal();
      }
    }
  }, [visible, closeModal]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      'worklet';
      const offset = event.translationY;
      if (offset > 0) {
        translateY.value = offset;
      } else {
        translateY.value = offset * 0.1;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > 150 || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
          if (finished && onClose) {
            runOnJS(onClose)();
          }
        });
        opacity.value = withTiming(0, { duration: 200 });
      } else {
        translateY.value = withSpring(0, { damping: 15, stiffness: 90 });
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

    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollY = contentOffset.y;

    const isCloseToBottom = layoutMeasurement.height + scrollY >= contentSize.height - 50;
    if (isCloseToBottom) {
      const lastItemId = sidebarItems[sidebarItems.length - 1].id;
      if (activeSection !== lastItemId) {
        setActiveSection(lastItemId);
      }
      return;
    }

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

  const handleReporterNavigation = () => {
    closeModal();
    setTimeout(() => navigation.navigate(reporterToken ? "ReporterApp" : "Reporter"), 100);
  };

  const handleSearchNavigation = () => {
    closeModal();
    setTimeout(() => navigation.navigate('Search'), 100);
  };

  const handleSelection = (cat) => {
    closeModal();
    if(onSelectCategory) setTimeout(() => onSelectCategory(cat), 50);
  };

  // Split categories for clean dynamic grid
  const quickAccessItems = categories.slice(0, 3);
  const remainingItems = categories.slice(3);

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
                onPress={() => scrollToSection(item.id)}
                activeOpacity={0.7}>
                <Icon name={item.icon} size={24} color={activeSection === item.id ? '#FF6B35' : '#888'} />
                <Text style={[styles.sidebarLabel, activeSection === item.id && styles.sidebarLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            
            {/* SECTION: news */}
            <View onLayout={(e) => sectionRefs.current['news'] = e.nativeEvent.layout.y} style={styles.section}>
              <TouchableOpacity style={styles.searchContainer} onPress={handleSearchNavigation} activeOpacity={0.8}>
                <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
                <Text style={[styles.searchInput, { color: 'grey' }]}>సెర్చ్ చేయండి</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mainEditionCard} onPress={() => handleSelection('all')}>
                <Text style={styles.mainEditionLabel}>Main Edition</Text>
                <Text style={styles.mainEditionText}>మెయిన్ ఎడిషన్</Text>
                <View style={styles.arrowButton}><Icon name="chevron-right" size={24} color="#FFF" /></View>
              </TouchableOpacity>
            </View>

            {/* SECTION: categories */}
            <View style={styles.masonryGrid} onLayout={(e) => sectionRefs.current['categories'] = e.nativeEvent.layout.y}>
                {categories.map((cat, idx) => {
                    const color = cardColors[idx % cardColors.length];
                    const mod = idx % 6;
                    let cardWidth = '100%';
                    let cardHeight = 80;
                    let isSmall = false;

                    if (mod === 1 || mod === 2) { cardWidth = '49%'; cardHeight = 110; }
                    else if (mod === 3 || mod === 4 || mod === 5) { cardWidth = '32.5%'; cardHeight = 90; isSmall = true; }

                    return (
                        <TouchableOpacity 
                            key={cat._id}
                            activeOpacity={0.9}
                            style={[styles.masonryCard, { backgroundColor: color, width: cardWidth, height: cardHeight }]}
                            onPress={() => handleSelection(cat._id)}
                        >
                            <Icon name={getCategoryIcon(cat.name?.en)} size={isSmall ? 22 : 28} color="#FFF" />
                            <View style={styles.catTextContainer}>
                                {!isSmall && <Text style={styles.catEnLabel}>{cat.name?.en}</Text>}
                                <Text style={[styles.catTeLabel, { fontSize: isSmall ? 12 : 16 }]}>{cat.name?.te || cat.name?.en}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* SECTION: reporter */}
            <View style={styles.menuSection} onLayout={(e) => sectionRefs.current['reporter'] = e.nativeEvent.layout.y}>
              <Text style={styles.menuTitle}>Reporter</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={handleReporterNavigation} activeOpacity={0.7}>
                  <View style={styles.menuLeft}>
                    <View style={[styles.iconContainer, {backgroundColor: '#FFEBEE'}]}><Icon name="microphone" size={22} color="#E91E63" /></View>
                    <View><Text style={styles.menuText}>రిపోర్టర్ అవ్వండి</Text><Text style={styles.menuSubText}>వార్తలను రిపోర్ట్ చేయండి</Text></View>
                  </View>
                  <Icon name="chevron-right" size={22} color="#CCC" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={{height: 100}} />
          </ScrollView>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: { ...StyleSheet.absoluteFillObject, elevation: 100 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  absoluteFill: { width: '100%', height: '100%' },
  sheetContainer: { position: 'absolute', bottom: 0, width: width, height: SHEET_HEIGHT, backgroundColor: '#F5F6F8', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 2, overflow: 'hidden', elevation: 20 },
  handleBarContainer: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 8, backgroundColor: '#F5F6F8' },
  handleBar: { width: 40, height: 4, backgroundColor: '#CCC', borderRadius: 2 },
  contentWrapper: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 80, backgroundColor: '#1C1C1E', paddingVertical: 16, gap: 4 },
  sidebarItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  sidebarItemActive: { backgroundColor: 'rgba(255, 107, 53, 0.15)', borderLeftColor: '#FF6B35' },
  sidebarLabel: { fontSize: 10, fontWeight: '600', color: '#888', marginTop: 4, textAlign: 'center' },
  sidebarLabelActive: { color: '#FF6B35' },
  scrollView: { flex: 1 },
  section: { padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  mainEditionCard: { backgroundColor: '#00BFFF', padding: 20, borderRadius: 16 },
  mainEditionLabel: { fontSize: 11, color: '#FFFFFF', opacity: 0.8 },
  mainEditionText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  arrowButton: { position: 'absolute', right: 16, top: '50%', transform: [{translateY: -20}], width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  masonryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', rowGap: 6 },
  masonryCard: { borderRadius: 12, padding: 12, justifyContent: 'space-between' },
  catTextContainer: { marginTop: 'auto' },
  catEnLabel: { fontSize: 10, color: '#FFF', opacity: 0.7, fontWeight: '700', textTransform: 'uppercase' },
  catTeLabel: { color: '#FFF', fontWeight: '800' },
  menuSection: { paddingHorizontal: 16, marginTop: 24 },
  menuTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: 16, fontWeight: '700', color: '#333' },
  menuSubText: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default CategoriesModal;