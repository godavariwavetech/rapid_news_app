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
} from '../redux/reducers/location'; //
import { CommonActions } from '@react-navigation/native';

const LocationSelectionScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

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

  // 1. Initial Load & Auto-fill from Current Location
  useEffect(() => {
    dispatch(getStates());

    // If SplashScreen already detected a location, pre-populate the UI
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

  // 2. Selection Handlers
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

  // 3. Finalize and Update Global Location
  const handleConfirmLocation = () => {
    if (selectedState && selectedDistrict && selectedVillage) {
      const locationData = {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage,
        displayName: selectedVillage.name?.te || selectedVillage.name?.en || selectedVillage.name,
      };

      // Store in Redux (this updates Header and news feed)
      dispatch(setManualLocation(locationData));
      // navigation.goBack();
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
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.fieldInput, active && styles.fieldInputActive]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}>
        <Text style={[styles.fieldValue, !active && {color: '#999'}]}>
          {value}
        </Text>
        <Icon name="chevron-down" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>మీ ప్రదేశాన్ని ఎంచుకోండి</Text>
        <View style={{width: 32}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <Text style={styles.description}>
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

        {loading && <ActivityIndicator color="#E74C3C" style={{marginTop: 20}} />}

        {selectedVillage && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            <Text style={styles.confirmButtonText}>సమర్పించండి (Confirm)</Text>
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
      />
      <SelectionModal 
        visible={showDistrictPicker} 
        onClose={() => setShowDistrictPicker(false)} 
        title="జిల్లా ఎంచుకోండి" 
        data={districts} 
        onSelect={handleDistrictSelect} 
      />
      <SelectionModal 
        visible={showVillagePicker} 
        onClose={() => setShowVillagePicker(false)} 
        title="గ్రామం ఎంచుకోండి" 
        data={villages} 
        onSelect={handleVillageSelect} 
      />
    </SafeAreaView>
  );
};

const SelectionModal = ({visible, onClose, title, data, onSelect}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
              <Text style={styles.modalItemText}>
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
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#1A1A1A'},
  backButton: {padding: 4},
  scrollBody: {paddingHorizontal: 20, paddingTop: 20},
  description: {fontSize: 15, color: '#666', marginBottom: 30, lineHeight: 22},
  formContainer: {gap: 20},
  fieldWrapper: {marginBottom: 10},
  fieldLabel: {fontSize: 12, fontWeight: '700', color: '#333', marginBottom: 8},
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  fieldInputActive: {borderColor: '#E74C3C', backgroundColor: '#FFF'},
  fieldValue: {fontSize: 16, color: '#1A1A1A', fontWeight: '500'},
  confirmButton: {
    backgroundColor: '#E74C3C',
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {color: '#FFF', fontSize: 16, fontWeight: '700'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20},
  modalTitle: {fontSize: 18, fontWeight: '700', color: '#000'},
  modalItem: {paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
  modalItemText: {fontSize: 16, color: '#333'},
});

export default LocationSelectionScreen;