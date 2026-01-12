import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { reactToNews, getComments, postComment } from '../redux/reducers/news';

const NewsInteractions = ({ newsId, likeCount = 0, commentCount = 0 }) => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Select specific data from Redux
  const { currentComments, isLoadingComments, isPostingComment } = useSelector(
    (state) => state.news
  );

  // --- Actions ---

  const handleReaction = (type) => {
    // type is "LIKE" or "DISLIKE"
    dispatch(reactToNews({ newsId, type }));
  };

  const openComments = () => {
    setModalVisible(true);
    dispatch(getComments(newsId));
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    
    dispatch(postComment({ newsId, text: commentText }))
      .unwrap()
      .then(() => {
        setCommentText(''); // Clear input on success
      })
      .catch((err) => console.log("Comment failed", err));
  };

  // --- Render Item ---
  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.user_name ? item.user_name[0].toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.commentBubble}>
        <Text style={styles.commentUser}>{item.user_name || 'User'}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        {item.created_at && (
            <Text style={styles.commentTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Interaction Bar */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          {/* Like Button */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleReaction('LIKE')}
          >
            <Icon name="thumb-up-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{likeCount > 0 ? likeCount : 'Like'}</Text>
          </TouchableOpacity>

          {/* Dislike Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleReaction('DISLIKE')}
          >
            <Icon name="thumb-down-outline" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionButton} onPress={openComments}>
          <Icon name="comment-text-outline" size={22} color="#666" />
          <Text style={styles.actionText}>{commentCount > 0 ? commentCount : 'Comments'}</Text>
        </TouchableOpacity>

        {/* Share Button (Placeholder) */}
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-variant-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* List */}
            {isLoadingComments ? (
              <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={currentComments}
                renderItem={renderCommentItem}
                keyExtractor={(item, index) => item._id || index.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                }
              />
            )}

            {/* Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !commentText.trim() && styles.disabledButton]} 
                  onPress={handleSubmitComment}
                  disabled={isPostingComment || !commentText.trim()}
                >
                  {isPostingComment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Icon name="send" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F1F4',
    marginTop: 10,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 12,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 0,
  },
  commentUser: {
    fontWeight: '700',
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    color: '#444',
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
});

export default NewsInteractions;