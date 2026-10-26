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
  
  const {states, districts, villages} = useSelector(state => state.location);
  const reporter = useSelector(state => state.auth.reporter);

  // reporter can be the full user object (getProfile sets reporter = full user)
  // or reporter_profile directly (verifyOTP sets reporter = user.reporter_profile)
  const reporterProfile = reporter?.reporter_profile || reporter;

  // These may be populated objects {_id, name:{en,te}} or plain ID strings
  const assignedState    = reporterProfile?.location?.state_id;
  const assignedDistrict = reporterProfile?.location?.district_id;
  const assignedVillage  = reporterProfile?.location?.village_id;

  const isReporter = !!(assignedDistrict || assignedState);

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  // Multiple villages/mandals can be targeted by one news post — the backend
  // already supports this (see the dashboard's AddNews.jsx, which posts the
  // same news/create payload as `locations: [{state_id, district_id,
  // village_id}, ...]`), the mobile flow just wasn't sending more than one.
  const [selectedVillages, setSelectedVillages] = useState([]);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  useEffect(() => {
    if (!isReporter) {
      dispatch(getStates());
      return;
    }

    // If assigned values are already populated objects (have _id + name), use directly
    if (assignedState && typeof assignedState === 'object' && assignedState.name) {
      setSelectedState(assignedState);
    }
    if (assignedDistrict && typeof assignedDistrict === 'object' && assignedDistrict.name) {
      setSelectedDistrict(assignedDistrict);
      const districtId = assignedDistrict._id;
      if (districtId) dispatch(getVillages(districtId));
    }
    if (assignedVillage && typeof assignedVillage === 'object' && assignedVillage.name) {
      setSelectedVillages([assignedVillage]);
    }

    // If they are plain ID strings, fetch states list to resolve names
    if (typeof assignedState === 'string' || typeof assignedDistrict === 'string') {
      dispatch(getStates());
    }
  }, [isReporter]);

  // Once states list loads, resolve plain ID strings to full objects
  useEffect(() => {
    if (!isReporter || !states?.length) return;

    if (typeof assignedState === 'string' && !selectedState) {
      const match = states.find(s => s._id === assignedState);
      if (match) {
        setSelectedState(match);
        dispatch(getDistrict(match._id));
      }
    }
  }, [states]);

  // Once districts load, resolve district ID to full object
  useEffect(() => {
    if (!isReporter || !districts?.length) return;

    if (typeof assignedDistrict === 'string' && !selectedDistrict) {
      const match = districts.find(d => d._id === assignedDistrict);
      if (match) {
        setSelectedDistrict(match);
        dispatch(getVillages(match._id));
      }
    }
  }, [districts]);

  // Once villages load, resolve a plain village ID string the same way
  // state/district do above. Missing this left the field locked (it has an
  // assigned id, so locked={isReporter && !!assignedVillage} is true) but
  // showing the empty "Select Village(s)" placeholder forever whenever the
  // reporter's assigned village only ever arrives as a string, not a
  // populated {_id, name} object - a reporter could never see or pick their
  // own assigned village once this field stopped being tappable.
  useEffect(() => {
    if (!isReporter || !villages?.length) return;

    if (typeof assignedVillage === 'string' && selectedVillages.length === 0) {
      const match = villages.find(v => v._id === assignedVillage);
      if (match) {
        setSelectedVillages([match]);
      }
    }
  }, [villages]);

  const handleStateSelect = (item) => {
    setSelectedState(item);
    setSelectedDistrict(null);
    setSelectedVillages([]);
    setShowStatePicker(false);
    dispatch(getDistrict(item._id));
  };

  const handleDistrictSelect = (item) => {
    setSelectedDistrict(item);
    setSelectedVillages([]);
    setShowDistrictPicker(false);
    dispatch(getVillages(item._id));
  };

  // Toggle a village in/out of the selection — the modal stays open so the
  // user can pick several before closing it.
  const handleVillageToggle = (item) => {
    setSelectedVillages(prev =>
      prev.some(v => v._id === item._id)
        ? prev.filter(v => v._id !== item._id)
        : [...prev, item]
    );
  };

  const canProceed = isReporter
    ? selectedVillages.length > 0
    : !!(selectedState && selectedDistrict) && selectedVillages.length > 0;

  const handleNext = () => {
    if (!canProceed) {
      Alert.alert('Required', isReporter ? 'Please select at least one village.' : 'Please complete all location fields.');
      return;
    }
    navigation.navigate('NewsSubmissionStep3', {
      locationData: { state: selectedState, district: selectedDistrict, villages: selectedVillages },
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

  const getDisplayName = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj; // plain ID — no name available
    return obj?.name?.en || obj?.name || obj?._id || '';
  };

  const LocationField = ({label, value, onPress, disabled, active, locked}) => (
    <View style={[styles.fieldWrapper, disabled && !locked && {opacity: 0.3}]}>
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: locked ? '#888' : theme.text }]}>{label}</Text>
        {locked && (
          <View style={styles.lockedBadge}>
            <Icon name="lock" size={11} color="#fff" />
            <Text style={styles.lockedText}>Assigned</Text>
          </View>
        )}
      </View>
      <TouchableOpacity 
        style={[
          styles.fieldInput,
          locked
            ? styles.fieldInputLocked
            : { borderBottomColor: active ? (isDarkMode ? theme.primary : '#000000') : (isDarkMode ? '#444' : '#E0E0E0') }
        ]} 
        onPress={locked ? undefined : onPress}
        disabled={disabled || locked}
        activeOpacity={locked ? 1 : 0.8}
      >
        <Text style={[
          styles.fieldValue,
          { color: locked ? '#888' : theme.text },
          !active && !locked && { color: isDarkMode ? '#666' : '#A0A0A0' }
        ]}>
          {value}
        </Text>
        <Icon
          name={locked ? 'lock' : 'chevron-down'}
          size={18}
          color={locked ? '#aaa' : theme.text}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top, backgroundColor: theme.background}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

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
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {isReporter
              ? 'Your news will be posted to your assigned area.'
              : 'Select the origin of the report.'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <LocationField 
            label="STATE"
            value={selectedState ? getDisplayName(selectedState) : 'Select State'}
            onPress={() => { dispatch(getStates()); setShowStatePicker(true); }}
            active={!!selectedState}
            locked={isReporter && !!assignedState}
          />

          <LocationField 
            label="DISTRICT"
            value={selectedDistrict ? getDisplayName(selectedDistrict) : 'Select District'}
            onPress={() => setShowDistrictPicker(true)}
            disabled={!selectedState}
            active={!!selectedDistrict}
            locked={isReporter && !!assignedDistrict}
          />

          <LocationField
            label="VILLAGE / MANDAL"
            value={selectedVillages.length > 0 ? selectedVillages.map(getDisplayName).join(', ') : 'Select Village(s)'}
            onPress={() => setShowVillagePicker(true)}
            disabled={!selectedDistrict}
            active={selectedVillages.length > 0}
            locked={isReporter && !!assignedVillage}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 24)}]}>
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: isDarkMode ? theme.primary : '#000000' }, !canProceed && [styles.nextButtonDisabled, { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' }]]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={[styles.nextButtonText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Village modal always available; state/district modals only for non-reporters */}
      {!isReporter && (
        <>
          <SelectionModal visible={showStatePicker} onClose={() => setShowStatePicker(false)} title="Select State" data={states} onSelect={handleStateSelect} theme={theme} isDarkMode={isDarkMode} />
          <SelectionModal visible={showDistrictPicker} onClose={() => setShowDistrictPicker(false)} title="Select District" data={districts} onSelect={handleDistrictSelect} theme={theme} isDarkMode={isDarkMode} />
        </>
      )}
      <VillageMultiSelectModal
        visible={showVillagePicker}
        onClose={() => setShowVillagePicker(false)}
        data={villages}
        selected={selectedVillages}
        onToggle={handleVillageToggle}
        theme={theme}
        isDarkMode={isDarkMode}
      />
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

// Same look as SelectionModal but checkbox-style: tapping a row toggles it
// in/out of `selected` instead of immediately closing the modal, so the user
// can pick several villages/mandals before tapping Done.
const VillageMultiSelectModal = ({visible, onClose, data, selected, onToggle, theme, isDarkMode}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Village(s)</Text>
          <TouchableOpacity onPress={onClose}><Icon name="close" size={22} color={theme.text} /></TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => {
            const isChecked = selected.some(v => v._id === item._id);
            return (
              <TouchableOpacity
                style={[styles.modalItem, styles.modalItemRow, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5' }]}
                onPress={() => onToggle(item)}
              >
                <Icon
                  name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={isChecked ? theme.primary : (isDarkMode ? '#666' : '#B0B0B0')}
                />
                <Text style={[styles.modalItemText, { color: theme.text }]}>{item.name?.en || item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity
          style={[styles.modalDoneButton, { backgroundColor: isDarkMode ? theme.primary : '#000000' }, selected.length === 0 && { opacity: 0.4 }]}
          onPress={onClose}
          disabled={selected.length === 0}
        >
          <Text style={[styles.modalDoneText, { color: isDarkMode ? '#000' : '#FFFFFF' }]}>
            Done{selected.length > 0 ? ` (${selected.length})` : ''}
          </Text>
        </TouchableOpacity>
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
  fieldWrapper: {},
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  fieldLabel: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.5 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#888', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lockedText: { fontSize: 10, color: '#fff', fontFamily: fonts.medium },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    paddingVertical: 12,
  },
  fieldInputLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    borderStyle: 'dashed',
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
  modalItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalItemText: { fontSize: 16, fontFamily: fonts.medium },
  modalDoneButton: { marginTop: 16, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  modalDoneText: { fontSize: 15, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
});

export default Step1LocationScreen;
