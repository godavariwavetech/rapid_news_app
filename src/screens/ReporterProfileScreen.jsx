import React from 'react';
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
import { useSelector } from 'react-redux';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReporterProfileScreen = ({navigation}) => {
  const {reporter} = useSelector(state=>state.auth)
  // Mock user data
  const userData = {
    name: reporter?.username,
    location: 'తూర్పు గోదావరి',
    profileImage: 'https://i.pravatar.cc/300?img=33',
    published: 0,
    submitted: 0,
    rejected: 0,
    coinsLeft: 400,
    progress: 20,
    rewardPoints: 100,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={22} color="#333" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Text style={styles.profileName}>{reporter?.username || "Harish"}</Text>
          <Text style={styles.profileRole}>
            Reporter @{reporter?.district_id?.name?.en}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="message-outline" size={18} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="home-outline" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{uri: userData.profileImage}}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userLocation}>{userData.location}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.published}</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.submitted}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.coinsText}>{userData.coinsLeft} coins left</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {width: `${userData.progress}%`},
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Reporter</Text>
            <Text style={styles.progressLabel}>Sr Reporter</Text>
          </View>
        </View>

        {/* Reward Points Section */}
        <View style={styles.rewardSection}>
          <Text style={styles.rewardTitle}>Reward Points you earned</Text>
          <View style={styles.rewardPointsContainer}>
            <Icon name="database" size={28} color="#999" />
            <Text style={styles.rewardPoints}>{userData.rewardPoints}</Text>
          </View>
        </View>

        <View style={{height: 20}} />
      </ScrollView>
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  profileRole: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 4,
    marginBottom: 14,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: '#E8EAED',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  progressHeader: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#C0C5CD',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E74C3C',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  rewardSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 16,
  },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardPoints: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default ReporterProfileScreen;
