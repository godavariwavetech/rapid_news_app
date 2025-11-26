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
import MagazineCard from '../components/MagazineCard';
import ShimmerLoader from '../components/ShimmerLoader';
import {MOCK_MAGAZINES} from '../utils/constants';
import {getTranslation} from '../utils/translations';

const MagazinesScreen = ({navigation}) => {
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const language = useSelector(state => state.settings.language);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = key => getTranslation(language, key);

  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMagazines();
  }, []);

  const loadMagazines = () => {
    setTimeout(() => {
      setMagazines(MOCK_MAGAZINES);
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setMagazines(MOCK_MAGAZINES);
      setRefreshing(false);
    }, 1500);
  };

  const handleMagazinePress = magazine => {
    console.log('Magazine pressed:', magazine.id);
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
            {t('magazines')}
          </Text>
        </View>
        <View style={styles.loaderContainer}>
          <View style={styles.loaderRow}>
            <ShimmerLoader height={250} width={160} />
            <ShimmerLoader height={250} width={160} />
          </View>
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
        <Text style={[styles.title, {color: theme.text}]}>
          {t('magazines')}
        </Text>
      </View>

      <FlatList
        data={magazines}
        renderItem={({item}) => (
          <MagazineCard
            magazine={item}
            onPress={() => handleMagazinePress(item)}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
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
    paddingHorizontal: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loaderContainer: {
    padding: 16,
  },
  loaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default MagazinesScreen;
