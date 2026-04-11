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
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReportsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  
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
      case 'PENDING': return '#F5A623'; 
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
      style={[styles.newsCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#F3F4F6' }]}
      activeOpacity={0.7}
      onPress={() => handleNewsPress(item)}
    >
      <View style={[styles.imageWrapper, { backgroundColor: isDarkMode ? '#222' : '#F9FAFB', borderColor: isDarkMode ? '#333' : '#F3F4F6' }]}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.newsImage} />
        ) : (
          <View style={[styles.newsImage, styles.placeholderImage]}>
            <Icon name="image-off" size={24} color={isDarkMode ? '#444' : "#C2C2C2"} />
          </View>
        )}
      </View>

      <View style={styles.newsContent}>
        <View style={styles.headingRow}>
          <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>
            {item.content?.te?.title || item.content?.title || 'No Title Available'}
          </Text>
        {item?.status?.toUpperCase()=="PENDING" &&  <TouchableOpacity 
            onPress={() => handleEditNews(item)} 
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="pencil-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>}
        </View>
        
        <View style={styles.newsItemFooter}>
          <View style={styles.timeContainer}>
            <Icon name="clock-outline" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formatTime(item.createdAt)}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#E5E7EB' }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>రిపోర్ట్స్</Text>
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
            <View style={[styles.statsCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#F3F4F6' }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{reporterStats?.total_submitted || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>మొత్తం</Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }]} />
              
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#28A745' }]}>{reporterStats?.total_approved || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>లైవ్</Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }]} />
              
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#DC3545' }]}>{reporterStats?.total_rejected || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>రిజెక్ట్</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>నా స్టోరీస్ జాబితా</Text>
              <Text style={[styles.storyCount, { color: theme.textSecondary }]}>{reporterNews?.length || 0} Stories</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="newspaper-variant-outline" size={48} color={isDarkMode ? '#333' : "#D1D5DB"} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>వార్తలు అందుబాటులో లేవు</Text>
              <Text style={[styles.emptyStateSubText, { color: isDarkMode ? '#444' : '#9CA3AF' }]}>మీరు ఇంకా ఎలాంటి స్టోరీస్ పోస్ట్ చేయలేదు.</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 10 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold },
  placeholder: { width: 34 },
  scrollContent: { 
    paddingHorizontal: 12, 
    paddingTop: 16,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 24,
    marginHorizontal: 6, 
    marginTop: 6,
    marginBottom: 24,
    elevation: 4, 
    borderWidth: 1,
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
  },
  statNumber: { 
    fontSize: 28, 
    fontFamily: fonts.bold, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 13, 
    fontFamily: fonts.medium 
  },
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
  },
  storyCount: {
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 6,
    marginTop: 6,
    marginBottom: 12,
    elevation: 3,
    borderWidth: 1,
  },
  imageWrapper: { 
    width: 90, 
    height: 90, 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1,
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
    justifyContent: 'center', 
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
    marginTop: 12, 
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: { 
    fontSize: 12, 
    fontFamily: fonts.medium, 
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
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: { 
    fontSize: 16, 
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 14, 
    fontFamily: fonts.medium,
  }
});

export default ReportsScreen;
