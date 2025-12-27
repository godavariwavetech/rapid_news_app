import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {height} = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.9;

const CommentsScreen = ({visible, onClose, newsId, newsTitle}) => {
  const [commentText, setCommentText] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
    {
      id: 2,
      number: 2,
      avatar: '#A8D8EA',
      username: 'rajendradeverap',
      location: 'కృష్ణా',
      text: 'పరిస్థితి ఆందోళన కలిగిస్తోంది. అందరూ సురక్షితంగా ఉండాలని కోరుకుంటున్నాం. అధికారులు స్పందన తప్పదు ఉండాలి.',
      time: '0 secs ago',
      likes: 12,
      liked: false,
      color: '#D5EDF8',
    },
    {
      id: 3,
      number: 3,
      avatar: '#FFB3BA',
      username: 'rajendradeverap',
      location: 'కృష్ణా',
      text: 'వద్దాలు, గాలుల తీవ్రత గురించి స్పష్టమైన వివరాలు ఇచ్చినందుకు ధన్యవాదాలు. ప్రజలు జాగ్రత్తగా ఉండాలి.',
      time: '0 secs ago',
      likes: 12,
      liked: false,
      color: '#FFDEE5',
    },
    {
      id: 4,
      number: 4,
      avatar: '#FFFFBA',
      username: 'rajendradeverap',
      location: 'కృష్ణా',
      text: 'మాలిక సదుపాయాలు దెబ్బతిన్నాయని వినడం విచారకరం. ఆత్మసనర బుంధాలు వేగంగా స్థానిస్తుస్తాము అభినందలు.',
      time: '0 secs ago',
      likes: 12,
      liked: false,
      color: '#FFFDE5',
    },
  ]);

  const handleLike = commentId => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !comment.liked,
              likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    );
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: comments.length + 1,
        number: comments.length + 1,
        avatar: '#BAE1FF',
        username: 'You',
        location: 'కృష్ణా',
        text: commentText,
        time: 'Just now',
        likes: 0,
        liked: false,
        color: '#E3F2FD',
      };
      setComments([newComment, ...comments]);
      setCommentText('');
    }
  };

  const handleReply = commentId => {
    console.log('Reply to comment:', commentId);
  };

  const handleCopy = text => {
    console.log('Copy text:', text);
  };

  const handleReport = commentId => {
    console.log('Report comment:', commentId);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
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
                {/* Avatar and Number */}
                <View style={styles.commentLeft}>
                  <View
                    style={[styles.avatar, {backgroundColor: comment.avatar}]}>
                    <Text style={styles.avatarText}>{comment.number}</Text>
                  </View>
                </View>

                {/* Comment Content */}
                <View style={styles.commentRight}>
                  <View
                    style={[
                      styles.commentBubble,
                      {backgroundColor: comment.color},
                    ]}>
                    {/* Username and Location */}
                    <View style={styles.commentHeader}>
                      <Text style={styles.username}>{comment.username}</Text>
                      <View style={styles.locationRow}>
                        <Icon name="map-marker" size={14} color="#666" />
                        <Text style={styles.location}>{comment.location}</Text>
                      </View>
                    </View>

                    {/* Comment Text */}
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>

                  {/* Comment Actions */}
                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleReply(comment.id)}>
                        <Icon name="reply" size={18} color="#666" />
                        <Text style={styles.actionText}>Reply</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCopy(comment.text)}>
                        <Icon name="content-copy" size={18} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleReport(comment.id)}>
                        <Icon
                          name="alert-octagon-outline"
                          size={18}
                          color="#666"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLike(comment.id)}>
                        <Icon
                          name={comment.liked ? 'heart' : 'heart-outline'}
                          size={18}
                          color={comment.liked ? '#FF3B30' : '#666'}
                        />
                        <Text
                          style={[
                            styles.likeCount,
                            comment.liked && {color: '#FF3B30'},
                          ]}>
                          {comment.likes}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={{height: 20}} />
          </ScrollView>

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="కామెంట్ చేయండి"
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity style={styles.textButton} activeOpacity={0.7}>
              <Icon name="format-text" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
              <Icon name="emoticon-happy-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendComment}
              activeOpacity={0.8}>
              <Icon name="send" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FF3B30',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  commentLeft: {
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  commentRight: {
    flex: 1,
  },
  commentBubble: {
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    marginBottom: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
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
    gap: 12,
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
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  textButton: {
    padding: 4,
  },
  emojiButton: {
    padding: 4,
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

export default CommentsScreen;
