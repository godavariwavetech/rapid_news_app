import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  getStates,
  getDistrict,
  getVillages,
  setManualLocation,
} from '../redux/reducers/location';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const LocationSelectionScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  // Get data from Redux
  const {states, districts, villages, currentLocation, loading} = useSelector(
    state => state.location,
  );

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  // Initial Load & Auto-fill
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
  }, [dispatch, currentLocation]);

  // Selection Handlers
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

  // Finalize and Update Global Location
  const handleConfirmLocation = () => {
    if (selectedState && selectedDistrict && selectedVillage) {
      const locationData = {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage,
        displayName: selectedVillage.name?.te || selectedVillage.name?.en || selectedVillage.name,
      };

      dispatch(setManualLocation(locationData));
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }], 
          })
        );
    }
  };

  const LocationField = ({label, value, onPress, disabled, active}) => (
    <View style={[styles.fieldWrapper, disabled && {opacity: 0.5}]}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8F9FA', borderColor: isDarkMode ? '#333' : '#E8EAED' }, active && { borderColor: theme.primary, backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}>
        <Text style={[styles.fieldValue, { color: theme.text }, !active && {color: isDarkMode ? '#666' : '#999'}]}>
          {value}
        </Text>
        <Icon name="chevron-down" size={24} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top, borderBottomColor: isDarkMode ? '#333' : '#F0F0F0'}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>మీ ప్రదేశాన్ని ఎంచుకోండి</Text>
        <View style={{width: 32}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          వార్తలను మీ ప్రాంతం ఆధారంగా పొందేందుకు మీ లొకేషన్‌ను ఎంచుకోండి.
        </Text>

        <View style={styles.formContainer}>
          <LocationField
            label="రాష్ట్రం (STATE)"
            value={selectedState ? (selectedState.name?.te || selectedState.name?.en) : 'రాష్ట్రాన్ని ఎంచుకోండి'}
            onPress={() => setShowStatePicker(true)}
            active={!!selectedState}
          />

          <LocationField
            label="జిల్లా (DISTRICT)"
            value={selectedDistrict ? (selectedDistrict.name?.te || selectedDistrict.name?.en) : 'జిల్లాను ఎంచుకోండి'}
            onPress={() => setShowDistrictPicker(true)}
            disabled={!selectedState}
            active={!!selectedDistrict}
          />

          <LocationField
            label="గ్రామం / మండలం (VILLAGE / MANDAL)"
            value={selectedVillage ? (selectedVillage.name?.te || selectedVillage.name?.en) : 'గ్రామాన్ని ఎంచుకోండి'}
            onPress={() => setShowVillagePicker(true)}
            disabled={!selectedDistrict}
            active={!!selectedVillage}
          />
        </View>

        {loading && <ActivityIndicator color={theme.primary} style={{marginTop: 20}} />}

        {selectedVillage && (
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: theme.primary }]} onPress={handleConfirmLocation}>
            <Text style={[styles.confirmButtonText, { color: isDarkMode ? '#000' : '#FFF' }]}>సమర్పించండి (Confirm)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Selection Modals */}
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
      <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <TouchableOpacity style={[styles.modalItem, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={() => onSelect(item)}>
              <Text style={[styles.modalItemText, { color: theme.text }]}>
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
  fieldInputActive: { },
  fieldValue: {fontSize: 16, fontWeight: '500'},
  confirmButton: {
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {fontSize: 16, fontWeight: '700'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20},
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalItem: {paddingVertical: 16, borderBottomWidth: 1},
  modalItemText: {fontSize: 16},
});

export default LocationSelectionScreen;
