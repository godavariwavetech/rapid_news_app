import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  getStates,
  getDistrict,
  getVillages,
  setManualLocation,
  searchLocation,
  updateMyLocation,
} from '../redux/reducers/location';
import {CommonActions} from '@react-navigation/native';
import {useTheme} from '../context/ThemeContext';

const TABS = ['Search', 'Browse'];

const LocationSelectionScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {theme, isDarkMode} = useTheme();

  const {
    states,
    districts,
    villages,
    currentLocation,
    loading,
    searchResults: rawResults,
    searchLoading,
  } = useSelector(state => state.location);

  // Guard against undefined/null from Redux
  const searchResults = Array.isArray(rawResults) ? rawResults : [];

  const [activeTab, setActiveTab] = useState('Search');

  // Browse tab state
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  // Search tab state
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    dispatch(getStates());
    if (currentLocation) {
      if (currentLocation.state) {
        setSelectedState(currentLocation.state);
        dispatch(getDistrict(currentLocation.state._id));
      }
      if (currentLocation.district) {
        setSelectedDistrict(currentLocation.district);
        dispatch(getVillages(currentLocation.district._id));
      }
      if (currentLocation.village) {
        setSelectedVillage(currentLocation.village);
      }
    }
  }, []);

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

  // Browse handlers
  const handleStateSelect = item => {
    setSelectedState(item);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setShowStatePicker(false);
    dispatch(getDistrict(item._id));
  };

  const handleDistrictSelect = item => {
    setSelectedDistrict(item);
    setSelectedVillage(null);
    setShowDistrictPicker(false);
    dispatch(getVillages(item._id));
  };

  const handleVillageSelect = item => {
    setSelectedVillage(item);
    setShowVillagePicker(false);
  };

  const handleConfirmBrowse = () => {
    if (selectedState && selectedDistrict && selectedVillage) {
      saveAndNavigate({
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage,
      });
    }
  };

  // Search: tap a result
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
    saveAndNavigate({
      state: result.state,
      district: result.district,
      village: result.village,
      pincode: result.pincode,
    });
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
    navigation.dispatch(
      CommonActions.reset({index: 0, routes: [{name: 'Main'}]}),
    );
  };

  // ---- Sub-components ----
  const LocationField = ({label, value, onPress, disabled, active}) => (
    <View style={[styles.fieldWrapper, disabled && {opacity: 0.5}]}>
      <Text style={[styles.fieldLabel, {color: theme.textSecondary}]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.fieldInput,
          {backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA', borderColor: isDarkMode ? '#333' : '#E8EAED'},
          active && {borderColor: theme.primary, backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF'},
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}>
        <Text style={[styles.fieldValue, {color: theme.text}, !active && {color: isDarkMode ? '#666' : '#999'}]}>
          {value}
        </Text>
        <Icon name="chevron-down" size={24} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const SearchResultItem = ({item}) => {
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
        <Icon name="map-marker-outline" size={20} color={theme.primary} style={styles.resultIcon} />
        <View style={styles.resultText}>
          <Text style={[styles.resultPrimary, {color: theme.text}]}>{villageName} (V)</Text>
          <Text style={[styles.resultSecondary, {color: theme.textSecondary}]}>
            {districtName} (M), {stateName} (D) - {pincode}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

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
        <View style={{width: 32}} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, {borderBottomColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && {borderBottomColor: theme.primary, borderBottomWidth: 2}]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, {color: activeTab === tab ? theme.primary : theme.textSecondary}]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Tab */}
      {activeTab === 'Search' && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA', borderColor: isDarkMode ? '#333' : '#E8EAED'},
            ]}>
            <Icon name="magnify" size={22} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, {color: theme.text}]}
              placeholder="Village name or pincode..."
              placeholderTextColor={isDarkMode ? '#555' : '#AAA'}
              value={query}
              onChangeText={handleQueryChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Icon name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {searchLoading && <ActivityIndicator color={theme.primary} style={{marginTop: 24}} />}

          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <Icon name="map-search-outline" size={48} color={isDarkMode ? '#444' : '#CCC'} />
              <Text style={[styles.emptyText, {color: theme.textSecondary}]}>No results found</Text>
              <Text style={[styles.emptyHint, {color: isDarkMode ? '#555' : '#BBB'}]}>
                Try a different village name or pincode
              </Text>
            </View>
          )}

          {!hasSearched && query.length === 0 && (
            <View style={styles.emptyContainer}>
              <Icon name="magnify" size={48} color={isDarkMode ? '#444' : '#CCC'} />
              <Text style={[styles.emptyHint, {color: isDarkMode ? '#555' : '#BBB'}]}>
                Type a village name or 6-digit pincode
              </Text>
            </View>
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item, i) =>
              (item?.village?._id ? item.village._id + i : String(i))
            }
            renderItem={({item}) => <SearchResultItem item={item} />}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}

      {/* Browse Tab */}
      {activeTab === 'Browse' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          <Text style={[styles.description, {color: theme.textSecondary}]}>
            వార్తలను మీ ప్రాంతం ఆధారంగా పొందేందుకు మీ లొకేషన్‌ను ఎంచుకోండి.
          </Text>
          <View style={styles.formContainer}>
            <LocationField
              label="రాష్ట్రం (STATE)"
              value={selectedState ? selectedState.name?.te || selectedState.name?.en : 'రాష్ట్రాన్ని ఎంచుకోండి'}
              onPress={() => setShowStatePicker(true)}
              active={!!selectedState}
            />
            <LocationField
              label="జిల్లా (DISTRICT)"
              value={selectedDistrict ? selectedDistrict.name?.te || selectedDistrict.name?.en : 'జిల్లాను ఎంచుకోండి'}
              onPress={() => setShowDistrictPicker(true)}
              disabled={!selectedState}
              active={!!selectedDistrict}
            />
            <LocationField
              label="గ్రామం / మండలం (VILLAGE / MANDAL)"
              value={selectedVillage ? selectedVillage.name?.te || selectedVillage.name?.en : 'గ్రామాన్ని ఎంచుకోండి'}
              onPress={() => setShowVillagePicker(true)}
              disabled={!selectedDistrict}
              active={!!selectedVillage}
            />
          </View>
          {loading && <ActivityIndicator color={theme.primary} style={{marginTop: 20}} />}
          {selectedVillage && (
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: theme.primary}]}
              onPress={handleConfirmBrowse}>
              <Text style={[styles.confirmButtonText, {color: isDarkMode ? '#000' : '#FFF'}]}>
                సమర్పించండి (Confirm)
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Browse modals */}
      <SelectionModal
        visible={showStatePicker}
        onClose={() => setShowStatePicker(false)}
        title="రాష్ట్రం ఎంచుకోండి"
        data={states}
        onSelect={handleStateSelect}
        theme={theme}
        isDarkMode={isDarkMode}
      />
      <SelectionModal
        visible={showDistrictPicker}
        onClose={() => setShowDistrictPicker(false)}
        title="జిల్లా ఎంచుకోండి"
        data={districts}
        onSelect={handleDistrictSelect}
        theme={theme}
        isDarkMode={isDarkMode}
      />
      <SelectionModal
        visible={showVillagePicker}
        onClose={() => setShowVillagePicker(false)}
        title="గ్రామం ఎంచుకోండి"
        data={villages}
        onSelect={handleVillageSelect}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
};

const SelectionModal = ({visible, onClose, title, data, onSelect, theme, isDarkMode}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, {backgroundColor: theme.background}]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, {color: theme.text}]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={Array.isArray(data) ? data : []}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.modalItem, {borderBottomColor: isDarkMode ? '#333' : '#F5F5F5'}]}
              onPress={() => onSelect(item)}>
              <Text style={[styles.modalItemText, {color: theme.text}]}>
                {item.name?.te || item.name?.en || item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

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
  tabBar: {flexDirection: 'row', borderBottomWidth: 1},
  tab: {flex: 1, alignItems: 'center', paddingVertical: 12},
  tabText: {fontSize: 14, fontWeight: '600'},
  // Search tab
  searchContainer: {flex: 1, paddingHorizontal: 16, paddingTop: 16},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {flex: 1, fontSize: 15, paddingVertical: 2},
  resultsList: {paddingBottom: 20},
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  resultIcon: {marginRight: 12},
  resultText: {flex: 1},
  resultPrimary: {fontSize: 15, fontWeight: '600'},
  resultSecondary: {fontSize: 12, marginTop: 2},
  emptyContainer: {alignItems: 'center', marginTop: 48, gap: 8},
  emptyText: {fontSize: 15, fontWeight: '600', marginTop: 8},
  emptyHint: {fontSize: 13, textAlign: 'center'},
  // Browse tab
  scrollBody: {paddingHorizontal: 20, paddingTop: 20},
  description: {fontSize: 15, marginBottom: 30, lineHeight: 22},
  formContainer: {gap: 20},
  fieldWrapper: {marginBottom: 10},
  fieldLabel: {fontSize: 12, fontWeight: '700', marginBottom: 8},
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  fieldValue: {fontSize: 16, fontWeight: '500'},
  confirmButton: {marginTop: 40, paddingVertical: 16, borderRadius: 12, alignItems: 'center'},
  confirmButtonText: {fontSize: 16, fontWeight: '700'},
  // Modals
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20},
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalItem: {paddingVertical: 16, borderBottomWidth: 1},
  modalItemText: {fontSize: 16},
});

export default LocationSelectionScreen;