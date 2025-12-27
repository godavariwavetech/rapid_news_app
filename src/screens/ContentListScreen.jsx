import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ContentListScreen = ({navigation, route}) => {
  const {type} = route.params; // 'magazines' or 'videos'
  const insets = useSafeAreaInsets()

  const isVideos = type === 'videos';
  const headerTitle = isVideos ? 'వీడియోస్' : 'డిజిటల్ మ్యాగజిన్స్';

  const items = [
    {
      id: 1,
      // Using a colored background instead of network image
      bgColor: '#4CAF50',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: 'Special',
      categoryColor: '#FF3B30',
      title: 'హాడివంట',
      date: '17 October',
      duration: isVideos ? '5:30' : null,
    },
    {
      id: 2,
      bgColor: '#FF9800',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: 'Special',
      categoryColor: '#FF3B30',
      title: 'హాల్తీ లైఫ్',
      date: '30 September',
      duration: isVideos ? '8:45' : null,
    },
    {
      id: 3,
      bgColor: '#2196F3',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: 'Special',
      categoryColor: '#FF3B30',
      title: 'కరెంట్ అఫైర్స్',
      date: '29 September',
      duration: isVideos ? '12:20' : null,
    },
    {
      id: 4,
      bgColor: '#9C27B0',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: isVideos ? 'News' : 'Money&Finance',
      categoryColor: '#FF3B30',
      title: isVideos ? 'రాజకీయ వార్తలు' : 'మని మని',
      date: '28 September',
      duration: isVideos ? '6:15' : null,
    },
    {
      id: 5,
      bgColor: '#E91E63',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: 'Special',
      categoryColor: '#FF3B30',
      title: 'స్టైల్హోం',
      date: '26 September',
      duration: isVideos ? '10:00' : null,
    },
    {
      id: 6,
      bgColor: '#00BCD4',
      icon: isVideos ? 'video-outline' : 'book-open-variant',
      category: 'Special',
      categoryColor: '#FF3B30',
      title: 'హాల్యసండే',
      date: '27 September',
      duration: isVideos ? '7:30' : null,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#808080" />

      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity
          style={[styles.backButton,{marginTop:insets.top}]}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle,{marginTop:insets.top}]}>{headerTitle}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              index === items.length - 1 && styles.lastItemCard,
            ]}
            activeOpacity={0.7}>
            {/* Thumbnail with colored background */}
            <View style={[styles.thumbnail, {backgroundColor: item.bgColor}]}>
              {/* Icon */}
              <Icon name={item.icon} size={48} color="#FFFFFF" />
              
              {/* Video Play Overlay */}
              {isVideos && (
                <>
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Icon name="play" size={32} color="#FFFFFF" />
                    </View>
                  </View>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{item.duration}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Content */}
            <View style={styles.itemContent}>
              {/* Category Tag */}
              <View
                style={[
                  styles.categoryTag,
                  {backgroundColor: item.categoryColor},
                ]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>

              {/* Title */}
              <Text style={styles.itemTitle}>{item.title}</Text>

              {/* Date */}
              <Text style={styles.itemDate}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{height: 20}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#808080',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#808080',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  itemCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  lastItemCard: {
    borderBottomWidth: 0,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
});

export default ContentListScreen;
