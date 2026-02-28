import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

function Header({onProfilePress, onTogglePress, title}) {
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

      {/* Right - Hide/Show Toggle Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        // onPress={onTogglePress}
        activeOpacity={0.7}>
        {/* <Icon name="eye-off-outline" size={24} color="#FFFFFF" /> */}
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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default Header;
