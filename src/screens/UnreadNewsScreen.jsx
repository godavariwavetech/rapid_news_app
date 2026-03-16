import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { fetchUnreadNews, markUnreadNewsAsRead } from '../redux/reducers/news';
import FlipNewsScreen from './FlipNewsScreen'; 
import CommentsBottomSheet from '../components/CommentsBottomSheet'; 

const UnreadNewsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const flipScreenRef = useRef(null);

  // --- 1. Use state instead of refs for the bottom sheet (Mimicking HomeScreen) ---
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    // 1. Fetch unread news
    const lastSeenDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    dispatch(fetchUnreadNews(lastSeenDate));

    // 2. Dispatch the thunk to mark feed as read
    dispatch(markUnreadNewsAsRead());
    
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

      <FlipNewsScreen 
        ref={flipScreenRef}
        feedType="unread" 
        hideUI={() => {}} 
        toggleUI={() => {}} 
        onRefresh={handleRefresh}
        // --- 2. Pass the handler exactly like HomeScreen ---
        onCommentsPress={(item) => { 
          setSelectedNews(item); 
          setCommentsVisible(true); 
        }} 
      />

      {/* --- 3. Render the Comments Modal with conditional visibility --- */}
      {commentsVisible && (
        <View style={styles.commentContainer}>
          <CommentsBottomSheet
            visible={commentsVisible}
            onClose={() => setCommentsVisible(false)}
            newsId={selectedNews?.id}
            newsTitle={selectedNews?.title}
          />
        </View>
      )}
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
  },
  // Add this container style from HomeScreen to ensure it mounts properly over the UI
  commentContainer: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 200 
  }
});

export default UnreadNewsScreen;