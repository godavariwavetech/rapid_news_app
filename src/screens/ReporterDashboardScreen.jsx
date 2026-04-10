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
import { useTheme } from '../context/ThemeContext';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

const ReporterDashboardScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  
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
  ];

  const locationTabs = [
    {id: 1, name: reporter?.reporter_profile?.district_id?.name?.en || 'తూర్పు గోదావరి', count: null},
  ];

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getReporterNews()).unwrap(),
        dispatch(getProfile()).unwrap()
      ]);
     const resp = await dispatch(getReporterStats())
     console.log(resp,">>>>>>>>>>>resp>>>");
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
      case 'PENDING': return isDarkMode ? '#FFF' : '#000000';
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
            style={[styles.newsItemContainer, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}
            activeOpacity={0.7}
            onPress={() => handleNewsPress(item)}
          >
            <View style={[styles.imageWrapper, { backgroundColor: isDarkMode ? '#222' : '#F5F5F5' }]}>
              {item.images && item.images.length > 0 ? (
                <Image source={{ uri: item.images[0] }} style={styles.newsImage} />
              ) : item.videos && item.videos.length > 0 ? (
                <View style={[styles.newsImage, styles.placeholderImage]}>
                  <Icon name="video" size={28} color={isDarkMode ? '#888' : '#999'} />
                </View>
              ) : (
                <View style={[styles.newsImage, styles.placeholderImage]}>
                  <Icon name="image-off" size={24} color={isDarkMode ? '#444' : '#C2C2C2'} />
                </View>
              )}
            </View>

            <View style={styles.newsContent}>
              <View style={styles.headingRow}>
                <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.content?.te?.title || item.content?.title || 'No Title'}
                </Text>
               {item?.status?.toUpperCase()=="PENDING" && <TouchableOpacity onPress={() => handleEditNews(item)} style={{padding: 4}}>
                  <Icon name="pencil-outline" size={20} color={theme.text} />
                </TouchableOpacity>}
              </View>
              <View style={styles.newsItemFooter}>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formatTime(item.createdAt)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.statusText, { color: (item?.status?.toUpperCase() === 'PENDING' && isDarkMode) ? '#000' : '#FFF' }]}>{getStatusLabel(item.status)}</Text>
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
      <View style={[styles.locationTabsContainer, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationTabsScrollContent}>
          {locationTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.locationTab, { backgroundColor: isDarkMode ? '#222' : '#F5F5F5' }, selectedLocation === tab.name && [styles.locationTabActive, { backgroundColor: isDarkMode ? theme.primary : '#000' }]]}
              onPress={() => setSelectedLocation(tab.name)}>
              <Text style={[styles.locationTabText, { color: theme.textSecondary }, selectedLocation === tab.name && styles.locationTabTextActive]}>
                {tab.name}
              </Text>
              {tab.count && (
                <View style={[styles.badge, { backgroundColor: isDarkMode ? theme.primary : '#000' }]}><Text style={styles.badgeText}>{tab.count}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.ctaCard, { borderColor: isDarkMode ? theme.primary : '#000' }, isActive === false && styles.ctaDisabled]}
        activeOpacity={0.8}
        onPress={handleStartSubmission}>
        <View style={styles.ctaTextSection}>
          <Text style={[styles.ctaTitle, { color: theme.text }]}>స్టోరీస్ పోస్ట్ చేయండి</Text>
          <Text style={[styles.ctaSubtitle, { color: theme.textSecondary }]}>వార్తలను పంచుకోండి మరియు ఆదాయం పొందండి</Text>
        </View>
        <Icon name={isActive === false ? "lock" : "plus-circle"} size={30} color={isDarkMode ? theme.primary : "#000"} />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeaderSymmetry}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>నా గణాంకాలు</Text>
          <Text style={[styles.monthText, { color: theme.textSecondary }]}>Nov 2025</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{reporterStats?.total_submitted || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>సబ్మిట్</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{reporterStats?.total_rejected || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>రిజెక్ట్</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{reporterStats?.total_approved || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>లైవ్</Text>
          </View>
        </View>
      </View>

      <View style={styles.earningsSection}>
        <View style={styles.earningsHeaderSymmetry}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>నా ఆదాయం</Text>
          <TouchableOpacity>
             <Text style={[styles.statementLink, { color: theme.text }]}>Statement <Icon name="chevron-right" size={14} color={theme.text} /></Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.earningsCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#000' }]}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}><Text style={styles.earningLabel}>మొత్తం ఆదాయం</Text><Text style={styles.earningAmount}>₹0</Text></View>
            <View style={[styles.dividerVertical, { backgroundColor: isDarkMode ? '#333' : '#333' }]} />
            <View style={styles.earningItem}><Text style={styles.earningLabel}>ప్రస్తుత ఆదాయం</Text><Text style={styles.earningAmount}>₹0</Text></View>
          </View>
          <TouchableOpacity style={[styles.payButton, { backgroundColor: isDarkMode ? theme.primary : '#FFF' }]}>
            <Text style={[styles.payButtonText, { color: isDarkMode ? '#000' : '#000' }]}>పేమెంట్ అభ్యర్థించండి</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: isActive === false ? 0 : insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {isActive === false && renderBlockedBanner()}

      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Icon name="menu" size={26} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.profileName, { color: theme.text }]}>{reporter?.reporter_profile?.username || "Guest"}</Text>
            <Text style={[styles.profileRole, { color: theme.textSecondary }]}>Reporter @{reporter?.reporter_profile?.district_id?.name?.en || "Location"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerHomeBtn} onPress={handleHomeNavigation}>
          <Icon name="home-outline" size={26} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} tintColor={theme.text} />
        }
      >
        {selectedTab === 'డాష్‌బోర్డ్' && renderDashboardContent()}
        {selectedTab === 'నా స్టోరీస్' && renderNaaJillaContent()}
        {selectedTab === 'నా జిల్లా' && <MyStoriesScreen />}
        {selectedTab === 'టాప్ వీడియోలు' && <TopReportersScreen />}
        <View style={{height: 40}} />
      </ScrollView>

      <View style={[styles.bottomTabsContainer, {paddingBottom: Math.max(insets.bottom, 12), backgroundColor: theme.background, borderTopColor: isDarkMode ? '#333' : '#F0F0F0'}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTabsContent}>
          {mainTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.bottomTab, { backgroundColor: isDarkMode ? '#222' : '#F5F5F5' }, selectedTab === tab.name && [styles.bottomTabActive, { backgroundColor: isDarkMode ? theme.primary : '#000' }]]}
              onPress={() => setSelectedTab(tab.name)}>
              <Text style={[styles.bottomTabText, { color: theme.textSecondary }, selectedTab === tab.name && styles.bottomTabTextActive]}>
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
  container: { flex: 1 },
  blockedBanner: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
    gap: 12,
  },
  blockedBannerText: { color: '#FFFFFF', fontSize: responsiveFontSize(2), fontFamily: fonts.medium, flex: 1, lineHeight: 18 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
  profileName: { fontSize: responsiveFontSize(2.5), fontFamily: fonts.bold, lineHeight: 20,includeFontPadding:false  },
  profileRole: {fontSize: responsiveFontSize(2), fontFamily: fonts.medium, textTransform: 'uppercase', marginTop: -2 ,includeFontPadding:false },
  headerHomeBtn: { padding: 4 },
  content: { flex: 1 },
  locationTabsContainer: { paddingVertical: 12, borderBottomWidth: 1 },
  locationTabsScrollContent: { paddingHorizontal: 16, gap: 10 },
  locationTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4 },
  locationTabActive: { },
  locationTabText: { fontSize: responsiveFontSize(2),fontFamily: fonts.bold,includeFontPadding:false  },
  locationTabTextActive: { color: '#FFF' },
  badge: { width: 16, height: 16, borderRadius: 8, marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: {fontSize: responsiveFontSize(1.8), color: '#FFF', fontWeight: 'bold',includeFontPadding:false  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  ctaDisabled: { opacity: 0.3 },
  ctaTextSection: { flex: 1 },
  ctaTitle: { fontSize: responsiveFontSize(2.3), fontFamily: fonts.bold,includeFontPadding:false },
  ctaSubtitle: {fontSize: responsiveFontSize(2), fontFamily: fonts.regular, marginTop: 3,includeFontPadding:false  },
  section: { paddingHorizontal: 16, marginTop: 15 },
  sectionHeaderSymmetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionHeaderTitle: { fontSize: responsiveFontSize(2), fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1,includeFontPadding:false  },
  monthText: { fontSize: responsiveFontSize(2), fontFamily: fonts.medium,includeFontPadding:false  },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: responsiveFontSize(2.7), fontFamily: fonts.bold,includeFontPadding:false  },
  statLabel: { fontSize: responsiveFontSize(1.8), fontFamily: fonts.medium, marginTop: 4,includeFontPadding:false  },
  earningsSection: { padding: 16, marginTop: 10 },
  earningsHeaderSymmetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statementLink: { fontSize: responsiveFontSize(2), fontFamily: fonts.bold,includeFontPadding:false  },
  earningsCard: { borderRadius: 8, padding: 20 },
  earningsRow: { flexDirection: 'row', marginBottom: 20 },
  earningItem: { flex: 1 },
  earningLabel: { fontSize: responsiveFontSize(1.8), fontFamily: fonts.medium, color: '#999', marginBottom: 6,includeFontPadding:false  },
  earningAmount: { fontSize: responsiveFontSize(2.5), fontFamily: fonts.bold, color: '#FFF',includeFontPadding:false  },
  dividerVertical: { width: 1, marginHorizontal: 15 },
  payButton: { paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  payButtonText: { fontSize: responsiveFontSize(2.2), fontFamily: fonts.bold ,includeFontPadding:false },
  naaJillaContainer: { paddingHorizontal: 16, marginTop: 10 },
  newsItemContainer: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, gap: 16 },
  imageWrapper: { width: 90, height: 90, borderRadius: 4, overflow: 'hidden' },
  newsImage: { width: '100%', height: '100%' },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },
  newsContent: { flex: 1, justifyContent: 'space-between' },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  newsTitle: { flex: 1, fontSize: responsiveFontSize(2.5), fontFamily: fonts.bold, lineHeight: 22,includeFontPadding:false  },
  newsItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: responsiveFontSize(2), fontFamily: fonts.medium,includeFontPadding:false  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  statusText: { fontSize: responsiveFontSize(1.8), fontFamily: fonts.bold, color: '#FFFFFF',includeFontPadding:false  },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#CCC', fontSize: responsiveFontSize(2.2), fontFamily: fonts.medium,includeFontPadding:false  },
  bottomTabsContainer: { borderTopWidth: 1 },
  bottomTabsContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  bottomTab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 4 },
  bottomTabActive: { },
  bottomTabText: { fontSize: responsiveFontSize(2.2), fontFamily: fonts.bold ,includeFontPadding:false },
  bottomTabTextActive: { color: '#FFF' },
});

export default ReporterDashboardScreen;
