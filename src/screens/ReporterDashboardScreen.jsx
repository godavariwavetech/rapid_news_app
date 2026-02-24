import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
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
import { fonts } from '../config/theme';
import { getReporterStats } from '../redux/reducers/profile';
import { NotificationAndroidPriority } from '@react-native-firebase/messaging';

const ReporterDashboardScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const {reporter, isActive} = useSelector(state => state.auth);
  const {reporterNews} = useSelector(state => state.news);
  const {reporterStats} = useSelector((state)=> state.profile)

  const [selectedTab, setSelectedTab] = useState('డాష్‌బోర్డ్');
  const [selectedLocation, setSelectedLocation] = useState(reporter?.reporter_profile?.district_id?.name?.en);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // Static Data
  const mainTabs = [
    {id: 'dashboard', name: 'డాష్‌బోర్డ్'},
    {id: 'stories', name: 'నా స్టోరీస్'},
    // {id: 'wallet', name: 'నా జిల్లా'},
    // {id: 'videos', name: 'టాప్ వీడియోలు'},
  ];

  const locationTabs = [
    {id: 1, name: reporter?.reporter_profile?.district_id?.name?.en || 'తూర్పు గోదావరి', count: null},
    // {id: 2, name: 'Thallapudi', count: 1},
    // {id: 3, name: 'Rajamundry', count: 1},
  ];


  console.log(reporterStats,">>>>>>>>>>>>>>>>>>>>>reporterStats");

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getReporterNews()).unwrap(),
        dispatch(getProfile()).unwrap()
      ]);
      const res = await dispatch(getReporterStats())
      console.log(">>>>>>>>>>>>>>>>>ressssss",res);
    } catch (error) {
      console.error("Refresh Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(getReporterNews());
    dispatch(getProfile());
    dispatch(getReporterStats())
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
      case 'PENDING': return '#000000';
      case 'APPROVED': return '#28A745';
      case 'REJECTED': return '#DC3545';
      default: return '#999';
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
    return
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'custom_test_channel',
      name: 'Custom Test',
      importance: AndroidImportance.HIGH,
      badge: true
    });

await notifee.displayNotification({
  id: `news_${Date.now()}`,
  // 1. Move the styled text to the TOP-LEVEL title so it is visible when collapsed
  title: `<h1><b>BREAKING: <font color="#FF3131">పాలు తాగి ఐదుగురు మృతి</font></b></h1>`,
  // 2. Put a space in the body to ensure the notification renders properly
  body: '\u00A0', 
  android: {
    channelId,
    // 3. This places the square logo on the LEFT (default for non-styled notifications)
    largeIcon: 'https://www.sitinetworks.com/siti-assets/images/logo.png', 
    importance: AndroidImportance.HIGH,
    priority: NotificationAndroidPriority.MAX,
    groupId: `group_${Date.now()}`,
    // 4. REMOVE the 'style' object entirely for now to fix the icon position
  },
});
  };

  const renderBlockedBanner = () => (
    <View style={[styles.blockedBanner, { paddingTop: Math.max(insets.top, 10) }]}>
      <Icon name="account-lock" size={18} color="#FFFFFF" />
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
                  <Icon name="pencil-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.newsItemFooter}>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
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
        <View style={styles.ctaTextSection}>
          <Text style={styles.ctaTitle}>స్టోరీస్ పోస్ట్ చేయండి</Text>
          <Text style={styles.ctaSubtitle}>వార్తలను పంచుకోండి మరియు ఆదాయం పొందండి</Text>
        </View>
        <Icon name={isActive === false ? "lock" : "plus-circle"} size={30} color="#000" />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeaderSymmetry}>
          <Text style={styles.sectionHeaderTitle}>నా గణాంకాలు</Text>
          <Text style={styles.monthText}>Nov 2025</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reporterStats?.total_submitted || 0}</Text>
            <Text style={styles.statLabel}>సబ్మిట్</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reporterStats?.total_rejected || 0}</Text>
            <Text style={styles.statLabel}>రిజెక్ట్</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reporterStats?.total_approved || 0}</Text>
            <Text style={styles.statLabel}>లైవ్</Text>
          </View>
        </View>
      </View>

      <View style={styles.earningsSection}>
        <View style={styles.earningsHeaderSymmetry}>
          <Text style={styles.sectionHeaderTitle}>నా ఆదాయం</Text>
          <TouchableOpacity>
             <Text style={styles.statementLink}>Statement <Icon name="chevron-right" size={14} color="#000" /></Text>
          </TouchableOpacity>
        </View>
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}><Text style={styles.earningLabel}>మొత్తం ఆదాయం</Text><Text style={styles.earningAmount}>₹0</Text></View>
            <View style={styles.dividerVertical} />
            <View style={styles.earningItem}><Text style={styles.earningLabel}>ప్రస్తుత ఆదాయం</Text><Text style={styles.earningAmount}>₹0</Text></View>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={testNotification}>
            <Text style={styles.payButtonText}>పేమెంట్ అభ్యర్థించండి</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: isActive === false ? 0 : insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {isActive === false && renderBlockedBanner()}

      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Icon name="menu" size={26} color="#000" />
          </TouchableOpacity>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{reporter?.reporter_profile?.username || "Guest"}</Text>
            <Text style={styles.profileRole}>Reporter @{reporter?.reporter_profile?.district_id?.name?.en || "Location"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerHomeBtn} onPress={handleHomeNavigation}>
          <Icon name="home-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} tintColor="#000" />
        }
      >
        {selectedTab === 'డాష్‌బోర్డ్' && renderDashboardContent()}
        {selectedTab === 'నా స్టోరీస్' && renderNaaJillaContent()}
        {selectedTab === 'నా జిల్లా' && <MyStoriesScreen />}
        {selectedTab === 'టాప్ వీడియోలు' && <TopReportersScreen />}
        <View style={{height: 40}} />
      </ScrollView>

      <View style={[styles.bottomTabsContainer, {paddingBottom: Math.max(insets.bottom, 12)}]}>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  blockedBanner: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
    gap: 12,
  },
  blockedBannerText: { color: '#FFFFFF', fontSize: 12, fontFamily: fonts.medium, flex: 1, lineHeight: 18 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
  },
  profileTextContainer: {
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontFamily: fonts.bold, color: '#000', lineHeight: 20 },
  profileRole: { fontSize: 11, fontFamily: fonts.medium, color: '#999', textTransform: 'uppercase', marginTop: -2 },
  headerHomeBtn: { padding: 4 },
  content: { flex: 1 },
  locationTabsContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  locationTabsScrollContent: { paddingHorizontal: 16, gap: 10 },
  locationTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4, backgroundColor: '#F5F5F5' },
  locationTabActive: { backgroundColor: '#000' },
  locationTabText: { fontSize: 12, fontFamily: fonts.bold, color: '#666' },
  locationTabTextActive: { color: '#FFF' },
  badge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#000', marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: '#FFF', fontWeight: 'bold' },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  ctaDisabled: { opacity: 0.3 },
  ctaTextSection: { flex: 1 },
  ctaTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#000' },
  ctaSubtitle: { fontSize: 13, fontFamily: fonts.regular, color: '#666', marginTop: 3 },
  section: { paddingHorizontal: 16, marginTop: 15 },
  sectionHeaderSymmetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionHeaderTitle: { fontSize: 12, fontFamily: fonts.bold, color: '#000', textTransform: 'uppercase', letterSpacing: 1 },
  monthText: { fontSize: 12, color: '#999', fontFamily: fonts.medium },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 24, fontFamily: fonts.bold, color: '#000' },
  statLabel: { fontSize: 11, fontFamily: fonts.medium, color: '#999', marginTop: 4 },
  earningsSection: { padding: 16, marginTop: 10 },
  earningsHeaderSymmetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statementLink: { fontSize: 12, color: '#000', fontFamily: fonts.bold },
  earningsCard: { backgroundColor: '#000', borderRadius: 8, padding: 20 },
  earningsRow: { flexDirection: 'row', marginBottom: 20 },
  earningItem: { flex: 1 },
  earningLabel: { fontSize: 11, fontFamily: fonts.medium, color: '#999', marginBottom: 6 },
  earningAmount: { fontSize: 22, fontFamily: fonts.bold, color: '#FFF' },
  dividerVertical: { width: 1, backgroundColor: '#333', marginHorizontal: 15 },
  payButton: { backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  payButtonText: { fontSize: 14, fontFamily: fonts.bold, color: '#000' },
  naaJillaContainer: { paddingHorizontal: 16, marginTop: 10 },
  newsItemContainer: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 16 },
  imageWrapper: { width: 90, height: 90, borderRadius: 4, overflow: 'hidden', backgroundColor: '#F5F5F5' },
  newsImage: { width: '100%', height: '100%' },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  newsContent: { flex: 1, justifyContent: 'space-between' },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  newsTitle: { flex: 1, fontSize: 16, fontFamily: fonts.bold, color: '#000', lineHeight: 22 },
  newsItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, fontFamily: fonts.medium, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  statusText: { fontSize: 11, fontFamily: fonts.bold, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#CCC', fontSize: 14, fontFamily: fonts.medium },
  bottomTabsContainer: { borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFF' },
  bottomTabsContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  bottomTab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 4, backgroundColor: '#F5F5F5' },
  bottomTabActive: { backgroundColor: '#000' },
  bottomTabText: { fontSize: 13, fontFamily: fonts.bold, color: '#666' },
  bottomTabTextActive: { color: '#FFF' },
});

export default ReporterDashboardScreen;