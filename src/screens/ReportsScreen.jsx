import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getReporterNews } from '../redux/reducers/news';
import { fonts } from '../config/theme';
import NewsDetailModal from '../components/NewsDetailModal';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReportsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Redux State
  const { reporterNews, loading } = useSelector(state => state.news);
  const { reporterStats } = useSelector(state => state.profile);

  // Local State for Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    dispatch(getReporterNews());
  }, [dispatch]);

  // Actions
  const handleNewsPress = (item) => {
    setSelectedNews(item);
    setModalVisible(true);
  };

  const handleEditNews = (item) => {
    navigation.navigate('NewsSubmissionStep3', {
      existingNews: item,
      location: 'Saved Location' 
    });
  };

  // Formatters
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#F5A623'; // Warmer orange for pending
      case 'APPROVED': return '#28A745';
      case 'REJECTED': return '#DC3545';
      default: return '#888888';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'పరిశీలనలో ఉంది';
      case 'APPROVED': return 'ఆమోదించబడింది';
      case 'REJECTED': return 'తిరస్కరించబడింది';
      default: return status || 'Unknown';
    }
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.newsCard}
      activeOpacity={0.7}
      onPress={() => handleNewsPress(item)}
    >
      <View style={styles.imageWrapper}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.newsImage} />
        ) : (
          <View style={[styles.newsImage, styles.placeholderImage]}>
            <Icon name="image-off" size={24} color="#C2C2C2" />
          </View>
        )}
      </View>

      <View style={styles.newsContent}>
        <View style={styles.headingRow}>
          <Text style={styles.newsTitle} numberOfLines={2}>
            {item.content?.te?.title || item.content?.title || 'No Title Available'}
          </Text>
        {item?.status?.toUpperCase()=="PENDING" &&  <TouchableOpacity 
            onPress={() => handleEditNews(item)} 
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="pencil-outline" size={18} color="#6B7280" />
          </TouchableOpacity>}
        </View>
        
        <View style={styles.newsItemFooter}>
          <View style={styles.timeContainer}>
            <Icon name="clock-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>రిపోర్ట్స్</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={reporterNews}
        keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
        renderItem={renderNewsItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Redesigned Professional Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#1F2937' }]}>{reporterStats?.total_submitted || 0}</Text>
                <Text style={styles.statLabel}>మొత్తం</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#28A745' }]}>{reporterStats?.total_approved || 0}</Text>
                <Text style={styles.statLabel}>లైవ్</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#DC3545' }]}>{reporterStats?.total_rejected || 0}</Text>
                <Text style={styles.statLabel}>రిజెక్ట్</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>నా స్టోరీస్ జాబితా</Text>
              <Text style={styles.storyCount}>{reporterNews?.length || 0} Stories</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#1F2937" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="newspaper-variant-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyStateText}>వార్తలు అందుబాటులో లేవు</Text>
              <Text style={styles.emptyStateSubText}>మీరు ఇంకా ఎలాంటి స్టోరీస్ పోస్ట్ చేయలేదు.</Text>
            </View>
          )
        }
      />

      <NewsDetailModal 
        visible={modalVisible} 
        newsItem={selectedNews} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#111827' },
  placeholder: { width: 34 },
  scrollContent: { 
    paddingHorizontal: 12, 
    paddingTop: 16,
    paddingBottom: 40,
  },
  
  // --- Professional Stats Card ---
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    marginHorizontal: 6, 
    marginTop: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4, 
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statNumber: { 
    fontSize: 28, 
    fontFamily: fonts.bold, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 13, 
    color: '#6B7280', 
    fontFamily: fonts.medium 
  },
  
  // --- Section Header ---
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 6, 
  },
  sectionTitle: { 
    fontSize: 17, 
    fontFamily: fonts.bold, 
    color: '#111827', 
  },
  storyCount: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  // --- Redesigned Professional News Card ---
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 6,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageWrapper: { 
    width: 90, 
    height: 90, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  newsImage: { 
    width: '100%', 
    height: '100%',
    resizeMode: 'cover'
  },
  placeholderImage: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  newsContent: { 
    flex: 1, 
    marginLeft: 14,
    justifyContent: 'center', // Fix applied: aligns items vertically in the center
    paddingVertical: 2,
  },
  headingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  newsTitle: { 
    flex: 1, 
    fontSize: 15, 
    fontFamily: fonts.bold, 
    color: '#111827', 
    lineHeight: 22,
    paddingRight: 10,
  },
  editButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  newsItemFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 12, // Fix applied: specifies the exact gap between title and footer
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: { 
    fontSize: 12, 
    fontFamily: fonts.medium, 
    color: '#6B7280' 
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20,
  },
  statusText: { 
    fontSize: 11, 
    fontFamily: fonts.bold, 
  },
  
  // Empty state
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: { 
    color: '#4B5563', 
    fontSize: 16, 
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  emptyStateSubText: {
    color: '#9CA3AF', 
    fontSize: 14, 
    fontFamily: fonts.medium,
  }
});

export default ReportsScreen;