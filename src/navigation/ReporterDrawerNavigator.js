import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your screens
import ReporterDashboardScreen from '../screens/ReporterDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent({navigation}) {
  const menuItems = [
    {
      id: 'home',
      label: 'మై హోమ్',
      icon: 'home-outline',
      screen: 'Dashboard',
      color: '#E74C3C',
    },
    {
      id: 'profile',
      label: 'ప్రొఫైల్',
      icon: 'account-outline',
      screen: 'Profile',
      color: '#666',
    },
    {
      id: 'reporter',
      label: 'రిపోర్టర్',
      icon: 'file-document-outline',
      screen: 'Reports',
      color: '#666',
    },
    {
      id: 'settings',
      label: 'సెబింధనలు',
      icon: 'cog-outline',
      screen: 'Settings',
      color: '#666',
    },
  ];

  const bottomMenuItems = [
    {
      id: 'about',
      label: 'మా గురించి',
      icon: 'information-outline',
      screen: 'About',
    },
    {
      id: 'faq',
      label: 'తరుచు అడిగే ప్రశ్నలు',
      icon: 'help-circle-outline',
      screen: 'FAQ',
    },
    {
      id: 'terms',
      label: 'నిబంధనలు',
      icon: 'file-document-edit-outline',
      screen: 'Terms',
    },
  ];

  return (
    <View style={styles.drawerContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{uri: 'https://i.pravatar.cc/150?img=33'}}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Guest</Text>
            <Text style={styles.profileRole}>Reporter ( 100 Coins )</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="pencil" size={20} color="#666" />
            <Text style={styles.editText}>edit</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}>
              <Icon name={item.icon} size={24} color={item.color} />
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Menu Items */}
        <View style={styles.bottomMenuSection}>
          {bottomMenuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}>
              <Icon name={item.icon} size={24} color="#666" />
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Main Drawer Navigator
function ReporterDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
          backgroundColor: '#FFFFFF',
        },
      }}>
      <Drawer.Screen name="Dashboard" component={ReporterDashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6F8',
    marginBottom: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E0E0E0',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 13,
    color: '#E74C3C',
    fontWeight: '600',
  },
  editButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  editText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginVertical: 16,
    marginHorizontal: 20,
  },
  bottomMenuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default ReporterDrawerNavigator;
