import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const SearchScreen = ({navigation}) => {
  const { theme, isDarkMode } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const term = searchText.trim().replace(/^#+/, '');
    setHashtags([]);
    setTagError(false);
    setLoadingTags(Boolean(term));
    if (!term) return;
    const timer = setTimeout(async () => {
      try {
        const result = await api.get('news/hashtags', { params: { q: term } });
        if (active) setHashtags(result.data?.items || []);
      } catch { if (active) setTagError(true); }
      finally { if (active) setLoadingTags(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchText, retry]);

  // Submitting a query opens results the same way tapping a "#tag" chip
  // does — a swipeable overlay on top of the main feed (see HomeScreen's
  // openSearchOverlay) — rather than a separate results list on this screen.
  const runSearch = () => {
    const term = searchText.trim();
    if (!term) return;
    navigation.navigate('Main', { screen: 'HomeTab', params: { searchQuery: term } });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header with Back Button */}
      <View style={[styles.header, {paddingTop: STATUS_BAR_HEIGHT + 8, backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F0F2F5' }]}>
          <Icon name="magnify" size={24} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="ex : Modi, Politics, Health, Stocks, #tag, ..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={runSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>Related hashtags</Text>
        {loadingTags ? <ActivityIndicator color={theme.textSecondary} /> : tagError ?
          <TouchableOpacity onPress={() => setRetry(value => value + 1)}><Text style={{ color: theme.textSecondary }}>Could not load hashtags. Tap to retry</Text></TouchableOpacity> :
          <FlatList data={hashtags} keyExtractor={item => item.tag} keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: theme.textSecondary }}>{searchText.trim().replace(/^#+/, '') ? 'No matching hashtags' : 'Type to find hashtags and news counts'}</Text>}
            renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Main', { screen: 'HomeTab', params: { searchQuery: `#${item.tag}` } })}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }}>
              <Icon name="pound" size={24} color="#2586df" />
              <Text style={{ color: '#2586df', fontSize: 16, flex: 1, marginLeft: 10 }}>#{item.tag}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{item.count} {item.count === 1 ? 'news article' : 'news articles'}</Text>
              <Icon name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 34,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
});

export default SearchScreen;
