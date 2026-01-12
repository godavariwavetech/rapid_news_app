import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const NewsDetailModal = ({ visible, newsItem, onClose }) => {
  if (!newsItem) return null;

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#FF9D00';
      case 'APPROVED': return '#28A745';
      case 'REJECTED': return '#DC3545';
      default: return '#C2C2C2';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'పరిశీలనలో ఉంది';
      case 'APPROVED': return 'ఆమోదించబడింది';
      case 'REJECTED': return 'తిరస్కరించబడింది';
      default: return status;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with Close Button */}
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>వార్త వివరాలు</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Full Image */}
            <View style={styles.imageContainer}>
              {newsItem.images && newsItem.images.length > 0 ? (
                <Image
                  source={{ uri: newsItem.images[0] }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.fullImage, styles.placeholderImage]}>
                  <Icon name="image-off" size={40} color="#C2C2C2" />
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{newsItem.content?.title}</Text>

            {/* Meta Info Row */}
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(newsItem.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(newsItem.status)}</Text>
              </View>
              <Text style={styles.dateText}>{formatTime(newsItem.createdAt)}</Text>
            </View>

            {/* Full Body */}
            <View style={styles.bodyContainer}>
              <Text style={styles.bodyText}>
                {newsItem.content?.body}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    padding: 16,
    paddingBottom: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#666',
    fontSize: 13,
  },
  bodyContainer: {
    padding: 16,
    paddingTop: 0,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default NewsDetailModal;