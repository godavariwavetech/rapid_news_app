import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const MyStoriesScreen = ({navigation}) => {
  // Mock news stories data
  const newsStories = [
    {
      id: 1,
      title: 'నేత పర్వం గా సుబ్బారాయుడి కళ్యాణం',
      image: 'https://picsum.photos/300/200?random=1',
      status: 'pending',
      statusText: 'పరిశీలనలో ఉంది',
      coins: null,
      time: '8:13 AM',
      date: null,
      isVideo: false,
    },
    {
      id: 2,
      title: 'నేత పర్వం గా సుబ్బారాయుడి కళ్యాణం',
      image: 'https://picsum.photos/300/200?random=2',
      status: 'rejected',
      statusText: 'తిరస్కరించబడినవి',
      coins: '0 Coins',
      time: null,
      date: 'Nov 29',
      isVideo: true,
      reason: 'Reason : siti సున్న్స్ డెస్క్, 8475732483 నెంబర్ ను సంప్రదించగలరు',
    },
    {
      id: 3,
      title: 'నేత పర్వం గా సుబ్బారాయుడి కళ్యాణం',
      image: 'https://picsum.photos/300/200?random=3',
      status: 'pending',
      statusText: 'పరిశీలనలో ఉంది',
      coins: null,
      time: '8:13 AM',
      date: null,
      isVideo: false,
    },
    {
      id: 4,
      title: 'నేత పర్వం గా సుబ్బారాయుడి కళ్యాణం',
      image: 'https://picsum.photos/300/200?random=4',
      status: 'rejected',
      statusText: 'తిరస్కరించబడినవి',
      coins: '0 Coins',
      time: null,
      date: 'Nov 29',
      isVideo: true,
      reason: 'Reason : siti సున్న్స్ డెస్క్, 8475732483 నెంబర్ ను సంప్రదించగలరు',
    },
    {
      id: 5,
      title: 'నేత పర్వం గా సుబ్బారాయుడి కళ్యాణం',
      image: 'https://picsum.photos/300/200?random=5',
      status: 'pending',
      statusText: 'పరిశీలనలో ఉంది',
      coins: null,
      time: '8:13 AM',
      date: null,
      isVideo: false,
    },
  ];

  const renderStoryItem = ({item}) => (
    <View style={styles.storyCard}>
      <View style={styles.storyContent}>
        <View style={styles.thumbnailContainer}>
          <Image source={{uri: item.image}} style={styles.thumbnail} />
          {item.isVideo && (
            <View style={styles.playButton}>
              <Icon name="play" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.storyDetails}>
          <Text style={styles.storyTitle}>{item.title}</Text>
          
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                item.status === 'pending'
                  ? styles.statusPending
                  : styles.statusRejected,
              ]}>
              <Text style={styles.statusText}>{item.statusText}</Text>
            </View>
            {item.coins && (
              <Text style={styles.coinsText}>{item.coins}</Text>
            )}
          </View>

          {item.reason && (
            <Text style={styles.reasonText}>{item.reason}</Text>
          )}
        </View>

        <View style={styles.timeContainer}>
          {item.date && <Text style={styles.dateText}>{item.date}</Text>}
          {item.time && <Text style={styles.timeText}>{item.time}</Text>}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Stories List */}
      <FlatList
        data={newsStories}
        renderItem={renderStoryItem}
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
  listContent: {
    paddingBottom: 20,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  storyContent: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 120,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -20}, {translateY: -20}],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyDetails: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusRejected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F44336',
  },
  reasonText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});

export default MyStoriesScreen;
