import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { fetchUnreadNews } from '../redux/reducers/news';
import FlipNewsScreen from './FlipNewsScreen'; // Import the newly updated FlipNewsScreen

const UnreadNewsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const flipScreenRef = useRef(null);

  useEffect(() => {
    // Pass the last seen date here (or pull from settings if needed)
    const lastSeenDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    dispatch(fetchUnreadNews(lastSeenDate));
  }, [dispatch]);

  const handleRefresh = () => {
    const lastSeenDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    dispatch(fetchUnreadNews(lastSeenDate));
  };

  return (
    <View style={styles.container}>
      {/* Absolute Floating Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { top: Math.max(insets.top, 20) + 10 }]} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Icon name="arrow-left" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Render the Flip Screen exactly like the main feed, but pass feedType="unread" */}
      <FlipNewsScreen 
        ref={flipScreenRef}
        feedType="unread" 
        hideUI={() => {}} // Empty function since there's no UI tabs to hide on this screen
        toggleUI={() => {}} // Empty function
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 100, // Make sure it sits above the 3D flipping cards
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  }
});

export default UnreadNewsScreen;