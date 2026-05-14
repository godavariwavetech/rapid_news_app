import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedCategory, getCategories} from '../redux/reducers/news';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { userLogin } from '../redux/reducers/auth';
import { responsiveHeight } from 'react-native-responsive-dimensions';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  // Coming Soon Modal State
  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  // Select data from Redux
  const {reporter,user} = useSelector(state => state.auth);

  // Get location data from Redux store
  const {currentLocation} = useSelector(state => state.location);
  const {
    categories: dynamicCategories, 
    selectedCategory, 
    loadingCategories 
  } = useSelector(state => state.news);

  // Determine actual location name based on resolved location data
  const displayLocationName = 
      currentLocation?.village?.name?.te || 
      currentLocation?.village?.name?.en  ||
      currentLocation?.district?.name?.te || 
       currentLocation?.district?.name?.en ||
    'Location Not Set';

  // Helper to map API category names to relevant Icons
  const getCategoryIcon = (nameEn) => {
    const name = nameEn?.toLowerCase() || '';
    if (name.includes('politics')) return 'gavel';
    if (name.includes('agriculture') || name.includes('panta')) return 'sprout';
    if (name.includes('education')) return 'brain';
    if (name.includes('health')) return 'heart-pulse';
    if (name.includes('job')) return 'briefcase-variant';
    if (name.includes('sports')) return 'trophy';
    if (name.includes('crime')) return 'shield-alert';
    if (name.includes('cinema')) return 'filmstrip';
    return 'newspaper'; // Default icon
  };

  // Helper to assign random/consistent colors for UI
  const getCategoryColor = (index) => {
    const colors = ['#9B59B6', '#4ECDC4', '#E74C3C', '#F39C12', '#3498DB', '#FF5722', '#4CAF50'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    // Fetch categories from API on mount
    dispatch(getCategories());
    
    if (!selectedCategory) {
      dispatch(setSelectedCategory('all'));
    }
  }, [dispatch]);

  const handleCategoryPress = categoryId => {
    dispatch(setSelectedCategory(categoryId));
    navigation.goBack();
  };

  const handleGoogleLogin =  async () =>{
 try {
     await GoogleSignin.signOut();
     await GoogleSignin.hasPlayServices();
     const response = await GoogleSignin.signIn();
     
     const userInfo = response.data;
     const payload = {
      idToken:userInfo?.idToken
     }

     const resp = await dispatch(userLogin(payload))
     
   } catch (error) {
    console.log(error,">>>>>>>>>>>>>>>>ERROR");
   }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.statusBar} translucent={false} />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top, backgroundColor: theme.statusBar, borderBottomColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerIconButton}>
            <Icon name="cog-outline" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRight}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>న్యూస్</Text>
          <Icon name="chevron-right" size={24} color={isDarkMode ? theme.primary : '#00BFFF'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Profile</Text>

        {/* Profile Section */}
        <TouchableOpacity onPress={handleGoogleLogin} style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#FFB6D9' }]}>
          <View style={styles.avatarContainer}>
          { ( user?.profile_image||reporter?.profile_image)? <Image source={{uri:user?.profile_image||reporter?.profile_image}}  style={{width:responsiveHeight(4), height:responsiveHeight(4),borderRadius:100}} />  :   <Icon name="account-circle" size={48} color={isDarkMode ? '#555' : '#CCC'} />}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || reporter?.reporter_profile?.username || "Guest"}</Text>
             <Text style={[styles.profileLink, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>{user?.email|| reporter?.email||"Click here to select email id"}</Text>
          </View>
        </TouchableOpacity>

        {/* Language & Location Section */}
        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('LocationSelection')}>
            <View style={styles.settingIconContainer}><Icon name="map-marker" size={22} color={theme.primary} /></View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>మీరు ఎందుకున్న స్థానం</Text>
              <Text style={[styles.settingValue, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>{displayLocationName} (Change)</Text>
            </View>
            <View style={[styles.settingArrow, { backgroundColor: isDarkMode ? '#333' : '#666' }]}><Icon name="arrow-right" size={16} color="#FFFFFF" /></View>
          </TouchableOpacity>
        </View>

        {/* Dynamic Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}>
              
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('all')}
                activeOpacity={0.7}>
                <View style={[styles.categoryIconBg, { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }, selectedCategory === 'all' && {backgroundColor: isDarkMode ? '#9B59B650' : '#9B59B630'}]}>
                  <Icon name="newspaper" size={28} color="#9B59B6" />
                </View>
                <Text style={[styles.categoryLabel, { color: theme.textSecondary }, selectedCategory === 'all' && {color: '#9B59B6', fontWeight: '700'}]}>
                  అన్నీ
                </Text>
              </TouchableOpacity>

              {dynamicCategories.map((cat, index) => {
                const isSelected = selectedCategory === cat._id;
                const iconColor = getCategoryColor(index);
                const categoryName = cat.name?.te || cat.name?.en || cat.name;
                const categoryIcon = cat.icon;

                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(cat._id)}
                    activeOpacity={0.7}>
                    <View style={[styles.categoryIconBg, { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }, isSelected && {backgroundColor: isDarkMode ? `${iconColor}50` : `${iconColor}30`}]}>
                      {categoryIcon && categoryIcon.startsWith('http') ? (
                        <FastImage
                          source={{ uri: categoryIcon }}
                          style={{ width: 30, height: 30 }}
                          resizeMode={FastImage.resizeMode.contain}
                        />
                      ) : (
                        <Icon name={getCategoryIcon(cat.name?.en)} size={28} color={iconColor} />
                      )}
                    </View>
                    <Text style={[styles.categoryLabel, { color: theme.textSecondary }, isSelected && {color: iconColor, fontWeight: '700'}]}>
                      {categoryName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]} 
            onPress={() => setComingSoonVisible(true)}>
            <View style={styles.menuIconContainer}>
              <Icon name="star-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>రాపిడ్‌ న్యూస్‌ ఎక్స్‌క్లూసివ్‌</Text>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]} 
            onPress={() => setComingSoonVisible(true)}>
            <View style={styles.menuIconContainer}>
              <Icon name="fire" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>వైరల్‌</Text>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]} 
            onPress={() => setComingSoonVisible(true)}>
            <View style={styles.menuIconContainer}>
              <Icon name="play-circle-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>వీడియోలు</Text>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}
            onPress={() => navigation.navigate('ContactUs')}>
            <View style={styles.menuIconContainer}>
              <Icon name="phone-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>సంప్రదించండి</Text>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

        </View>
        <View style={{height: 30}} />
      </ScrollView>

      {/* Coming Soon Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={comingSoonVisible}
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>త్వరలో రానుంది!</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              త్వరలో మీకు అందుబాటులోకి వస్తుంది.
            </Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.primary }]} 
              onPress={() => setComingSoonVisible(false)}
            >
              <Text style={styles.closeButtonText}>సరే</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    elevation: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconButton: { padding: 5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  pageTitle: { fontSize: 26, fontWeight: '700', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  
  // Added more bottom margin for spacing
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginBottom: 20, borderRadius: 12, borderWidth: 2 },
  avatarContainer: { marginRight: 12 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  profileLink: { fontSize: 13, fontWeight: '500' },
  
  // Added more bottom margin for spacing
  settingsCard: { marginHorizontal: 16, marginBottom: 24, borderRadius: 12, padding: 10 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  settingIconContainer: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 12, marginBottom: 2 },
  settingValue: { fontSize: 15, fontWeight: '600' },
  settingArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginVertical: 3 },
  
  // Added more bottom margin for spacing
  categoriesSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '700', paddingHorizontal: 16, marginBottom: 16 },
  categoriesScroll: { paddingHorizontal: 16, gap: 12 },
  categoryCard: { alignItems: 'center', width: 66 },
  categoryIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  
  menuSection: { paddingHorizontal: 16, marginTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  lastMenuItem: { borderBottomWidth: 0 },
  menuIconContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  menuText: { fontSize: 16, fontWeight: '600', flex: 1 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;