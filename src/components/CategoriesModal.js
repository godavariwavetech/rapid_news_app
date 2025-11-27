import { useNavigation } from '@react-navigation/native';
import React, {useState, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width, height} = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.8;

const CategoriesModal = ({visible, onClose}) => {
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation()
  const [activeSection, setActiveSection] = useState('news');
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
  ];

  const scrollToSection = (sectionId) => {
    // Immediately update active section
    setActiveSection(sectionId);
    
    // Set flag to prevent scroll handler from interfering
    isScrollingToSection.current = true;
    
    const yOffset = sectionRefs.current[sectionId];
    if (scrollViewRef.current && yOffset !== undefined) {
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    }

    // Clear any existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Reset flag after scroll animation completes
    scrollTimeout.current = setTimeout(() => {
      isScrollingToSection.current = false;
    }, 500);
  };

  const handleScroll = (event) => {
    // Don't update active section if we're programmatically scrolling
    if (isScrollingToSection.current) {
      return;
    }

    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Determine which section is currently visible
    const sections = Object.entries(sectionRefs.current).sort((a, b) => a[1] - b[1]);
    
    for (let i = 0; i < sections.length; i++) {
      const [id, offset] = sections[i];
      const nextOffset = sections[i + 1] ? sections[i + 1][1] : Infinity;
      
      if (scrollY >= offset - 100 && scrollY < nextOffset - 100) {
        if (activeSection !== id) {
          setActiveSection(id);
        }
        break;
      }
    }
  };

  const handleScrollEnd = () => {
    // Reset flag when user stops scrolling
    isScrollingToSection.current = false;
  };

  const handleReporterNavigation = () =>{
    onClose()
    navigation.navigate('Reporter')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          <View style={styles.contentWrapper}>
            {/* Sidebar Navigation */}
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
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}>
              
              {/* Search Section */}
              <View 
                style={styles.section}
                onLayout={(event) => {
                  sectionRefs.current['news'] = event.nativeEvent.layout.y;
                }}>
                <Text style={styles.sectionTitle}>సెర్చ్ చేయండి</Text>
                <View style={styles.searchContainer}>
                  <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search Keyword ex: Modi, Politics, Health, Stocks"
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
              </View>

              {/* Main Edition */}
              <TouchableOpacity style={styles.mainEditionCard}>
                <Text style={styles.mainEditionLabel}>Main Edition</Text>
                <Text style={styles.mainEditionText}>మెయిన్ ఎడిషన్</Text>
                <View style={styles.arrowButton}>
                  <Icon name="arrow-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Local News */}
              <View 
                style={styles.localNewsCard}
                onLayout={(event) => {
                  sectionRefs.current['videos'] = event.nativeEvent.layout.y;
                }}>
                <Text style={styles.localNewsTitle}>LOCAL NEWS</Text>
                <View style={styles.locationCard}>
                  <View>
                    <Text style={styles.locationName}>BABA NAGAR</Text>
                    <Text style={styles.locationAddress}>
                      Rajamahendravaram Urban, East Godavari – 533106
                    </Text>
                  </View>
                  <View style={styles.locationArrow}>
                    <Icon name="arrow-right" size={20} color="#666" />
                  </View>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Icon name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Access Grid */}
              <View 
                style={styles.quickAccessGrid}
                onLayout={(event) => {
                  sectionRefs.current['astrology'] = event.nativeEvent.layout.y;
                }}>
                <TouchableOpacity style={[styles.quickAccessCard, {backgroundColor: '#FFB366'}]}>
                  <Icon name="trophy" size={32} color="#FFFFFF" />
                  <Text style={styles.quickAccessText}>స్పోర్ట్స్</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickAccessCard, {backgroundColor: '#66D9EF'}]}>
                  <Icon name="movie-open" size={32} color="#FFFFFF" />
                  <Text style={styles.quickAccessText}>సినిమాలు</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickAccessCard, {backgroundColor: '#E066FF'}]}>
                  <Icon name="trending-up" size={32} color="#FFFFFF" />
                  <Text style={styles.quickAccessText}>బిజినెస్</Text>
                </TouchableOpacity>
              </View>

              {/* Viral Section */}
              <TouchableOpacity 
                style={styles.viralCard}
                onLayout={(event) => {
                  sectionRefs.current['stocks'] = event.nativeEvent.layout.y;
                }}>
                <Icon name="fire" size={32} color="#FFFFFF" />
                <Text style={styles.viralText}>వైరల్</Text>
                <View style={styles.cardArrow}>
                  <Icon name="arrow-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Jobs Section */}
              <TouchableOpacity 
                style={styles.jobsCard}
                onLayout={(event) => {
                  sectionRefs.current['sports'] = event.nativeEvent.layout.y;
                }}>
                <View style={styles.jobsContent}>
                  <Text style={styles.jobsLabel}>Jobs</Text>
                  <Text style={styles.jobsText}>జాబ్స్</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Icon name="arrow-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Padi Panta Section */}
              <TouchableOpacity 
                style={styles.padiPantaCard}
                onLayout={(event) => {
                  sectionRefs.current['videos2'] = event.nativeEvent.layout.y;
                }}>
                <View style={styles.padiPantaContent}>
                  <Text style={styles.padiPantaLabel}>Padi Panta</Text>
                  <Text style={styles.padiPantaText}>పాడి పంట</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Icon name="arrow-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Bottom Options */}
              <View 
                style={styles.bottomSection}
                onLayout={(event) => {
                  sectionRefs.current['settings'] = event.nativeEvent.layout.y;
                }}>
                <TouchableOpacity style={styles.optionCard}>
                  <Icon name="brightness-7" size={28} color="#333" />
                  <Text style={styles.optionText}>భాష</Text>
                  <View style={styles.optionArrow}>
                    <Icon name="arrow-right" size={20} color="#666" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard}>
                  <Icon name="shield-check" size={28} color="#333" />
                  <Text style={styles.optionText}>జోవిత్యం</Text>
                  <View style={styles.optionArrow}>
                    <Icon name="arrow-right" size={20} color="#666" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard}>
                  <Icon name="creation" size={28} color="#333" />
                  <Text style={styles.optionText}>సందాగం</Text>
                  <View style={styles.optionArrow}>
                    <Icon name="arrow-right" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Reporter Section */}
              <TouchableOpacity
              onPress={handleReporterNavigation}
              style={styles.reporterCard}>
                <Icon name="microphone" size={32} color="#FFFFFF" />
                <View style={styles.reporterContent}>
                  <Text style={styles.reporterLabel}>Reporter</Text>
                  <Text style={styles.reporterText}>రిపోర్టర్</Text>
                  <Text style={styles.reporterDesc}>
                    మీ ప్రాంతంలో జరుగుతున్న రాయింది రాజయిట్ జి తానిమ్ చేసన్త్
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Icon name="arrow-right" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Feedback Section */}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Feedback</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Enter your Feedback"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>

              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width,
    height: MODAL_HEIGHT,
    backgroundColor: '#F5F6F8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
  reporterCard: {
    backgroundColor: '#FF1493',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reporterContent: {
    flex: 1,
  },
  reporterLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reporterText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reporterDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
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
  feedbackInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CategoriesModal;
