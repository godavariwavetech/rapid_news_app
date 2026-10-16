import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setManualLocation,
  searchLocation,
  updateMyLocation,
  resolveLocation,
} from '../redux/reducers/location';
import {CommonActions} from '@react-navigation/native';
import {useTheme} from '../context/ThemeContext';
import LocationService from '../utils/LocationService';

const RECENTS_KEY = 'rn_recent_locations';
const MAX_RECENTS = 5;

const LocationSelectionScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {theme, isDarkMode} = useTheme();

  const {currentLocation, searchResults: rawResults, searchLoading} = useSelector(state => state.location);

  // Guard against undefined/null from Redux
  const searchResults = Array.isArray(rawResults) ? rawResults : [];

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimer = useRef(null);
  const inputRef = useRef(null);

  // Search box shows the already-selected location as a dismissible chip
  // (matches the Way2News reference) until the user taps its X to type a new one.
  const [showCurrentChip, setShowCurrentChip] = useState(true);

  // "Allow Location" button: GPS-detected location, confirmed via the modal below
  const [detecting, setDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);

  // Recently-selected locations ("Favourites"), persisted locally for quick reselection
  const [recentLocations, setRecentLocations] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY)
      .then(raw => {
        if (raw) setRecentLocations(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const addToRecents = locationData => {
    const villageId = locationData.village?._id;
    if (!villageId) return;
    const next = [
      locationData,
      ...recentLocations.filter(r => r.village?._id !== villageId),
    ].slice(0, MAX_RECENTS);
    setRecentLocations(next);
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
  };

  // Debounced search — auto-detects pincode vs name
  const handleQueryChange = useCallback(
    text => {
      setQuery(text);
      clearTimeout(searchTimer.current);
      if (text.trim().length < 2) {
        setHasSearched(false);
        return;
      }
      searchTimer.current = setTimeout(() => {
        const isPincode = /^\d+$/.test(text.trim());
        setHasSearched(true);
        dispatch(
          searchLocation(isPincode ? {pincode: text.trim()} : {q: text.trim()}),
        );
      }, 400);
    },
    [dispatch],
  );

  const handleClearSearch = () => {
    setQuery('');
    setHasSearched(false);
    clearTimeout(searchTimer.current);
  };

  const handleDismissChip = () => {
    setShowCurrentChip(false);
    inputRef.current?.focus();
  };

  const saveAndNavigate = locationData => {
    dispatch(
      setManualLocation({
        ...locationData,
        displayName:
          locationData.village?.name?.te ||
          locationData.village?.name?.en ||
          locationData.village?.name,
      }),
    );
    addToRecents(locationData);
    navigation.dispatch(
      CommonActions.reset({index: 0, routes: [{name: 'Main'}]}),
    );
  };

  // Tap a search result, a Favourites entry, or the GPS-confirm modal — persist
  // it server-side, save it locally, and jump back to Main so the feed reloads
  // for the newly selected location.
  const handleSelectSearchResult = async result => {
    if (!result?.village?._id || !result?.district?._id || !result?.state?._id) return;
    try {
      await dispatch(
        updateMyLocation({
          state_id: result.state._id,
          district_id: result.district._id,
          village_id: result.village._id,
        }),
      ).unwrap();
    } catch (_) {
      // non-fatal — still save locally
    }
    setDetectedLocation(null);
    saveAndNavigate({
      state: result.state,
      district: result.district,
      village: result.village,
      pincode: result.pincode,
    });
  };

  // "Allow Location" button: read the device GPS position, resolve it to a
  // village/district/state, then let the confirm modal ask before applying it.
  const handleDetectLocation = async () => {
    setDetecting(true);
    setDetectedLocation(null);
    try {
      const position = await LocationService.getLocation();
      const result = await dispatch(
        resolveLocation({
          latitude: position.coords?.latitude,
          longitude: position.coords?.longitude,
        }),
      ).unwrap();
      setDetectedLocation(result);
    } catch (error) {
      Alert.alert(
        'Location Error',
        error?.message === 'PERMISSION_DENIED'
          ? 'దయచేసి లొకేషన్ పర్మిషన్ ఇవ్వండి.'
          : 'మీ ప్రస్తుత లొకేషన్‌ను గుర్తించలేకపోయాము. వెతకండి.',
      );
    } finally {
      setDetecting(false);
    }
  };

  // ---- Sub-components ----
  const LocationListItem = ({item, icon}) => {
    if (!item || !item.village || !item.district || !item.state) return null;
    const villageName = item.village?.name?.en || '';
    const districtName = item.district?.name?.en || '';
    const stateName = item.state?.name?.en || '';
    const pincode = item.pincode || '';
    return (
      <TouchableOpacity
        style={[styles.resultItem, {borderBottomColor: isDarkMode ? '#2A2A2A' : '#F0F0F0'}]}
        onPress={() => handleSelectSearchResult(item)}
        activeOpacity={0.7}>
        <View style={[styles.resultIconBg, {backgroundColor: isDarkMode ? '#222' : '#F0F0F0'}]}>
          <Icon name={icon} size={18} color={theme.textSecondary} />
        </View>
        <View style={styles.resultText}>
          <Text style={[styles.resultPrimary, {color: theme.text}]}>{villageName} (V)</Text>
          <Text style={[styles.resultSecondary, {color: theme.textSecondary}]}>
            {districtName} (D), {stateName} (S) - {pincode}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  const showChip = showCurrentChip && query.length === 0 && !!currentLocation;
  const currentLocationLabel =
    currentLocation?.village?.name?.te ||
    currentLocation?.village?.name?.en ||
    currentLocation?.displayName ||
    '';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={[styles.header, {paddingTop: 0, borderBottomColor: isDarkMode ? '#333' : '#F0F0F0'}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>మీ ప్రదేశాన్ని ఎంచుకోండి</Text>
        <View style={{width: 34}} />
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, {color: theme.text}]}>
          మీ లోకేషన్‌ను మీరే స్వయంగా ఇచ్చేందుకు ఈ ఆప్షన్ ఎంచుకోండి
        </Text>

        {/* Manual search */}
        <View
          style={[
            styles.searchBox,
            {backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E8EAED'},
          ]}>
          <Icon name="map-marker-outline" size={20} color={theme.textSecondary} />
          {showChip && (
            <View style={[styles.currentChip, {backgroundColor: theme.primary}]}>
              <Text style={styles.currentChipText} numberOfLines={1}>
                {currentLocationLabel}
              </Text>
              <TouchableOpacity onPress={handleDismissChip} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Icon name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
          {!showChip && (
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, {color: theme.text}]}
              placeholder="Village name or pincode..."
              placeholderTextColor={isDarkMode ? '#555' : '#AAA'}
              value={query}
              onChangeText={handleQueryChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          )}
          {!showChip && query.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Icon name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          <Icon name="magnify" size={20} color={theme.textSecondary} />
        </View>

        <Text style={[styles.legend, {color: theme.textSecondary}]}>
          వార్తల విధానం: గ్రామం (గ్రా), నియోజకవర్గం (ని), మండలం (మం), జిల్లా (జి)
        </Text>

        {searchLoading && <ActivityIndicator color={theme.primary} style={{marginTop: 16}} />}

        {!searchLoading && hasSearched && searchResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="map-search-outline" size={40} color={isDarkMode ? '#444' : '#CCC'} />
            <Text style={[styles.emptyText, {color: theme.textSecondary}]}>No results found</Text>
          </View>
        )}

        {hasSearched && searchResults.length > 0 && (
          <View style={styles.resultsList}>
            {searchResults.map((item, i) => (
              <LocationListItem
                key={item?.village?._id ? item.village._id + i : String(i)}
                item={item}
                icon="map-marker-outline"
              />
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, {backgroundColor: isDarkMode ? '#333' : '#E8EAED'}]} />
          <Text style={[styles.dividerText, {color: theme.textSecondary}]}>or</Text>
          <View style={[styles.dividerLine, {backgroundColor: isDarkMode ? '#333' : '#E8EAED'}]} />
        </View>

        <Text style={[styles.permissionHint, {color: theme.text}]}>
          మీ చుట్టూ జరిగే వార్తలు పొందేందుకు లొకేషన్ అనుమతివ్వండి
        </Text>

        {/* GPS auto-detect */}
        <TouchableOpacity
          style={[styles.allowLocationButton, {backgroundColor: theme.primary}]}
          onPress={handleDetectLocation}
          disabled={detecting}
          activeOpacity={0.85}>
          {detecting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Icon name="crosshairs-gps" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.allowLocationText}>లొకేషన్ అనుమతించండి</Text>
        </TouchableOpacity>

        {/* Favourites (recently-selected locations) */}
        {recentLocations.length > 0 && (
          <View style={styles.favouritesSection}>
            <View style={styles.favouritesHeader}>
              <Icon name="star" size={18} color="#F5A623" />
              <Text style={[styles.favouritesTitle, {color: theme.text}]}>Favourites</Text>
            </View>
            {recentLocations.map((item, i) => (
              <LocationListItem
                key={item?.village?._id ? `recent-${item.village._id}` : `recent-${i}`}
                item={item}
                icon="clock-outline"
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirm-your-location bottom sheet, shown after a successful GPS detect */}
      <Modal
        visible={!!detectedLocation}
        transparent
        animationType="slide"
        onRequestClose={() => setDetectedLocation(null)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmSheet, {backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
            <View style={styles.confirmHeaderRow}>
              <Icon name="map-marker" size={20} color={theme.textSecondary} />
              <Text style={[styles.confirmTitle, {color: theme.text}]}>Confirm your location</Text>
            </View>
            <View style={[styles.confirmDivider, {backgroundColor: isDarkMode ? '#333' : '#EEE'}]} />
            <Text style={[styles.confirmDetail, {color: theme.text}]}>
              {detectedLocation?.village?.name?.en} (V), {detectedLocation?.district?.name?.en} (D)
            </Text>
            {!!detectedLocation?.pincode && (
              <Text style={[styles.confirmPincode, {color: theme.textSecondary}]}>
                Pincode - {detectedLocation.pincode}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: isDarkMode ? '#F5F5F5' : '#1A1A1A'}]}
              onPress={() => handleSelectSearchResult(detectedLocation)}>
              <Text style={[styles.confirmButtonText, {color: isDarkMode ? '#000000' : '#FFFFFF'}]}>
                కొనసాగించు
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmChangeBtn} onPress={() => setDetectedLocation(null)}>
              <Text style={[styles.confirmChangeText, {color: theme.textSecondary}]}>మార్చండి</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 18, fontWeight: '700'},
  backButton: {padding: 4},
  scrollBody: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32},
  description: {fontSize: 15, lineHeight: 22, marginBottom: 14},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {flex: 1, fontSize: 15, paddingVertical: 2},
  currentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentChipText: {color: '#FFFFFF', fontSize: 13, fontWeight: '600', flexShrink: 1, marginRight: 6},
  legend: {fontSize: 12, marginTop: 8, lineHeight: 18},
  resultsList: {marginTop: 8},
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultIconBg: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  resultText: {flex: 1},
  resultPrimary: {fontSize: 15, fontWeight: '600'},
  resultSecondary: {fontSize: 12, marginTop: 2},
  emptyContainer: {alignItems: 'center', marginTop: 24, gap: 8},
  emptyText: {fontSize: 14, fontWeight: '600'},
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 20, gap: 12},
  dividerLine: {flex: 1, height: 1},
  dividerText: {fontSize: 13},
  permissionHint: {fontSize: 15, lineHeight: 22, marginBottom: 16},
  allowLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 16,
  },
  allowLocationText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  favouritesSection: {marginTop: 28},
  favouritesHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  favouritesTitle: {fontSize: 17, fontWeight: '700'},
  // Confirm-location modal
  confirmOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  confirmSheet: {borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20},
  confirmHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  confirmTitle: {fontSize: 17, fontWeight: '700'},
  confirmDivider: {height: 1, marginVertical: 16},
  confirmDetail: {fontSize: 16, fontWeight: '600', lineHeight: 24},
  confirmPincode: {fontSize: 14, marginTop: 6},
  confirmButton: {borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20},
  confirmButtonText: {fontSize: 16, fontWeight: '700'},
  confirmChangeBtn: {alignItems: 'center', paddingVertical: 14},
  confirmChangeText: {fontSize: 14, fontWeight: '600'},
});

export default LocationSelectionScreen;