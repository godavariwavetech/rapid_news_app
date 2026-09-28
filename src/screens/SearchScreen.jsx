import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const SearchScreen = ({navigation}) => {
  const { theme, isDarkMode } = useTheme();
  const [searchText, setSearchText] = useState('');

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
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Search</Text>
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
