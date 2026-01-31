import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MyStoriesScreen from './MyStoriesScreen';
import TopReportersScreen from './TopReportersScreen';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getReporterNews } from '../redux/reducers/news';
import NewsDetailModal from '../components/NewsDetailModal'; 
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { getProfile } from '../redux/reducers/auth';

const ReporterDashboardScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const {reporter, isActive} = useSelector(state => state.auth);
  const {reporterNews} = useSelector(state => state.news);

  const [selectedTab, setSelectedTab] = useState('డాష్‌బోర్డ్');
  const [selectedLocation, setSelectedLocation] = useState('తూర్పు గోదావరి');
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const mainTabs = [
    {id: 'dashboard', name: 'డాష్‌బోర్డ్'},
    {id: 'stories', name: 'నా స్టోరీస్'},
    {id: 'wallet', name: 'నా జిల్లా'},
    {id: 'videos', name: 'టాప్ వీడియోలు'},
  ];

  const locationTabs = [
    {id: 1, name: 'తూర్పు గోదావరి', count: null},
    {id: 2, name: 'Thallapudi', count: 1},
    {id: 3, name: 'Rajamundry', count: 1},
  ];

  const myStories = [
    { id: 1, thumbnail: 'https://picsum.photos/300/200?random=1', isVideo: true },
    { id: 2, thumbnail: 'https://picsum.photos/300/200?random=2', isVideo: true },
    { id: 3, thumbnail: 'https://picsum.photos/300/200?random=3', isVideo: true },
  ];

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getReporterNews()).unwrap(),
        dispatch(getProfile()).unwrap()
      ]);
    } catch (error) {
      console.error("Refresh Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(getReporterNews());
    dispatch(getProfile());
  }, [dispatch]);

  const handleHomeNavigation = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Main'}],
      }),
    );
  };

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

  const handleStartSubmission = () => {
    if (isActive === false) {
      Alert.alert(
        'ఖాతా నిలిపివేయబడింది',
        'మీ రిపోర్టర్ ఖాతా నిలిపివేయబడింది. దయచేసి అడ్మిన్‌ను సంప్రదించండి.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('NewsSubmissionStep1');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

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

  const testNotification = async () => {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'custom_test_channel',
      name: 'Custom Test',
      importance: AndroidImportance.HIGH,
      badge: true
    });

    await notifee.displayNotification({
      title: '<p style="color: #FF6B00;"><b>IPLలో ఆ స్టార్‌ను</b></p>',
      body: '<b>ఆడనిచ్చని డిమాండ్</b>',
      android: {
        channelId,
        smallIcon: 'ic_launcher', 
        color: '#FF6B00',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: 'ఆడనిచ్చని డిమాండ్ - Read full news and updates about IPL cricket.',
        },
      },
    });
  };

  const renderBlockedBanner = () => (
    <View style={[
      styles.blockedBanner, 
      { paddingTop: Math.max(insets.top, 10) }
    ]}>
      <Icon name="account-lock" size={20} color="#FFFFFF" />
      <Text style={styles.blockedBannerText}>
        మీ ఖాతా నిలిపివేయబడింది. మీరు కొత్త వార్తలను పోస్ట్ చేయలేరు.
      </Text>
    </View>
  );

  const renderNaaJillaContent = () => (
    <View style={styles.naaJillaContainer}>
      {reporterNews && reporterNews.length > 0 ? (
        reporterNews.map((item) => (
          <TouchableOpacity 
            key={item._id} 
            style={styles.newsItemContainer}
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
                  {item.content?.te?.title || item.content?.title || 'No Title'}
                </Text>
                <TouchableOpacity onPress={() => handleEditNews(item)} style={{padding: 4}}>
                  <Icon name="pencil" size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>వార్తలు అందుబాటులో లేవు</Text>
        </View>
      )}
    </View>
  );

  const renderDashboardContent = () => (
    <>
      <View style={styles.locationTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationTabsScrollContent}>
          {locationTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.locationTab, selectedLocation === tab.name && styles.locationTabActive]}
              onPress={() => setSelectedLocation(tab.name)}>
              <Text style={[styles.locationTabText, selectedLocation === tab.name && styles.locationTabTextActive]}>
                {tab.name}
              </Text>
              {tab.count && (
                <View style={styles.badge}><Text style={styles.badgeText}>{tab.count}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.ctaCard, isActive === false && styles.ctaDisabled]}
        activeOpacity={0.8}
        onPress={handleStartSubmission}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>స్టోర్స్ సూన్స్ పోస్ట్ చేయండి</Text>
          <Text style={styles.ctaSubtitle}>సున్నాన్ పోస్ట్ చేసి ఆదాయం పొందండి</Text>
        </View>
        <View style={styles.ctaArrow}>
          <Icon name={isActive === false ? "lock" : "arrow-right"} size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>నా వార్తలు ఈ నెలలో</Text>
          <Text style={styles.monthText}>Nov 2025</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>సబ్మిట్</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>తిరస్కరించబడినవి</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>ప్రభిన్ చేసినవి</Text></View>
        </View>
      </View>

      <View style={styles.earningsSection}>
        <View style={styles.earningsHeader}>
          <Text style={styles.sectionTitle}>నా ఆదాయం</Text>
          <TouchableOpacity>
            <Text style={styles.statementLink}>Statement <Icon name="chevron-right" size={14} color="#2196F3" /></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}><Text style={styles.earningLabel}>మొత్తం ఆదాయం</Text><Text style={styles.earningAmount}>₹100</Text></View>
            <View style={styles.divider} />
            <View style={styles.earningItem}><Text style={styles.earningLabel}>ప్రస్తుత ఆదాయం</Text><Text style={styles.earningAmount}>₹100</Text></View>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={testNotification}>
            <Text style={styles.payButtonText}>Pay me <Icon name="arrow-right" size={14} color="#1A1A1A" /></Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={isActive === false ? "#DC3545" : "#FFFFFF"} />
      
      {isActive === false && renderBlockedBanner()}

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.profileSection}>
          <Text style={styles.profileName}>{reporter?.reporter_profile?.username || "Guest"}</Text>
          <Text style={styles.profileRole}>Reporter @{reporter?.reporter_profile?.district_id?.name?.en}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleHomeNavigation} style={styles.iconButton}>
            <Icon name="home-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchDashboardData} 
            colors={["#DC3545", "#1A1A1A"]} // Primary app colors for the spinner
            tintColor="#DC3545" // iOS spinner color
          />
        }
      >
        {selectedTab === 'డాష్‌బోర్డ్' && renderDashboardContent()}
        {selectedTab === 'నా స్టోరీస్' && renderNaaJillaContent()}
        {selectedTab === 'నా జిల్లా' && <MyStoriesScreen />}
        {selectedTab === 'టాప్ వీడియోలు' && <TopReportersScreen />}
        <View style={{height: 16}} />
      </ScrollView>

      <View style={[styles.bottomTabsContainer, {paddingBottom: Math.max(insets.bottom, 6)}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTabsContent}>
          {mainTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.bottomTab, selectedTab === tab.name && styles.bottomTabActive]}
              onPress={() => setSelectedTab(tab.name)}>
              <Text style={[styles.bottomTabText, selectedTab === tab.name && styles.bottomTabTextActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <NewsDetailModal 
        visible={modalVisible} 
        newsItem={selectedNews} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  blockedBanner: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  blockedBannerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuButton: { padding: 4, marginRight: 10 },
  profileSection: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  profileRole: { fontSize: 12, color: '#666', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 6 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  locationTabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  locationTabsScrollContent: { paddingHorizontal: 16, gap: 8 },
  locationTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F6F8',
    gap: 6,
  },
  locationTabActive: { backgroundColor: '#1A1A1A' },
  locationTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  locationTabTextActive: { color: '#FFFFFF' },
  badge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  ctaDisabled: { backgroundColor: '#555', opacity: 0.7 },
  ctaContent: { flex: 1 },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  ctaSubtitle: { fontSize: 12, color: '#FFFFFFAA' },
  ctaArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  monthText: { fontSize: 13, color: '#666' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  statLabel: { fontSize: 11, color: '#666', textAlign: 'center' },
  earningsSection: { paddingHorizontal: 16, marginTop: 16 },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statementLink: { fontSize: 13, color: '#2196F3', fontWeight: '600' },
  earningsCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16 },
  earningsRow: { flexDirection: 'row', marginBottom: 12 },
  earningItem: { flex: 1 },
  earningLabel: { fontSize: 12, color: '#FFFFFFAA', marginBottom: 6 },
  earningAmount: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  payButton: { backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  payButtonText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  naaJillaContainer: { paddingHorizontal: 16, marginTop: 16 },
  newsItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C2C2C2',
    borderStyle: 'dashed',
    gap: 16,
  },
  imageWrapper: { width: 100, height: 100, borderRadius: 10, overflow: 'hidden' },
  newsImage: { width: '100%', height: '100%' },
  placeholderImage: { backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center' },
  newsContent: { flex: 1, paddingTop: 4, gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  newsTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1F1F1F', lineHeight: 22 },
  timeText: { fontSize: 12, fontWeight: '500', color: '#7B7B7B' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { color: '#999', fontSize: 14 },
  bottomTabsContainer: { backgroundColor: '#F5F6F8', paddingVertical: 10 },
  bottomTabsContent: { paddingHorizontal: 16, gap: 8 },
  bottomTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  bottomTabActive: { backgroundColor: '#1A1A1A' },
  bottomTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  bottomTabTextActive: { color: '#FFFFFF' },
});

export default ReporterDashboardScreen;