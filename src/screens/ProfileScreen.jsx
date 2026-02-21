import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedCategory, getCategories} from '../redux/reducers/news';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { userLogin } from '../redux/reducers/auth';
import { responsiveHeight } from 'react-native-responsive-dimensions';

const ProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
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
     const resp=await GoogleSignin.hasPlayServices();
     console.log(resp,">>>>>>>>>>>>>>>RESPSPSPSPSSP");
     await GoogleSignin.signOut();
     const response = await GoogleSignin.signIn();
     
     const userInfo = response.data;
     console.log("Success!", userInfo);

     const payload = {
      idToken:userInfo?.idToken
     }

     await dispatch(userLogin(payload))
     
   } catch (error) {
     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
       console.log("User cancelled the login flow");
     } else if (error.code === statusCodes.IN_PROGRESS) {
       console.log("Sign in is already in progress");
     } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
       console.log("Play services not available or outdated");
     } else {
       console.error("Something went wrong:", error.message);
     }
   }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top}]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerIconButton}>
            <Icon name="cog-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Search')}>
            <Icon name="magnify" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRight}>
          <Text style={styles.headerTitle}>స్వార్న్</Text>
          <Icon name="chevron-right" size={24} color="#00BFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Profile Section */}
        <TouchableOpacity onPress={handleGoogleLogin} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
          { ( user?.profile_image)? <Image source={{uri:user?.profile_image}}  style={{width:responsiveHeight(4), height:responsiveHeight(4),borderRadius:100}} />  :   <Icon name="account-circle" size={48} color="#CCC" />}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || reporter?.reporter_profile?.username || "Guest"}</Text>
            {/* <TouchableOpacity> */}
             <Text style={styles.profileLink}>{user?.email||"Click here to select email id"}</Text>
            {/* </TouchableOpacity> */}
          </View>
        </TouchableOpacity>

        {/* Language & Location Section */}
        <View style={styles.settingsCard}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => navigation.navigate('LanguageSelection', {isOnboarding: false})}>
            <View style={styles.settingIconContainer}><Icon name="translate" size={22} color="#E74C3C" /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>మీ భాషని ఎంచుకోడి</Text>
              <Text style={styles.settingValue}>తెలుగు Telugu</Text>
            </View>
            <View style={styles.settingArrow}><Icon name="arrow-right" size={16} color="#FFFFFF" /></View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Actual Location displayed here */}
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('LocationSelection')}>
            <View style={styles.settingIconContainer}><Icon name="map-marker" size={22} color="#E74C3C" /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>మీరు ఎందుకున్న స్థానం</Text>
              <Text style={styles.settingValue}>{displayLocationName} (Change)</Text>
            </View>
            <View style={styles.settingArrow}><Icon name="arrow-right" size={16} color="#FFFFFF" /></View>
          </TouchableOpacity>
        </View>

        {/* Dynamic Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color="#E74C3C" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}>
              
              {/* Static 'All' option */}
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress('all')}
                activeOpacity={0.7}>
                <View style={[styles.categoryIconBg, selectedCategory === 'all' && {backgroundColor: '#9B59B630'}]}>
                  <Icon name="newspaper" size={28} color="#9B59B6" />
                </View>
                <Text style={[styles.categoryLabel, selectedCategory === 'all' && {color: '#9B59B6', fontWeight: '700'}]}>
                  అన్నీ
                </Text>
              </TouchableOpacity>

              {/* Dynamic items from API */}
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
                    <View style={[styles.categoryIconBg, isSelected && {backgroundColor: `${iconColor}30`}]}>
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
                    <Text style={[styles.categoryLabel, isSelected && {color: iconColor, fontWeight: '700'}]}>
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
          {/* Changed Digital Magazines to Bookmarks and added navigation */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Bookmarks')}>
            <View style={styles.menuIconContainer}><Icon name="bookmark-outline" size={18} color="#E74C3C" /></View>
            <Text style={styles.menuText}>బుక్‌మార్క్ చేసినవి</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ContentList', {type: 'videos'})} style={styles.menuItem}>
            <View style={styles.menuIconContainer}><Icon name="video" size={18} color="#E74C3C" /></View>
            <Text style={styles.menuText}>వీడియోస్</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="bullhorn" size={18} color="#E74C3C" />
            </View>
            <Text style={styles.menuText}>వైరల్</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="star" size={18} color="#E74C3C" />
            </View>
            <Text style={styles.menuText}>సిటీ న్యూస్ ఎక్స్క్లూసివ్</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => navigation.navigate('ContactUs')}>
            <View style={styles.menuIconContainer}>
              <Icon name="help-circle" size={18} color="#E74C3C" />
            </View>
            <Text style={styles.menuText}>సంప్రదింపండి</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>
        </View>
        <View style={{height: 16}} />
      </ScrollView>
    </View>
  );
};

// Styles remain unchanged to maintain UI consistency
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    elevation: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconButton: { padding: 5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#00BFFF' },
  content: { flex: 1, backgroundColor: '#F5F6F8' },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 2, borderColor: '#FFB6D9' },
  avatarContainer: { marginRight: 10 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  profileLink: { fontSize: 13, color: '#00BFFF', fontWeight: '500' },
  settingsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 8 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  settingIconContainer: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 11, color: '#666', marginBottom: 2 },
  settingValue: { fontSize: 14, fontWeight: '600', color: '#00BFFF' },
  settingArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#666', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E8EAED', marginVertical: 3 },
  categoriesSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 16, marginBottom: 12 },
  categoriesScroll: { paddingHorizontal: 16, gap: 10 },
  categoryCard: { alignItems: 'center', width: 62 },
  categoryIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6, backgroundColor: '#F0F0F0' },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center', lineHeight: 14 },
  menuSection: { paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8EAED' },
  menuIconContainer: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', flex: 1 },
});

export default ProfileScreen;