import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnreadNews, fetchUnreadNewsCount } from '../redux/reducers/news';
import FlipNewsScreen from './FlipNewsScreen'; 
import CommentsBottomSheet from '../components/CommentsBottomSheet'; 

const UnreadNewsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const flipScreenRef = useRef(null);
  const lastSeenDateRef = useRef(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { unreadPage, unreadHasMore } = useSelector(state => state.news);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    dispatch(fetchUnreadNews({ lastSeenAt: lastSeenDateRef.current, page: 1 }));
    return () => {
      setTimeout(() => dispatch(fetchUnreadNewsCount()), 500);
    };
  }, [dispatch]);

  const handleRefresh = () => {
    lastSeenDateRef.current = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    dispatch(fetchUnreadNews({ lastSeenAt: lastSeenDateRef.current, page: 1 }));
  };

  const handleEndReached = () => {
    if (!unreadHasMore) return;
    dispatch(fetchUnreadNews({ lastSeenAt: lastSeenDateRef.current, page: unreadPage + 1 }));
  };

  return (
    <View style={styles.container}>
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
        onEndReached={handleEndReached}
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
  container: { flex: 1, backgroundColor: '#000000' },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  commentContainer: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 200 
  }
});

export default UnreadNewsScreen;