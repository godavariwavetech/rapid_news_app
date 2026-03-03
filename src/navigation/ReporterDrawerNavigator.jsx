import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { CommonActions, useNavigationState } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Logic & Theme Imports
import { logout } from '../redux/reducers/auth';
import { fonts } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

// Import your screens
import ReporterDashboardScreen from '../screens/ReporterDashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReporterProfileScreen from '../screens/ReporterProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  const { reporter } = useSelector(state => state.auth);
  
  // Get current route name
  const state = useNavigationState(state => state);
  const currentRoute = state?.routes[state.index]?.name;

  const menuItems = [
    {
      id: 'home',
      label: 'మై హోమ్',
      icon: 'home-variant-outline',
      screen: 'ReporterDashboard',
    },
    {
      id: 'reporter',
      label: 'రిపోర్ట్',
      icon: 'file-document-outline',
      screen: 'Reports',
    },
    {
      id: 'settings',
      label: 'నిబంధనలు',
      icon: 'cog-outline',
      screen: 'Settings',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout from your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            dispatch(logout());
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }], 
              })
            );
            await AsyncStorage.clear();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.drawerContainer, {paddingTop: insets.top, backgroundColor: theme.background}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        {/* Professional Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
          <Image
            source={{
              uri:
                reporter?.profile_image || 'https://i.pravatar.cc/150?img=33',
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {reporter?.reporter_profile?.username || 'Guest'}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textSecondary }]}>Reporter Desk</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}>
            <Icon name="pencil-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(item => {
            const isActive = currentRoute === item.screen;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && [styles.menuItemActive, { backgroundColor: isDarkMode ? '#222' : '#F5F5F5' }]]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}>
                <Icon
                  name={item.icon}
                  size={24}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[styles.menuText, { color: theme.textSecondary }, isActive && [styles.menuTextActive, { color: theme.primary }]]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]} />

        {/* Support Section */}
        <View style={styles.bottomMenuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="information-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.menuText, { color: theme.textSecondary }]}>మా గురించి</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.menuText, { color: theme.textSecondary }]}>ప్రశ్నలు</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Button Fixed at Bottom */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: isDarkMode ? '#1A1A1A' : '#F9F9F9', marginBottom: Math.max(insets.bottom, 20)},
        ]}
        onPress={handleLogout}>
        <Icon name="logout" size={22} color={isDarkMode ? theme.error : "#000"} />
        <Text style={[styles.logoutText, { color: isDarkMode ? theme.error : "#000" }]}>Logout Account</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main Drawer Navigator
function ReporterDrawerNavigator() {
  const { theme, isDarkMode } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
          backgroundColor: theme.background,
        },
      }}>
      <Drawer.Screen name="ReporterDashboard" component={ReporterDashboardScreen} />
      <Drawer.Screen name="Profile" component={ReporterProfileScreen} />
      <Drawer.Screen name="EditProfile" component={EditProfileScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  profileRole: {
    fontSize: 12,
    fontFamily: fonts.medium,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  editButton: {
    padding: 5,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: { },
  menuText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginLeft: 16,
  },
  menuTextActive: { },
  divider: {
    height: 1,
    marginVertical: 15,
    marginHorizontal: 28,
  },
  bottomMenuSection: {
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginLeft: 16,
  },
});

export default ReporterDrawerNavigator;
