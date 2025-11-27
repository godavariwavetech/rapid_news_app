import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

function Header({onProfilePress, onTogglePress,title}) {
  return (
    <View style={styles.container}>
      {/* Left - Profile Icon */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onProfilePress}
        activeOpacity={0.7}>
        <Icon name="account-circle" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Center - న్యూస్ Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right - Hide/Show Toggle Icon */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onTogglePress}
        activeOpacity={0.7}>
        <Icon name="eye-off-outline" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 70% opacity
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default Header;
