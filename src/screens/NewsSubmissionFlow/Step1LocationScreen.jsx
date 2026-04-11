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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getStates, getDistrict, getVillages} from '../../redux/reducers/location';
import {fonts} from '../../config/theme';
import { useTheme } from '../../context/ThemeContext';

const Step1LocationScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  const {states, districts, villages, loading} = useSelector(state => state.location);
  
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  useEffect(() => {
    dispatch(getStates());
  }, [dispatch]);

  const handleStateSelect = (item) => {
    setSelectedState(item);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setShowStatePicker(false);
    dispatch(getDistrict(item._id));
  };

  const handleDistrictSelect = (item) => {
    setSelectedDistrict(item);
    setSelectedVillage(null);
    setShowDistrictPicker(false);
    dispatch(getVillages(item._id));
  };

  const handleVillageSelect = (item) => {
    setSelectedVillage(item);
    setShowVillagePicker(false);
  };

  const handleNext = () => {
    if (!selectedState || !selectedDistrict || !selectedVillage) {
      Alert.alert('Required', 'Please complete all location fields.');
      return;
    }
    navigation.navigate('NewsSubmissionStep3', {
      locationData: { state: selectedState, district: selectedDistrict, village: selectedVillage },
      reachData: {
        id: 'medium',
        label: 'మధ్యస్థ అవకాశాలు',
        range: '50-80%',
        description: 'మీరు ఎంచుకున్న పొంతం లో ఫిస్న్ చేయడానికి మధ్యస్థంగా అవకాశాలు ఉన్నాయి',
        color: '#FF9800',
        barWidth: '65%'
      }
    });
  };

  const LocationField = ({label, value, onPress, disabled, active}) => (
    <View style={[styles.fieldWrapper, disabled && {opacity: 0.3}]}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.fieldInput, { borderBottomColor: isDarkMode ? '#444' : '#E0E0E0' }, active && { borderBottomColor: isDarkMode ? theme.primary : '#000000' }]} 
        onPress={onPress} 
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.fieldValue, { color: theme.text }, !active && {color: isDarkMode ? '#666' : '#A0A0A0'}]}>{value}</Text>
        <Icon name="chevron-down" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top, backgroundColor: theme.background}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Professional Minimal Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Submit News</Text>
        <Text style={[styles.stepIndicator, { color: theme.textSecondary }]}>Step 1/3</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>Location</Text>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Select the origin of the report.</Text>
        </View>

        <View style={styles.formContainer}>
          <LocationField 
            label="STATE"
            value={selectedState ? (selectedState.name?.en || selectedState.name) : 'Select State'}
            onPress={() => setShowStatePicker(true)}
            active={!!selectedState}
          />

          <LocationField 
            label="DISTRICT"
            value={selectedDistrict ? (selectedDistrict.name?.en || selectedDistrict.name) : 'Select District'}
            onPress={() => setShowDistrictPicker(true)}
            disabled={!selectedState}
            active={!!selectedDistrict}
          />

          <LocationField 
            label="VILLAGE / MANDAL"
            value={selectedVillage ? (selectedVillage.name?.en || selectedVillage.name) : 'Select Village'}
            onPress={() => setShowVillagePicker(true)}
            disabled={!selectedDistrict}
            active={!!selectedVillage}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 24)}]}>
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: isDarkMode ? theme.primary : '#000000' }, (!selectedState || !selectedDistrict || !selectedVillage) && [styles.nextButtonDisabled, { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' }]]}
          onPress={handleNext}
          disabled={!selectedState || !selectedDistrict || !selectedVillage}
        >
          <Text style={[styles.nextButtonText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Selection Modals */}
      <SelectionModal visible={showStatePicker} onClose={() => setShowStatePicker(false)} title="Select State" data={states} onSelect={handleStateSelect} theme={theme} isDarkMode={isDarkMode} />
      <SelectionModal visible={showDistrictPicker} onClose={() => setShowDistrictPicker(false)} title="Select District" data={districts} onSelect={handleDistrictSelect} theme={theme} isDarkMode={isDarkMode} />
      <SelectionModal visible={showVillagePicker} onClose={() => setShowVillagePicker(false)} title="Select Village" data={villages} onSelect={handleVillageSelect} theme={theme} isDarkMode={isDarkMode} />
    </View>
  );
};

const SelectionModal = ({visible, onClose, title, data, onSelect, theme, isDarkMode}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Icon name="close" size={22} color={theme.text} /></TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity style={[styles.modalItem, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={() => onSelect(item)}>
              <Text style={[styles.modalItemText, { color: theme.text }]}>{item.name?.en || item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: fonts.bold },
  stepIndicator: { fontSize: 13, fontFamily: fonts.medium },
  scrollBody: { paddingHorizontal: 24, paddingTop: 30 },
  titleContainer: { marginBottom: 40 },
  mainTitle: { fontSize: 32, fontFamily: fonts.bold },
  subTitle: { fontSize: 16, fontFamily: fonts.regular, marginTop: 4 },
  formContainer: { gap: 28 },
  fieldLabel: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.5, marginBottom: 10 },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    paddingVertical: 12,
  },
  fieldValue: { fontSize: 18, fontFamily: fonts.medium },
  footer: { paddingHorizontal: 24 },
  nextButton: { paddingVertical: 18, borderRadius: 4, alignItems: 'center' },
  nextButtonDisabled: { },
  nextButtonText: { fontSize: 16, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalContent: { borderRadius: 8, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1 },
  modalItemText: { fontSize: 16, fontFamily: fonts.medium }
});

export default Step1LocationScreen;
