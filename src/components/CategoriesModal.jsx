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
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
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
import { getCategories, postFeedback, resetFeedbackStatus } from '../redux/reducers/news';
import { lightTheme, darkTheme } from '../config/theme';

const {width, height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const CategoriesModal = ({visible, onClose, onSelectCategory}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const {reporterToken, userToken, isAuthenticated} = useSelector((state)=>state.auth);
  const {categories, isSubmittingFeedback, feedbackSuccess, feedbackError} = useSelector((state) => state.news);

  const [activeSection, setActiveSection] = useState('news');
  const [feedback, setFeedback] = useState('');
  const [feedbackValidationError, setFeedbackValidationError] = useState(''); // <--- ADDED: Validation error state

  const handleSubmitFeedback = async () => {
    // <--- ADDED: Minimum character validation --->
    if (feedback.trim().length < 10) {
      setFeedbackValidationError('దయచేసి కనీసం 10 అక్షరాలు నమోదు చేయండి.'); // "Please enter at least 10 characters."
      return;
    }

    const resultAction = await dispatch(postFeedback({ message: feedback }));
    console.log(resultAction,">>>>>>>>>>>>>>RESUT ACTION");
    if (postFeedback.fulfilled.match(resultAction)) {
      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback('');
      setFeedbackValidationError(''); // Clear error on success
      dispatch(resetFeedbackStatus());
    } else {
      Alert.alert('Error', feedbackError || 'Failed to submit feedback. Please try again.');
    }
  };
  
  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingToSection = useRef(false);
  const scrollTimeout = useRef(null);

  const sidebarItems = [
    {id: 'news', icon: 'compass', label: 'Explore'},
    {id: 'categories', icon: 'view-dashboard', label: 'Topics'},
    {id: 'reporter', icon: 'microphone-variant', label: 'Create'},
    {id: 'feedback', icon: 'message-alert', label: 'Feedback'},
  ];

  const gradientPairs = [
    ['#4158D0', '#C850C0', '#FFCC70'], // Dynamic Trio
    ['#0093E9', '#80D0C7'], // Clean Blue
    ['#8EC5FC', '#E0C3FC'], // Pastel Purple
    ['#FBAB7E', '#F7CE68'], // Sunset
    ['#85FFBD', '#FFFB7D'], // Fresh Lime
    ['#21D4FD', '#B721FF'], // Electric
    ['#3EECAC', '#EE74E1'], // Neon
    ['#FF9A8B', '#FF6A88', '#FF99AC'], // Soft Red
  ];

  const getCategoryIcon = (nameEn) => {
    const name = nameEn?.toLowerCase() || '';
    if (name.includes('politics')) return 'gavel';
    if (name.includes('sports')) return 'basketball';
    if (name.includes('cinema') || name.includes('movie')) return 'movie-open-play';
    if (name.includes('business')) return 'chart-areaspline';
    if (name.includes('job')) return 'briefcase-search';
    if (name.includes('panta') || name.includes('agriculture')) return 'leaf';
    return 'star-four-points';
  };

  const closeModal = useCallback(() => {
    'worklet';
    Keyboard.dismiss();
    translateY.value = withTiming(SHEET_HEIGHT, { 
      duration: 350, 
      easing: Easing.bezier(0.33, 1, 0.68, 1) 
    }, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)();
      }
    });
    opacity.value = withTiming(0, { duration: 300 });
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
      translateY.value = withSpring(0, { damping: 18, stiffness: 100, mass: 0.8 });
      opacity.value = withTiming(1, { duration: 250 });
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
        translateY.value = offset * 0.15;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > 150 || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, (finished) => {
          if (finished && onClose) {
            runOnJS(onClose)();
          }
        });
        opacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 100 });
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
      scrollViewRef.current.scrollTo({y: yOffset - 10, animated: true});
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrollingToSection.current = false;
    }, 600);
  };

  const handleScroll = (event) => {
    if (isScrollingToSection.current) return;

    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollY = contentOffset.y;

    const isCloseToBottom = layoutMeasurement.height + scrollY >= contentSize.height - 80;
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
      if (scrollY >= offset - 100 && scrollY < nextOffset - 100) {
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

  return (
    <GestureHandlerRootView 
      style={[styles.overlayWrapper, { zIndex: visible ? 999 : -1 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={styles.absoluteFill} activeOpacity={1} onPress={closeModal} />
      </Animated.View>

      <Animated.View style={[styles.sheetContainer, sheetStyle, { backgroundColor: theme.background }]}>
        <GestureDetector gesture={pan}>
          <View style={[styles.handleBarContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.handleBar, { backgroundColor: isDarkMode ? '#444' : '#E0E0E0' }]} />
          </View>
        </GestureDetector>

        <View style={styles.contentWrapper}>
          <View style={[styles.sidebar, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA', borderRightColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <View style={styles.sidebarLogo}>
               <Icon name="lightning-bolt" size={28} color="#FF6B35" />
            </View>
            {sidebarItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.sidebarItem]}
                onPress={() => scrollToSection(item.id)}
                activeOpacity={0.7}>
                <View style={[styles.sidebarIconBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFF' }, activeSection === item.id && styles.sidebarIconBoxActive]}>
                   <Icon name={item.icon} size={22} color={activeSection === item.id ? '#FFF' : '#A0A0A0'} />
                </View>
                <Text style={[styles.sidebarLabel, activeSection === item.id && { color: '#FF6B35' }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={[styles.scrollView, { backgroundColor: theme.background }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollPadding}>
            
            {/* SECTION: news */}
            <View onLayout={(e) => sectionRefs.current['news'] = e.nativeEvent.layout.y} style={styles.section}>
              <View style={styles.searchRow}>
                <TouchableOpacity style={[styles.premiumSearch, { backgroundColor: isDarkMode ? '#222' : '#F1F3F5' }]} onPress={handleSearchNavigation} activeOpacity={0.9}>
                  <Icon name="magnify" size={22} color={isDarkMode ? '#888' : '#666'} />
                  <Text style={[styles.searchPlaceholder, { color: isDarkMode ? '#666' : '#868E96' }]}>Discover anything...</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.bentoMainCard} onPress={() => handleSelection('all')} activeOpacity={0.9}>
                <LinearGradient
                   colors={['#00BFFF', '#007AFF']}
                   style={styles.bentoMainGradient}
                   start={{x: 0, y: 0}}
                   end={{x: 1, y: 1}}
                >
                   <View style={styles.mainCardContent}>
                      <Text style={styles.mainEditionTitle}>Main Edition</Text>
                      <Text style={styles.mainEditionSub}>మెయిన్ ఎడిషన్</Text>
                      <View style={styles.glassBadge}>
                         <Text style={styles.badgeText}>Live Now</Text>
                      </View>
                   </View>
                   <View style={styles.mainCardIcon}>
                      <Icon name="newspaper-variant-multiple" size={60} color="rgba(255,255,255,0.3)" />
                   </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* SECTION: categories */}
            <View style={styles.bentoGrid} onLayout={(e) => sectionRefs.current['categories'] = e.nativeEvent.layout.y}>
                {categories.map((cat, idx) => {
                    const colors = gradientPairs[idx % gradientPairs.length];
                    const mod = idx % 6; 
                    let cardWidth = '49%';
                    let cardHeight = 120;
                    let isFullWidth = false;
                    
                    if (mod === 0 || mod === 3) { 
                        cardWidth = '100%'; 
                        cardHeight = 90; 
                        isFullWidth = true;
                    } else { 
                        cardWidth = '49%'; 
                        cardHeight = 130; 
                    } 

                    return (
                        <TouchableOpacity 
                            key={cat._id}
                            activeOpacity={0.9}
                            style={[styles.bentoCardWrapper, { width: cardWidth }]}
                            onPress={() => handleSelection(cat._id)}
                        >
                            <LinearGradient
                                colors={colors}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={[styles.bentoCard, isFullWidth && styles.bentoCardHorizontal, { height: cardHeight }]}
                            >
                                <View style={styles.bentoIconFloating}>
                                    {cat.icon ? (
                                        <FastImage 
                                            source={{ uri: cat.icon }} 
                                            style={styles.floatingImg}
                                            resizeMode={FastImage.resizeMode.contain}
                                        />
                                    ) : (
                                        <Icon name={getCategoryIcon(cat.name?.en)} size={isFullWidth ? 26 : 30} color="rgba(255,255,255,0.9)" />
                                    )}
                                </View>
                                <View style={[styles.bentoTextContainer, isFullWidth && styles.bentoTextContainerHorizontal]}>
                                    <Text style={styles.bentoEnLabel}>{cat.name?.en}</Text>
                                    <Text style={styles.bentoTeLabel}>{cat.name?.te || cat.name?.en}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* SECTION: reporter */}
            <View style={styles.menuSection} onLayout={(e) => sectionRefs.current['reporter'] = e.nativeEvent.layout.y}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Reporter</Text>
              <View style={[styles.menuCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA' }]}>
                <TouchableOpacity style={styles.menuItem} onPress={handleReporterNavigation} activeOpacity={0.7}>
                  <View style={styles.menuLeft}>
                    <View style={[styles.iconContainer, {backgroundColor: isDarkMode ? '#2D1F24' : '#FFEBEE'}]}><Icon name="microphone" size={22} color="#E91E63" /></View>
                    <View><Text style={[styles.menuText, { color: theme.text }]}>రిపోర్టర్ అవ్వండి</Text><Text style={[styles.menuSubText, { color: theme.textSecondary }]}>వార్తలను రిపోర్ట్ చేయండి</Text></View>
                  </View>
                  <Icon name="chevron-right" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION: feedback */}
            <View style={styles.feedbackSection} onLayout={(e) => sectionRefs.current['feedback'] = e.nativeEvent.layout.y}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Feedback</Text>
              <View style={[styles.feedbackCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA' }]}>
                <TextInput
                  style={[
                    styles.feedbackInput, 
                    { 
                      backgroundColor: isDarkMode ? '#222' : '#FFF', 
                      color: theme.text, 
                      borderColor: feedbackValidationError ? '#FF3B30' : (isDarkMode ? '#333' : '#F0F0F0') 
                    }
                  ]}
                  placeholder="Share your feedback..."
                  placeholderTextColor={isDarkMode ? '#666' : '#A0A0A0'}
                  multiline
                  numberOfLines={4}
                  value={feedback}
                  onChangeText={(text) => {
                    setFeedback(text);
                    if (feedbackValidationError) setFeedbackValidationError(''); // Clear error while typing
                  }}
                />
                
                {/* <--- ADDED: Validation Error Text UI ---> */}
                {feedbackValidationError ? (
                  <Text style={styles.errorText}>{feedbackValidationError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.feedbackButton, isSubmittingFeedback && styles.feedbackButtonDisabled]}
                  onPress={handleSubmitFeedback}
                  disabled={isSubmittingFeedback}
                  activeOpacity={0.8}
                >
                  {isSubmittingFeedback ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
                  )}
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  absoluteFill: { width: '100%', height: '100%' },
  sheetContainer: { position: 'absolute', bottom: 0, width: width, height: SHEET_HEIGHT, borderTopLeftRadius: 32, borderTopRightRadius: 32, zIndex: 2, overflow: 'hidden', elevation: 25 },
  handleBarContainer: { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  handleBar: { width: 44, height: 5, borderRadius: 2.5 },
  contentWrapper: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 75, paddingVertical: 20, alignItems: 'center', borderRightWidth: 1 },
  sidebarLogo: { marginBottom: 30 },
  sidebarItem: { alignItems: 'center', marginBottom: 25, width: '100%' },
  sidebarIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 6 },
  sidebarIconBoxActive: { backgroundColor: '#FF6B35', elevation: 6, shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 8 },
  sidebarLabel: { fontSize: 10, fontWeight: '700', color: '#A0A0A0', textAlign: 'center' },
  sidebarLabelActive: { color: '#FF6B35' },
  scrollView: { flex: 1 },
  scrollPadding: { paddingBottom: 100 },
  section: { padding: 18 },
  searchRow: { marginBottom: 20 },
  premiumSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 16, paddingHorizontal: 16, height: 54, gap: 12 },
  searchPlaceholder: { fontSize: 15, color: '#868E96', fontWeight: '500' },
  bentoMainCard: { borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  bentoMainGradient: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainCardContent: { flex: 1 },
  mainEditionTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  mainEditionSub: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  glassBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  mainCardIcon: { opacity: 0.6 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, justifyContent: 'space-between' },
  bentoCardWrapper: { marginBottom: 10 },
  bentoCard: { borderRadius: 20, padding: 14, justifyContent: 'space-between', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  bentoCardHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 16 },
  bentoIconFloating: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  floatingImg: { width: 28, height: 28 },
  bentoTextContainer: { marginTop: 'auto' },
  bentoTextContainerHorizontal: { marginTop: 0, flex: 1 },
  bentoEnLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  bentoTeLabel: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
  menuSection: { paddingHorizontal: 18, marginTop: 30 },
  menuTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16, letterSpacing: -0.5 },
  menuCard: { borderRadius: 24, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: 17, fontWeight: '800', color: '#2D3436' },
  menuSubText: { fontSize: 13, color: '#636E72', marginTop: 3, fontWeight: '500' },
  feedbackSection: { paddingHorizontal: 18, marginTop: 30 },
  feedbackCard: { borderRadius: 24, padding: 18, marginBottom: 20 },
  feedbackInput: { borderRadius: 16, padding: 16, fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, marginBottom: 8 },
  
  // <--- ADDED: Validation text styling --->
  errorText: { color: '#FF3B30', fontSize: 13, marginBottom: 12, fontWeight: '500' },
  
  feedbackButton: { backgroundColor: '#FF6B35', borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  feedbackButtonDisabled: { backgroundColor: '#FFB899' },
  feedbackButtonText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});

export default CategoriesModal;