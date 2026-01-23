import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedCategory} from '../redux/reducers/news';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ProfileScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets()
  const {reporter} = useSelector(state=>state.auth)
  const selectedCategory = useSelector(state => state.news.selectedCategory);

  const categories = [
    {id: 'all', icon: 'newspaper', label: 'అన్నీ', color: '#9B59B6'},
    {id: 'education', icon: 'brain', label: 'మీ కోసం', color: '#4ECDC4'},
    {id: 'politics', icon: 'gavel', label: 'రాజకీయాలు', color: '#9B59B6'},
    {id: 'news', icon: 'newspaper', label: 'స్వార్న్', color: '#E74C3C'},
    {
      id: 'business',
      icon: 'briefcase-outline',
      label: 'వ్యాపారం',
      color: '#F39C12',
    },
    {id: 'cinema', icon: 'filmstrip', label: 'సినిమా', color: '#3498DB'},
    {id: 'sports', icon: 'trophy', label: 'క్రీడలు', color: '#FF5722'},
    {id: 'health', icon: 'heart-pulse', label: 'ఆరోగ్యం', color: '#4CAF50'},
  ];

  // Set default category if none selected
  useEffect(() => {
    if (!selectedCategory) {
      dispatch(setSelectedCategory('all'));
    }
  }, []);

  const handleCategoryPress = categoryId => {
    dispatch(setSelectedCategory(categoryId));
    navigation.goBack();
  };

  console.log(selectedCategory, '>>>>>>>>>>>>>>>>>>>>>selectedCategory');

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* Header */}
      <View style={[styles.header,{paddingTop:insets.top}]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconButton}>
            <Icon name="cog-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Search')}>
            <Icon name="magnify" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerRight}>
          <Text style={styles.headerTitle}>స్వార్న్</Text>
          <Icon name="chevron-right" size={24} color="#00BFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Title */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={48} color="#CCC" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{reporter?.name || "Harish"}</Text>
            <TouchableOpacity>
              <Text style={styles.profileLink}>
                Click here to select email id
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language & Location Section */}
        <View style={styles.settingsCard}>
          {/* Language */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              navigation.navigate('LanguageSelection', {isOnboarding: false})
            }
            activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
              <Icon name="translate" size={22} color="#E74C3C" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>మీ భాషని ఎంచుకోడి</Text>
              <Text style={styles.settingValue}>తెలుగు Telugu</Text>
            </View>
            <View style={styles.settingArrow}>
              <Icon name="arrow-right" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Location */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('LocationSelection')}
            activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
              <Icon name="map-marker" size={22} color="#E74C3C" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>మీరు ఎందుకున్న స్థానం</Text>
              <Text style={styles.settingValue}>Rajamundry (Change)</Text>
            </View>
            <View style={styles.settingArrow}>
              <Icon name="arrow-right" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories Section - Horizontal Scroll (5 visible) */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {categories.map(category => {
              const isSelected = selectedCategory === category.id;
              console.log(isSelected, '>>>>>>>>>>isSelected');
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  // onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.categoryIconBg,
                      isSelected && {
                        backgroundColor: `${category.color}30`,
                      },
                    ]}>
                    <Icon
                      name={category.icon}
                      size={28}
                      color={category.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && {color: category.color, fontWeight: '700'},
                    ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              navigation.navigate('ContentList', {type: 'magazines'})
            }>
            <View style={styles.menuIconContainer}>
              <Icon name="newspaper" size={18} color="#E74C3C" />
            </View>
            <Text style={styles.menuText}>డిజిటల్ మ్యాగజిన్స్</Text>
            <Icon name="chevron-right" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ContentList', {type: 'videos'})}
            style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="video" size={18} color="#E74C3C" />
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    // paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    padding: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00BFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB6D9',
  },
  avatarContainer: {
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  profileLink: {
    fontSize: 13,
    color: '#00BFFF',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  settingIconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFFF',
  },
  settingArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginVertical: 3,
  },
  categoriesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    alignItems: 'center',
    width: 62,
  },
  categoryIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
});

export default ProfileScreen;
