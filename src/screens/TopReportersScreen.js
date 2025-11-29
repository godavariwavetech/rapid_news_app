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
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const TopReportersScreen = ({navigation}) => {
  const [selectedLocation, setSelectedLocation] = useState('తూర్పు గోదావరి');

  const locationTabs = [
    {id: 1, name: 'తూర్పు గోదావరి', count: null},
    {id: 2, name: 'Thallapudi', count: 1},
    {id: 3, name: 'Rajamundry', count: 1},
  ];

  // Mock leaderboard data
  const leaderboardData = [
    {
      id: 1,
      rank: 1,
      name: 'Nithish',
      role: 'Sr Reporter',
      published: 4634,
      avatar: 'https://i.pravatar.cc/100?img=11',
    },
    {
      id: 2,
      rank: 2,
      name: 'Nithish',
      role: 'Sr Reporter',
      published: 4344,
      avatar: 'https://i.pravatar.cc/100?img=12',
    },
    {
      id: 3,
      rank: 3,
      name: 'Suresh',
      role: 'Sr Reporter',
      published: 634,
      avatar: 'https://i.pravatar.cc/100?img=13',
    },
    {
      id: 4,
      rank: 4,
      name: 'Nithish',
      role: 'Sr Reporter',
      published: 464,
      avatar: 'https://i.pravatar.cc/100?img=14',
    },
    {
      id: 5,
      rank: 5,
      name: 'Naresh',
      role: 'Sr Reporter',
      published: 434,
      avatar: 'https://i.pravatar.cc/100?img=15',
    },
    {
      id: 6,
      rank: 6,
      name: 'Hareesh',
      role: 'Sr Reporter',
      published: 345,
      avatar: 'https://i.pravatar.cc/100?img=16',
    },
    {
      id: 7,
      rank: 7,
      name: 'Nithish',
      role: 'Reporter',
      published: 266,
      avatar: 'https://i.pravatar.cc/100?img=17',
    },
    {
      id: 8,
      rank: 8,
      name: 'Nithish',
      role: 'Reporter',
      published: 145,
      avatar: 'https://i.pravatar.cc/100?img=18',
    },
  ];

  const renderLeaderboardItem = ({item}) => (
    <View style={styles.leaderboardItem}>
      <Text style={styles.rank}>{item.rank}</Text>
      <Image source={{uri: item.avatar}} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      <Text style={styles.published}>{item.published}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
                  selectedLocation === tab.name &&
                    styles.locationTabTextActive,
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

      {/* Leaderboard Header */}
      <View style={styles.leaderboardHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>#</Text>
          <Text style={[styles.headerText, styles.reporterHeader]}>
            REPORTER
          </Text>
          <Text style={styles.headerText}>PUBLISHED</Text>
        </View>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
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
  leaderboardHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
  },
  reporterHeader: {
    flex: 1,
    marginLeft: 80,
  },
  listContent: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F8',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    width: 30,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: '#666',
  },
  published: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default TopReportersScreen;
