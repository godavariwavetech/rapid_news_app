import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import VideoCard from '../components/VideoCard';
import ShimmerLoader from '../components/ShimmerLoader';
import {MOCK_VIDEOS} from '../utils/constants';
import {getTranslation} from '../utils/translations';

const VideosScreen = ({navigation}) => {
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const language = useSelector(state => state.settings.language);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = key => getTranslation(language, key);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    setTimeout(() => {
      setVideos(MOCK_VIDEOS);
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setVideos(MOCK_VIDEOS);
      setRefreshing(false);
    }, 1500);
  };

  const handleVideoPress = video => {
    // Navigate to video player or open video
    console.log('Video pressed:', video.id);
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.text}]}>
            {t('videos')}
          </Text>
        </View>
        <View style={styles.loaderContainer}>
          {[1, 2, 3].map(item => (
            <ShimmerLoader key={item} height={280} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.text}]}>{t('videos')}</Text>
      </View>

      <FlatList
        data={videos}
        renderItem={({item}) => (
          <VideoCard video={item} onPress={() => handleVideoPress(item)} />
        )}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100,
  },
  loaderContainer: {
    padding: 16,
  },
});

export default VideosScreen;
