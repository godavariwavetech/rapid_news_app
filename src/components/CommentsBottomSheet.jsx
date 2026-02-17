import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getComments, postComment } from '../redux/reducers/news';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const CommentsBottomSheet = ({visible, onClose, newsId, newsTitle}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // Selectors for news data
  const { currentComments, isLoadingComments, isPostingComment } = useSelector(
    state => state.news
  );

  // Selectors for authentication status
  const { isAuthenticated, userToken, reporterToken } = useSelector(
    state => state.auth
  );

  const [commentText, setCommentText] = useState('');
  const [modalVisible, setModalVisible] = useState(visible);
  
  // Logic to determine if the user is logged in
  const hasToken = userToken || reporterToken || isAuthenticated;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      if (newsId) {
        dispatch(getComments(newsId));
      }
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        if (onClose) onClose(); 
      });
    }
  }, [visible, newsId, dispatch]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleSendComment = () => {
    // Stop the user if no token is found
    if (!hasToken) {
      Alert.alert(
        'Login Required',
        'Please login to post a comment.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!commentText.trim()) return;

    dispatch(postComment({ newsId, text: commentText }))
      .unwrap()
      .then(() => {
        setCommentText(''); 
      })
      .catch((err) => {
        console.error("Failed to post comment:", err);
      });
  };

  if (!modalVisible) return null;

  console.log(currentComments,">>>>>>>>>>COMMENTS");

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.backdropContainer, {opacity}]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{translateY}] },
        ]}>
        
        <View style={styles.sheetContent}>
          <View style={styles.handleBarContainer}>
             <View style={styles.handleBar} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}>
            
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                  <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {newsTitle || 'Comments'}
                </Text>
              </View>
            </View>

            {isLoadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
              </View>
            ) : (
              <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}>
                
                {currentComments && currentComments.length > 0 ? (
                  currentComments.map((comment, index) => {
                    const userName = comment.user_id?.name || 'User';
                    const userInitial = userName.charAt(0).toUpperCase();
                    const timeString = comment.createdAt 
                      ? new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : '';

                    return (
                      <View key={comment._id || index} style={styles.commentCard}>
                        <View style={styles.commentLeft}>
                          <View style={[styles.avatar, {backgroundColor: '#E8D5F5'}]}>
                            <Text style={styles.avatarText}>{userInitial}</Text>
                          </View>
                        </View>

                        <View style={styles.commentRight}>
                          <View style={[styles.commentBubble, {backgroundColor: '#F5F6F8'}]}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.username}>{userName}</Text>
                            </View>
                            <Text style={styles.commentText}>{comment.text}</Text>
                          </View>

                          <View style={styles.commentActions}>
                            <Text style={styles.commentTime}>{timeString}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No comments yet.</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Guarded Input Container */}
            <View style={[styles.inputContainer, {marginBottom: insets.bottom}]}>
              <TextInput
                style={[styles.input, !hasToken && { backgroundColor: '#f0f0f0' }]}
                placeholder={hasToken ? "Write a comment..." : "Login to comment"}
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                editable={hasToken!= null} // Disable typing if not authenticated
              />
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!commentText.trim() || !hasToken) && { backgroundColor: '#ccc' }
                ]}
                onPress={handleSendComment}
                disabled={isPostingComment || !commentText.trim() || !hasToken}
                activeOpacity={0.8}>
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Icon name="send" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '95%',
    zIndex: 2,
  },
  sheetContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  keyboardContainer: {
    flex: 1,
  },
  handleBarContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  commentCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentLeft: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  commentRight: {
    flex: 1,
  },
  commentBubble: {
    borderRadius: 16,
    padding: 7,
    borderTopLeftRadius: 4,
  },
  commentHeader: {
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    paddingHorizontal: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CommentsBottomSheet;