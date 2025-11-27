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

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const SearchScreen = ({navigation}) => {
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
    {id: 'videos', icon: 'video', label: 'Videos', color: '#E74C3C'},
    {id: 'magazines', icon: 'book-open-variant', label: 'Magazines', color: '#E74C3C'},
    {id: 'world', icon: 'earth', label: 'World', color: '#E74C3C'},
    {id: 'trending', icon: 'trending-up', label: 'Trending', color: '#E74C3C'},
    {id: 'health', icon: 'heart-pulse', label: 'Health Tips', color: '#E74C3C'},
    {id: 'sports', icon: 'trophy', label: 'Sports', color: '#E74C3C'},
    {id: 'lifestyle', icon: 'coffee', label: 'Lifestyle', color: '#E74C3C'},
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Back Button */}
      <View style={[styles.header, {paddingTop: STATUS_BAR_HEIGHT + 8}]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ex : Modi, Politics, Health, Stocks, ..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Last 24 Hours Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="clock-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Last 24 Hours Updates</Text>
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
                  selectedTime === time && styles.chipSelected,
                ]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.chipText,
                    selectedTime === time && styles.chipTextSelected,
                  ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                index === categories.length - 1 && styles.lastCategoryItem,
              ]}
              onPress={() => console.log(`${category.label} pressed`)}
              activeOpacity={0.7}>
              <View style={styles.categoryLeft}>
                <View style={styles.iconContainer}>
                  <Icon name={category.icon} size={26} color={category.color} />
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 20}} />
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 34,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
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
    color: '#333',
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
    color: '#333',
  },
  chipsContainer: {
    paddingHorizontal: 12,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  chipSelected: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoriesSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  lastCategoryItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
    color: '#1A1A1A',
  },
});

export default SearchScreen;
