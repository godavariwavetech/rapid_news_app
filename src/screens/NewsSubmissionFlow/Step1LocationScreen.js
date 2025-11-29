import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step1LocationScreen = ({navigation}) => {
  const [searchText, setSearchText] = useState('');

  const recentLocations = [
    {id: 1, name: 'Rajamundry NMA'},
    {id: 2, name: 'Rajamundry Airport road'},
    {id: 3, name: 'Rajamundry NMA'},
    {id: 4, name: 'Rajamundry NMA'},
  ];

  const handleLocationSelect = location => {
    // Navigate to step 2
    navigation.navigate('NewsSubmissionStep2', {location});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>లొకేషన్ ఎంచుకోండి</Text>
        <Text style={styles.stepIndicator}>1 / 4</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Icon and Title */}
        <View style={styles.titleSection}>
          <Icon name="map-marker" size={32} color="#E74C3C" />
          <Text style={styles.title}>సున్నాన్ సొన్నాన్నీ ఎంచుకొండి</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={22} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for village/town/city name"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Recent Locations */}
        <Text style={styles.sectionTitle}>ఇటీవల లొకేషన్స్</Text>

        {recentLocations.map(location => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationItem}
            onPress={() => handleLocationSelect(location.name)}
            activeOpacity={0.7}>
            <Icon name="clock-outline" size={22} color="#666" />
            <Text style={styles.locationText}>{location.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stepIndicator: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#F5F6F8',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});

export default Step1LocationScreen;
