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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const CommentsBottomSheet = ({visible, onClose, newsId, newsTitle}) => {
  const [commentText, setCommentText] = useState('');
  const insets = useSafeAreaInsets()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Controls the actual visibility of the Modal component
  const [modalVisible, setModalVisible] = useState(visible);
  
  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current; // For the background dimming

  // Mock data (kept same)
  const [comments, setComments] = useState([
    {
      id: 1,
      number: 1,
      avatar: '#C8A2E0',
      username: 'rajendradeverap',
      location: 'కృష్ణా',
      text: 'ఈ సమాచారం చాలా ఉపయోగకరంగా ఉంది. పరిస్థితి తీవ్రమైన తెలుస్తోంది. దయచేసి మరిన్ని అప్డేట్స్ ఇవ్వండి.',
      time: '0 secs ago',
      likes: 12,
      liked: false,
      color: '#E8D5F5',
    },
    // ... other items
  ]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // Wait for mount, then animate IN
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
      // Animate OUT
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
        if (onClose) onClose(); // Ensure parent state is synced
      });
    }
  }, [visible]);

  const handleClose = () => {
    // Trigger the close animation via the prop update or local logic
    if (onClose) onClose();
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      setCommentText('');
    }
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
      {/* 1. Animated Background Overlay (Fades In/Out) */}
      <Animated.View style={[styles.backdropContainer, {opacity}]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
      </Animated.View>

      {/* 2. Sliding Sheet Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{translateY}],
          },
        ]}>
        
        {/* White Background Container */}
        <View style={styles.sheetContent}>
          {/* Handle Bar */}
          <View style={styles.handleBarContainer}>
             <View style={styles.handleBar} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                  <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {newsTitle || 'కాకినాడను తాకిన మరిన్ని తుఫాను...'}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.notificationLabel}>నోటిఫికేషన్</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    notificationsEnabled && styles.toggleActive,
                  ]}
                  onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.toggleThumb,
                      notificationsEnabled && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentLeft}>
                    <View
                      style={[styles.avatar, {backgroundColor: comment.avatar}]}>
                      <Text style={styles.avatarText}>{comment.number}</Text>
                    </View>
                  </View>

                  <View style={styles.commentRight}>
                    <View
                      style={[
                        styles.commentBubble,
                        {backgroundColor: comment.color},
                      ]}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.username}>{comment.username}</Text>
                        <View style={styles.locationRow}>
                          <Icon name="map-marker" size={14} color="#666" />
                          <Text style={styles.location}>{comment.location}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>

                    <View style={styles.commentActions}>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionButton}>
                          <Icon name="reply" size={18} color="#666" />
                          <Text style={styles.actionText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <View style={{height: 20}} />
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer,{marginBottom:insets.bottom}]}>
              <TextInput
                style={styles.input}
                placeholder="కామెంట్ చేయండి"
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendComment}
                activeOpacity={0.8}>
                <Icon name="send" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // This view covers the whole screen behind the sheet
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  // This is the sliding sheet itself
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '95%', // Almost full screen
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FF3B30',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  commentCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    padding: 14,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
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