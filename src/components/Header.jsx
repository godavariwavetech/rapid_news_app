import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnreadNewsCount } from '../redux/reducers/news'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

function Header({ onProfilePress, onTogglePress, title }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // Grab the global unread count from Redux
  const unreadCount = useSelector(state => state.news.unreadCount) || 0;

  // Fetch the unread count when the component mounts using the new Thunk
  useEffect(() => {
    dispatch(fetchUnreadNewsCount());
  }, [dispatch]);

  const dynamicPaddingTop = Platform.OS === 'android' 
    ? Math.max(insets.top, StatusBar.currentHeight || 0) + 8 
    : Math.max(insets.top, 44);


    console.log(unreadCount,">>>>>>>>>>>>>>>>>>>>unreadCount");

  return (
    <View style={[styles.container,{ paddingTop: dynamicPaddingTop }]}>
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
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
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