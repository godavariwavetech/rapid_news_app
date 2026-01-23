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
import { useSelector } from 'react-redux';

const {width, height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const CategoriesModal = ({visible, onClose, onSelectCategory}) => {
  const navigation = useNavigation();
  const {reporterToken} = useSelector((state)=>state.auth)
  const [searchText, setSearchText] = useState('');
  const [activeSection, setActiveSection] = useState('news');
  
  // Animation Values
  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  // Refs for scroll
  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingToSection = useRef(false);
  const scrollTimeout = useRef(null);

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

  // --- ANIMATION HELPERS ---
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
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      if (translateY.value < SHEET_HEIGHT) {
        closeModal();
      }
    }
  }, [visible, closeModal]);

  // --- GESTURE ---
  const pan = Gesture.Pan()
    .onChange((event) => {
      const offset = event.translationY;
      if (offset > 0) {
        translateY.value = offset;
      } else {
        translateY.value = offset * 0.1;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (finished) => {
          if (finished && onClose) runOnJS(onClose)();
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

  // --- SCROLL & NAV ---
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

    // FIX: Check if we are at the very bottom of the list
    // If so, force highlight the last item ('reporter')
    const isCloseToBottom = layoutMeasurement.height + scrollY >= contentSize.height - 50;
    if (isCloseToBottom) {
      const lastItemId = sidebarItems[sidebarItems.length - 1].id;
      if (activeSection !== lastItemId) {
        setActiveSection(lastItemId);
      }
      return;
    }

    // Standard Spy Logic
    const sections = Object.entries(sectionRefs.current).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < sections.length; i++) {
      const [id, offset] = sections[i];
      const nextOffset = sections[i + 1] ? sections[i + 1][1] : Infinity;
      
      // Highlight if within range (with -150 offset for better triggering)
      if (scrollY >= offset - 150 && scrollY < nextOffset - 150) {
        if (activeSection !== id) setActiveSection(id);
        break;
      }
    }
  };

  const handleReporterNavigation = () => {
    closeModal();
    setTimeout(() => navigation.navigate(reporterToken  ?  "ReporterApp" :'Reporter'), 100);
  };

  const handleSelection = (cat) => {
    closeModal();
    if(onSelectCategory) setTimeout(() => onSelectCategory(cat), 50);
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
          {/* Sidebar */}
          <View style={styles.sidebar}>
            {sidebarItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.sidebarItem,
                  activeSection === item.id && styles.sidebarItemActive,
                ]}
                onPress={() => scrollToSection(item.id)}
                activeOpacity={0.7}>
                <Icon
                  name={item.icon}
                  size={24}
                  color={activeSection === item.id ? '#FF6B35' : '#888'}
                />
                <Text
                  style={[
                    styles.sidebarLabel,
                    activeSection === item.id && styles.sidebarLabelActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            
            {/* Search */}
            <View
              style={styles.section}
              onLayout={(event) => { sectionRefs.current['news'] = event.nativeEvent.layout.y; }}>
              <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="సెర్చ్ చేయండి"
                  placeholderTextColor={"grey"}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>

            {/* Main Edition */}
            <TouchableOpacity style={styles.mainEditionCard} onPress={() => handleSelection('all')}>
              <Text style={styles.mainEditionLabel}>Main Edition</Text>
              <Text style={styles.mainEditionText}>మెయిన్ ఎడిషన్</Text>
              <View style={styles.arrowButton}>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Local News */}
            <View
              style={styles.localNewsCard}
              onLayout={(event) => { sectionRefs.current['videos'] = event.nativeEvent.layout.y; }}>
              <Text style={styles.localNewsTitle}>LOCAL NEWS</Text>
              <TouchableOpacity onPress={() => handleSelection('local')}>
                <View style={styles.locationCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.locationName}>BABA NAGAR</Text>
                    <Text style={styles.locationAddress}>
                      Rajamahendravaram Urban, East Godavari – 533106
                    </Text>
                  </View>
                  <View style={styles.locationArrow}>
                    <Icon name="chevron-right" size={20} color="#666" />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Icon name="pencil" size={16} color="#FFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Access */}
            <View
              style={styles.quickAccessGrid}
              onLayout={(event) => { sectionRefs.current['astrology'] = event.nativeEvent.layout.y; }}>
              <TouchableOpacity 
                style={[styles.quickAccessCard, {backgroundColor: '#FF6B35'}]}
                onPress={() => handleSelection('sports')}
              >
                <Icon name="cricket" size={32} color="#FFF" />
                <Text style={styles.quickAccessText}>స్పోర్ట్స్</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAccessCard, {backgroundColor: '#9C27B0'}]}
                onPress={() => handleSelection('cinema')}
              >
                <Icon name="movie" size={32} color="#FFF" />
                <Text style={styles.quickAccessText}>సినిమాలు</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAccessCard, {backgroundColor: '#2196F3'}]}
                onPress={() => handleSelection('business')}
              >
                <Icon name="briefcase" size={32} color="#FFF" />
                <Text style={styles.quickAccessText}>బిజినెస్</Text>
              </TouchableOpacity>
            </View>

            {/* Viral */}
            <TouchableOpacity
              style={styles.viralCard}
              onLayout={(event) => { sectionRefs.current['stocks'] = event.nativeEvent.layout.y; }}
              onPress={() => handleSelection('viral')}
            >
              <Text style={styles.viralText}>వైరల్</Text>
              <View style={styles.cardArrow}>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Jobs */}
            <TouchableOpacity
              style={styles.jobsCard}
              onLayout={(event) => { sectionRefs.current['sports'] = event.nativeEvent.layout.y; }}
              onPress={() => handleSelection('jobs')}
            >
              <View style={styles.jobsContent}>
                <Text style={styles.jobsLabel}>Jobs</Text>
                <Text style={styles.jobsText}>జాబ్స్</Text>
              </View>
              <View style={styles.cardArrow}>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Padi Panta */}
            <TouchableOpacity
              style={styles.padiPantaCard}
              onLayout={(event) => { sectionRefs.current['videos2'] = event.nativeEvent.layout.y; }}
              onPress={() => handleSelection('padipanta')}
            >
              <View style={styles.padiPantaContent}>
                <Text style={styles.padiPantaLabel}>Padi Panta</Text>
                <Text style={styles.padiPantaText}>పాడి పంట</Text>
              </View>
              <View style={styles.cardArrow}>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Bottom Options */}
            <View
              style={styles.bottomSection}
              onLayout={(event) => { sectionRefs.current['settings'] = event.nativeEvent.layout.y; }}>
              <TouchableOpacity style={styles.optionCard} onPress={() => {}}>
                <Icon name="translate" size={24} color="#333" />
                <Text style={styles.optionText}>భాષા</Text>
                <View style={styles.optionArrow}>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionCard} onPress={() => {}}>
                <Icon name="star-circle" size={24} color="#333" />
                <Text style={styles.optionText}>జోవిత్యం</Text>
                <View style={styles.optionArrow}>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionCard} onPress={() => {}}>
                <Icon name="chart-line" size={24} color="#333" />
                <Text style={styles.optionText}>సందాగం</Text>
                <View style={styles.optionArrow}>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Reporter Section */}
            <View 
              style={styles.menuSection}
              onLayout={(event) => { sectionRefs.current['reporter'] = event.nativeEvent.layout.y; }}
            >
              <Text style={styles.menuTitle}>Reporter</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleReporterNavigation}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.iconContainer, {backgroundColor: '#FFEBEE'}]}>
                      <Icon name="microphone" size={22} color="#E91E63" />
                    </View>
                    <View>
                      <Text style={styles.menuText}>రిపోర్టర్ అవ్వండి</Text>
                      <Text style={styles.menuSubText}>వార్తలను రిపోర్ట్ చేయండి</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={22} color="#CCC" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Feedback */}
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
              <View style={styles.feedbackCard}>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="మీ అభిప్రాయాన్ని తెలియజేయండి..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* FIX: Increased Bottom Padding for smooth scrolling */}
            <View style={{height: 300}} />
          </ScrollView>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    elevation: 100, 
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  absoluteFill: {
    width: '100%',
    height: '100%',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: SHEET_HEIGHT,
    backgroundColor: '#F5F6F8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBarContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F5F6F8',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 80,
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    gap: 4,
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderLeftColor: '#FF6B35',
  },
  sidebarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  sidebarLabelActive: {
    color: '#FF6B35',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  mainEditionCard: {
    backgroundColor: '#00BFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  mainEditionLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mainEditionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{translateY: -20}],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localNewsCard: {
    backgroundColor: '#FFB6D9',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  localNewsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1,
    maxWidth: 220,
  },
  locationArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'flex-start',
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickAccessCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  viralCard: {
    backgroundColor: '#FF6600',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viralText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  cardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobsCard: {
    backgroundColor: '#7B3FF2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobsContent: {
    flex: 1,
  },
  jobsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  jobsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  padiPantaCard: {
    backgroundColor: '#00CC66',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  padiPantaContent: {
    flex: 1,
  },
  padiPantaLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  padiPantaText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSection: {
    backgroundColor: '#FFD966',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  optionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  menuSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  feedbackSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  feedbackInput: {
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CategoriesModal;