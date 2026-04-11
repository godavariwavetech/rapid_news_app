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
import { lightTheme, darkTheme } from '../config/theme';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const CommentsBottomSheet = ({visible, onClose, newsId, newsTitle}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Selectors for news data
  const { currentComments, isLoadingComments, isPostingComment } = useSelector(
    state => state.news
  );

  // Selectors for authentication status
  const { isAuthenticated, userToken, reporterToken, reporter, user } = useSelector(
    state => state.auth
  );

  const [commentText, setCommentText] = useState('');
  const [modalVisible, setModalVisible] = useState(visible);
  
  // Logic to determine if the user is logged in
  const hasToken = !!(userToken || reporterToken || isAuthenticated);

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
    // Stop the user if no token is found (Fallback safeguard)
    if (!hasToken) return;
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
        
        <View style={[styles.sheetContent, { backgroundColor: theme.background }]}>
          <View style={[styles.handleBarContainer, { backgroundColor: theme.background }]}>
             <View style={[styles.handleBar, { backgroundColor: isDarkMode ? '#444' : '#DDD' }]} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={{ flex: 1 }}>
              <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                    <Icon name="arrow-left" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    {newsTitle || 'Comments'}
                  </Text>
                </View>
              </View>

              {isLoadingComments ? (
                <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F6F8' }]}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : (
                <ScrollView
                  style={[styles.content, { backgroundColor: isDarkMode ? '#121212' : '#F5F6F8' }]}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}>
                  
                  {currentComments && currentComments.length > 0 ? (
                    currentComments.map((comment, index) => {
                      const isSame = comment?.user?._id === reporter?._id;
                      const userName = comment.user?.name || 'User';
                      const userInitial = userName.charAt(0).toUpperCase();
                      const timeString = comment.createdAt 
                        ? new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : '';

                      return (
                        <View key={comment._id || index} style={styles.commentCard}>
                          <View style={styles.commentLeft}>
                            <View style={[styles.avatar, {backgroundColor: isDarkMode ? '#333' : '#E8D5F5'}]}>
                              <Text style={[styles.avatarText, { color: isDarkMode ? '#FFF' : '#333' }]}>{userInitial}</Text>
                            </View>
                          </View>

                          <View style={styles.commentRight}>
                            <View style={[styles.commentBubble, {backgroundColor: isDarkMode ? '#222' : '#F5F6F8'}]}>
                              <View style={styles.commentHeader}>
                                <Text style={[styles.username, { color: theme.text }]}>{userName} {isSame && '(You)'}</Text>
                              </View>
                              <Text style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</Text>
                            </View>

                            <View style={styles.commentActions}>
                              <Text style={[styles.commentTime, { color: theme.textSecondary }]}>{timeString}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No comments yet.</Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* Guarded Input Container */}
              {!hasToken ? (
                <View style={[styles.loginPromptContainer, { backgroundColor: theme.background, borderTopColor: isDarkMode ? '#333' : '#E8EAED', paddingBottom: Math.max(insets.bottom, 16) }]}>
                  <Icon name="lock-outline" size={22} color={theme.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.loginPromptText, { color: theme.textSecondary }]}>
                    Please login to post a comment
                  </Text>
                </View>
              ) : (
                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: isDarkMode ? '#333' : '#E8EAED', paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#222' : '#F5F6F8', color: theme.text }]}
                    placeholder="Write a comment..."
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton, 
                      (!commentText.trim()) && { backgroundColor: '#ccc' }
                    ]}
                    onPress={handleSendComment}
                    disabled={isPostingComment || (hasToken && !commentText.trim())}
                    activeOpacity={0.8}>
                    {isPostingComment ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Icon name="send" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
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
  },
  commentText: {
    fontSize: 14,
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
  },
  
  // Login Prompt Styles
  loginPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  loginPromptText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
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