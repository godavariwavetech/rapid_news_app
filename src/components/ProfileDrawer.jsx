import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../config/theme';

const {width, height} = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;

const ProfileDrawer = ({visible, onClose}) => {
  const {reporter} = useSelector(state=>state.auth);
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const categories = [
    {id: 'education', icon: 'school', label: 'మీ కోసం', color: '#4ECDC4'},
    {id: 'politics', icon: 'account-tie', label: 'రాజకీయాలు', color: '#9B59B6'},
    {id: 'news', icon: 'newspaper-variant', label: 'న్యూస్', color: '#E74C3C'},
    {id: 'business', icon: 'chart-line', label: 'వ్యాపారం', color: '#F39C12'},
    {id: 'cinema', icon: 'movie-open', label: 'సినిమా', color: '#3498DB'},
  ];

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
        
        <View style={[styles.drawer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>న్యూస్</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Icon name="cog-outline" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchButton}>
              <Icon name="magnify" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9F9F9', borderColor: isDarkMode ? '#333' : '#FFB6D9' }]}>
                <View style={styles.avatarContainer}>
                  <Icon name="account-circle" size={60} color={isDarkMode ? '#555' : '#CCC'} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.text }]}>{reporter?.reporter_profile?.username || "Guest"}</Text>
                  <TouchableOpacity>
                    <Text style={[styles.profileLink, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>Click here to select email id</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Language & Location Section */}
            <View style={[styles.settingsSection, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF5F0' }]}>
              {/* Language */}
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.settingIcon}>
                  <Icon name="translate" size={28} color="#E74C3C" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>మీ భాషని ఎంచుకోడి</Text>
                  <Text style={[styles.settingValue, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>తెలుగు Telugu</Text>
                </View>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Location */}
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.settingIcon}>
                  <Icon name="map-marker" size={28} color="#E74C3C" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>మీరు ఎంచుకున్న స్థానం</Text>
                  <Text style={[styles.settingValue, { color: isDarkMode ? theme.primary : '#00BFFF' }]}>Rajamundry (Change)</Text>
                </View>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Categories Section */}
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(category => (
                  <TouchableOpacity key={category.id} style={styles.categoryCard}>
                    <View style={[styles.categoryIcon, {backgroundColor: category.color}]}>
                      <Icon name={category.icon} size={32} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.categoryLabel, { color: theme.text }]}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.menuIcon}>
                  <Icon name="newspaper" size={24} color="#E74C3C" />
                </View>
                <Text style={[styles.menuText, { color: theme.text }]}>డిజిటల్ మ్యాగజిన్స్</Text>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.menuIcon}>
                  <Icon name="video" size={24} color="#E74C3C" />
                </View>
                <Text style={[styles.menuText, { color: theme.text }]}>వీడియోస్</Text>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.menuIcon}>
                  <Icon name="bullhorn" size={24} color="#E74C3C" />
                </View>
                <Text style={[styles.menuText, { color: theme.text }]}>వైరల్</Text>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.menuIcon}>
                  <Icon name="star" size={24} color="#E74C3C" />
                </View>
                <Text style={[styles.menuText, { color: theme.text }]}>సిటీ న్యూస్ ఎక్స్క్లూసివ్</Text>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
                <View style={styles.menuIcon}>
                  <Icon name="settings" size={24} color="#E74C3C" />
                </View>
                <Text style={[styles.menuText, { color: theme.text }]}>సంప్రదింపండి</Text>
                <Icon name="chevron-right" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{height: 40}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: height,
    shadowColor: '#000',
    shadowOffset: {width: -2, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00BFFF',
    flex: 1,
  },
  settingsButton: {
    padding: 4,
  },
  searchButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB6D9',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileLink: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '500',
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF5F0',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  settingIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFFF',
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: (DRAWER_WIDTH - 64) / 5,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  menuIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});

export default ProfileDrawer;
