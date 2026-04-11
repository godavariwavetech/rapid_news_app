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
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ReporterProfileScreen = ({navigation}) => {
  const { theme, isDarkMode } = useTheme();
  const {reporter} = useSelector(state=>state.auth)
  
  const userData = {
    name: reporter?.reporter_profile?.username,
    location: 'తూర్పు గోదావరి',
    profileImage: reporter?.profile_image || 'https://i.pravatar.cc/300?img=33',
    published: 0,
    submitted: 0,
    rejected: 0,
    coinsLeft: 400,
    progress: 20,
    rewardPoints: 100,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Text style={[styles.profileName, { color: theme.text }]}>{reporter?.reporter_profile?.username || "Guest"}</Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
            Reporter @{reporter?.reporter_profile?.district_id?.name?.en}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? '#222' : '#F5F6F8' }]}>
            <Icon name="message-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? '#222' : '#F5F6F8' }]}>
            <Icon name="home-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={[styles.profileImageSection, { backgroundColor: theme.background }]}>
          <View style={[styles.profileImageContainer, { borderColor: isDarkMode ? '#333' : '#E0E0E0' }]}>
            <Image
              source={{uri: userData.profileImage}}
              style={styles.profileImage}
            />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{userData.name}</Text>
          <Text style={[styles.userLocation, { color: theme.textSecondary }]}>{userData.location}</Text>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userData.published}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Published</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userData.submitted}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Submitted</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#333' : '#E8EAED' }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{userData.rejected}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rejected</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={[styles.progressSection, { backgroundColor: isDarkMode ? '#1A1A1A' : '#E8EAED' }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.coinsText, { color: theme.textSecondary }]}>{userData.coinsLeft} coins left</Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: isDarkMode ? '#333' : '#C0C5CD' }]}>
            <View
              style={[
                styles.progressBarFill,
                {width: `${userData.progress}%`, backgroundColor: theme.primary},
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Reporter</Text>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Sr Reporter</Text>
          </View>
        </View>

        {/* Reward Points Section */}
        <View style={styles.rewardSection}>
          <Text style={[styles.rewardTitle, { color: theme.textSecondary }]}>Reward Points you earned</Text>
          <View style={styles.rewardPointsContainer}>
            <Icon name="database" size={28} color={theme.textSecondary} />
            <Text style={[styles.rewardPoints, { color: theme.text }]}>{userData.rewardPoints}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  },
  profileRole: {
    fontSize: 11,
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
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
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
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
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
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
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
  },
});

export default ReporterProfileScreen;
