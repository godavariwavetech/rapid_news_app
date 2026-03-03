import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
  const [selectedTime, setSelectedTime] = useState('1 hour');

  const timeFilters = [
    '1 hour',
    '2 hours',
    '4 hours',
    '8 hours',
    '12 hours',
    '16 hours',
    '20 hours',
    '24 hours',
  ];

  const categories = [
    {id: 'videos', icon: 'video', label: 'Videos', color: theme.primary},
    {id: 'magazines', icon: 'book-open-variant', label: 'Magazines', color: theme.primary},
    {id: 'world', icon: 'earth', label: 'World', color: theme.primary},
    {id: 'trending', icon: 'trending-up', label: 'Trending', color: theme.primary},
    {id: 'health', icon: 'heart-pulse', label: 'Health Tips', color: theme.primary},
    {id: 'sports', icon: 'trophy', label: 'Sports', color: theme.primary},
    {id: 'lifestyle', icon: 'coffee', label: 'Lifestyle', color: theme.primary},
  ];

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
      <View style={[styles.searchSection, { backgroundColor: theme.background, borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F0F2F5' }]}>
          <Icon name="magnify" size={24} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="ex : Modi, Politics, Health, Stocks, ..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last 24 Hours Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="clock-outline" size={20} color={theme.text} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Last 24 Hours Updates</Text>
          </View>

          {/* Time Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}>
            {timeFilters.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.chip,
                  { backgroundColor: theme.background, borderColor: isDarkMode ? '#333' : '#DDD' },
                  selectedTime === time && [styles.chipSelected, { backgroundColor: isDarkMode ? theme.primary : '#333', borderColor: isDarkMode ? theme.primary : '#333' }],
                ]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.textSecondary },
                    selectedTime === time && [styles.chipTextSelected, { color: isDarkMode ? '#000' : '#FFF' }],
                  ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.categoriesTitle, { color: theme.text }]}>Categories</Text>
          
          <View style={[styles.categoriesCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderRadius: 12, overflow: 'hidden' }]}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' },
                  index === categories.length - 1 && styles.lastCategoryItem,
                ]}
                onPress={() => console.log(`${category.label} pressed`)}
                activeOpacity={0.7}>
                <View style={styles.categoryLeft}>
                  <View style={styles.iconContainer}>
                    <Icon name={category.icon} size={26} color={category.color} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: theme.text }]}>{category.label}</Text>
                </View>
                <Icon name="chevron-right" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{height: 20}} />
      </ScrollView>
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
    borderBottomWidth: 1,
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
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  chipsContainer: {
    paddingHorizontal: 12,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: { },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  categoriesSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  lastCategoryItem: {
    borderBottomWidth: 0,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchScreen;
