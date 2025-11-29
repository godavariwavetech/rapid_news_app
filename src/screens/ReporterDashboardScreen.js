import React, {useState} from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReporterDashboardScreen = ({navigation}) => {
  const [selectedTab, setSelectedTab] = useState('డాష్‌బోర్డ్');
  const [selectedLocation, setSelectedLocation] = useState('తూర్పు గోదావరి');

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
    {
      id: 1,
      thumbnail: 'https://picsum.photos/300/200?random=1',
      isVideo: true,
    },
    {
      id: 2,
      thumbnail: 'https://picsum.photos/300/200?random=2',
      isVideo: true,
    },
    {
      id: 3,
      thumbnail: 'https://picsum.photos/300/200?random=3',
      isVideo: true,
    },
  ];

  const renderDashboardContent = () => (
    <>
      {/* Location Tabs */}
      <View style={styles.locationTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locationTabsScrollContent}>
          {locationTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.locationTab,
                selectedLocation === tab.name && styles.locationTabActive,
              ]}
              onPress={() => setSelectedLocation(tab.name)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.locationTabText,
                  selectedLocation === tab.name && styles.locationTabTextActive,
                ]}>
                {tab.name}
              </Text>
              {tab.count && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          ఈ స్థానం లో వార్తలు రాయడానికి అవకాశాలు ఉన్నాయి
        </Text>
        <TouchableOpacity style={styles.infoButton}>
          <Icon name="information-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Call to Action Card */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SubmitNews')}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>స్టోర్స్ సూన్స్ పోస్ట్ చేయండి</Text>
          <Text style={styles.ctaSubtitle}>
            సున్నాన్ పోస్ట్ చేసి ఆదాయం పొందండి
          </Text>
        </View>
        <View style={styles.ctaArrow}>
          <Icon name="arrow-right" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* My Stories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>నా వార్తలు ఈ నెలలో</Text>
          <Text style={styles.monthText}>Nov 2025</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>సబ్మిట్</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>తిరస్కరించబడినవి</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>ప్రభిన్ చేసినవి</Text>
          </View>
        </View>
      </View>

      {/* Earnings Section */}
      <View style={styles.earningsSection}>
        <View style={styles.earningsHeader}>
          <Text style={styles.sectionTitle}>నా ఆదాయం</Text>
          <TouchableOpacity>
            <Text style={styles.statementLink}>
              Statement <Icon name="chevron-right" size={14} color="#2196F3" />
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>మొత్తం ఆదాయం</Text>
              <Text style={styles.earningAmount}>₹100</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>ప్రస్తుత ఆదాయం</Text>
              <Text style={styles.earningAmount}>₹100</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.payButtonText}>
              Pay me <Icon name="arrow-right" size={14} color="#1A1A1A" />
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Stories Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ఎలా సక్సెస్ అవ్వాలి</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.videosScroll}>
          {myStories.map(story => (
            <TouchableOpacity
              key={story.id}
              style={styles.videoCard}
              activeOpacity={0.8}>
              <Image
                source={{uri: story.thumbnail}}
                style={styles.videoThumbnail}
              />
              {story.isVideo && (
                <View style={styles.playButton}>
                  <Icon name="play" size={28} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Text style={styles.profileName}>Guest</Text>
          <Text style={styles.profileRole}>Reporter @తూర్పు గోదావరి</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="message-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="home-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'డాష్‌బోర్డ్' && renderDashboardContent()}
        {selectedTab === 'నా స్టోరీస్' && (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>నా స్టోరీస్ Content</Text>
          </View>
        )}
        {selectedTab === 'నా జిల్లా' && (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>నా జిల్లా Content</Text>
          </View>
        )}
        {selectedTab === 'టాప్ వీడియోలు' && (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>టాప్ వీడియోలు Content</Text>
          </View>
        )}
        <View style={{height: 16}} />
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomTabsContent}>
          {mainTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.bottomTab,
                selectedTab === tab.name && styles.bottomTabActive,
              ]}
              onPress={() => setSelectedTab(tab.name)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.bottomTabText,
                  selectedTab === tab.name && styles.bottomTabTextActive,
                ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    padding: 4,
    marginRight: 10,
  },
  profileSection: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  profileRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  locationTabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  locationTabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  locationTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F6F8',
    gap: 6,
  },
  locationTabActive: {
    backgroundColor: '#1A1A1A',
  },
  locationTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  locationTabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF9E6',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  infoButton: {
    padding: 4,
  },
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
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: '#FFFFFFAA',
  },
  ctaArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  monthText: {
    fontSize: 13,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  earningsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statementLink: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  earningsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  earningItem: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 12,
    color: '#FFFFFFAA',
    marginBottom: 6,
  },
  earningAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  payButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  videosScroll: {
    marginTop: 12,
  },
  videoCard: {
    width: 220,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  bottomTabsContainer: {
    backgroundColor: '#F5F6F8',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 16 : 6,
  },
  bottomTabsContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  bottomTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bottomTabActive: {
    backgroundColor: '#1A1A1A',
  },
  bottomTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  bottomTabTextActive: {
    color: '#FFFFFF',
  },
});

export default ReporterDashboardScreen;
