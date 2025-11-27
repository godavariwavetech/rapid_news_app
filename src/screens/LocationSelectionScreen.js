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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const LocationSelectionScreen = ({navigation}) => {
  const [searchText, setSearchText] = useState('');

  const districts = [
    {id: 1, name: 'రాయం', english: '(రా)'},
    {id: 2, name: 'నిజామాబాద్', english: '(ని)'},
    {id: 3, name: 'మంచలం', english: '(మం)'},
    {id: 4, name: 'జిల్లా', english: '(జి)'},
  ];

  const favorites = [
    {
      id: 1,
      name: 'Baba Nagar',
      location: 'Rajamahendravaram Urban(M), East Godavari(D) – 533106',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Wrapper */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>మీ ప్రదేశాన్ని ఎంచుకోడి</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text style={styles.description}>
          మీ లొకేషనను మీరే సెయింగా ఇచ్చేందుకు ఈ ఆప్షన్ ఎంచుకోడి
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon
            name="map-marker"
            size={22}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="మీ ఊరు పేరు లేదా విరుణామాతో వెతకండి"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <Icon name="magnify" size={22} color="#666" />
        </View>

        {/* District Chips */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsLabel}>
            వాల్లు విధానం : {districts.map(d => d.english).join(', ')}
          </Text>
          <Text style={styles.orText}>or</Text>
        </View>

        {/* Location Permission Section */}
        <View style={styles.locationSection}>
          <Text style={styles.locationTitle}>
            మీ చుట్టూ ఉన్న పౌంతాల వార్తలు పొందేందుకు లొకేషన్ అనుమతివ్వండి
          </Text>

          <TouchableOpacity style={styles.locationButton} activeOpacity={0.8}>
            <Icon name="crosshairs-gps" size={22} color="#FFFFFF" />
            <Text style={styles.locationButtonText}>
              లొకేషన్ అనుమతివ్వండి
            </Text>
          </TouchableOpacity>
        </View>

        {/* Favourites Section */}
        <View style={styles.favouritesSection}>
          <View style={styles.favouritesHeader}>
            <Icon name="star" size={22} color="#E74C3C" />
            <Text style={styles.favouritesTitle}>Favourites</Text>
          </View>

          {favorites.map(fav => (
            <TouchableOpacity
              key={fav.id}
              style={styles.favouriteCard}
              activeOpacity={0.7}>
              <Icon
                name="clock-outline"
                size={22}
                color="#999"
                style={styles.clockIcon}
              />
              <View style={styles.favouriteInfo}>
                <Text style={styles.favouriteName}>{fav.name}</Text>
                <Text style={styles.favouriteLocation}>{fav.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  headerWrapper: {
    // paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 10,
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  chipsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  chipsLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  orText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  locationSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favouritesSection: {
    paddingHorizontal: 16,
  },
  favouritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  favouritesTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  favouriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  clockIcon: {
    marginRight: 12,
  },
  favouriteInfo: {
    flex: 1,
  },
  favouriteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  favouriteLocation: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default LocationSelectionScreen;
