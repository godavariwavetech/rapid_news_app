import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/api'; 

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

function Header({ onProfilePress, onTogglePress, title }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch the unread count when the component mounts
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/news/unread/count');
        if (response.data && response.data.unread_news !== undefined) {
          setUnreadCount(response.data.unread_news);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  return (
    <View style={styles.container}>
      {/* Left - Profile Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onProfilePress}
        activeOpacity={0.7}>
        <Icon name="account-circle" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Center - Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right - Hide/Show Toggle Icon with Unread Badge */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onTogglePress}
        activeOpacity={0.7}>
        <Icon name="eye-off-outline" size={24} color="#FFFFFF" />
        
        {/* Render the badge only if there's at least 1 unread item */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', 
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#E53935', 
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.85)', 
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;