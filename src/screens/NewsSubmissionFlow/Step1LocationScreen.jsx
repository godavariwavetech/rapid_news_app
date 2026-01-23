import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
// Import location actions
import { getStates, getDistrict, getVillages } from '../../redux/reducers/location';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step1LocationScreen = ({navigation}) => {
  const dispatch = useDispatch();
  
  // Get location data from Redux
  const { states, districts, villages, loading } = useSelector(state => state.location);
  
  // Selection State
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  // Modal Visibility State
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  // Fetch States on Load
  useEffect(() => {
    dispatch(getStates());
  }, [dispatch]);

  // Handlers
  const handleStateSelect = (item) => {
    setSelectedState(item);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setShowStatePicker(false);
    dispatch(getDistrict(item._id)); // Fetch districts for selected state
  };

  const handleDistrictSelect = (item) => {
    setSelectedDistrict(item);
    setSelectedVillage(null);
    setShowDistrictPicker(false);
    dispatch(getVillages(item._id)); // Fetch villages for selected district
  };

  const handleVillageSelect = (item) => {
    setSelectedVillage(item);
    setShowVillagePicker(false);
  };

  const handleNext = () => {
    if (!selectedState || !selectedDistrict || !selectedVillage) {
      Alert.alert('Required', 'Please select State, District, and Village to proceed.');
      return;
    }

    // Pass selected data to the next screen
    navigation.navigate('NewsSubmissionStep2', {
      locationData: {
        state: selectedState,
        district: selectedDistrict,
        village: selectedVillage
      }
    });
  };

  // Reusable Selection Modal
  const SelectionModal = ({visible, onClose, title, data, onSelect, emptyMessage}) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 20}}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.listItem} onPress={() => onSelect(item)}>
                <Text style={styles.listItemText}>{item.name?.en || item.name}</Text>
                <Icon name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {loading ? 'Loading...' : emptyMessage}
              </Text>
            }
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Select Location</Text>
        <Text style={styles.stepIndicator}>1 / 4</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Icon name="map-marker-radius" size={32} color="#E74C3C" />
          <Text style={styles.title}>Where is this news from?</Text>
        </View>

        <View style={styles.formContainer}>
          {/* State Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TouchableOpacity 
              style={styles.dropdown} 
              onPress={() => setShowStatePicker(true)}
            >
              <Text style={[styles.dropdownText, !selectedState && styles.placeholderText]}>
                {selectedState ? (selectedState.name?.en || selectedState.name) : 'Select State'}
              </Text>
              <Icon name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* District Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <TouchableOpacity 
              style={[styles.dropdown, !selectedState && styles.disabledDropdown]} 
              onPress={() => selectedState && setShowDistrictPicker(true)}
              disabled={!selectedState}
            >
              <Text style={[styles.dropdownText, !selectedDistrict && styles.placeholderText]}>
                {selectedDistrict ? (selectedDistrict.name?.en || selectedDistrict.name) : 'Select District'}
              </Text>
              <Icon name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Village Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Village / Mandal</Text>
            <TouchableOpacity 
              style={[styles.dropdown, !selectedDistrict && styles.disabledDropdown]} 
              onPress={() => selectedDistrict && setShowVillagePicker(true)}
              disabled={!selectedDistrict}
            >
              <Text style={[styles.dropdownText, !selectedVillage && styles.placeholderText]}>
                {selectedVillage ? (selectedVillage.name?.en || selectedVillage.name) : 'Select Village'}
              </Text>
              <Icon name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={[
            styles.nextButton, 
            (!selectedState || !selectedDistrict || !selectedVillage) && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!selectedState || !selectedDistrict || !selectedVillage}
        >
          <Text style={styles.nextButtonText}>Next Step</Text>
          <Icon name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <SelectionModal 
        visible={showStatePicker} 
        onClose={() => setShowStatePicker(false)} 
        title="Select State" 
        data={states} 
        onSelect={handleStateSelect} 
        emptyMessage="No states found"
      />
      <SelectionModal 
        visible={showDistrictPicker} 
        onClose={() => setShowDistrictPicker(false)} 
        title="Select District" 
        data={districts} 
        onSelect={handleDistrictSelect} 
        emptyMessage="No districts found"
      />
      <SelectionModal 
        visible={showVillagePicker} 
        onClose={() => setShowVillagePicker(false)} 
        title="Select Village" 
        data={villages} 
        onSelect={handleVillageSelect} 
        emptyMessage="No villages found"
      />
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
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  disabledDropdown: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#FFCDD2',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
});

export default Step1LocationScreen;