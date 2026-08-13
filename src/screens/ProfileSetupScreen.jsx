import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useDispatch, useSelector} from 'react-redux';
import {
  getStates, 
  getDistrict, 
  getVillages, 
  checkVillageCapacity,
  resolveLocation
} from '../redux/reducers/location';
import {applyReporter} from '../redux/reducers/auth';
import LocationService from '../utils/LocationService';
import uploadMedia from '../utils/uploadMedia';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ProfileSetupScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  
  const {states, districts, villages, loading: locationLoading} = useSelector(state => state.location);
  const {loading: authLoading} = useSelector(state => state.auth || {});

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageAsset, setProfileImageAsset] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [username, setUsername] = useState('Eshwar');
  const [fullName, setFullName] = useState('Eshwar vanapalli');
  const [email, setEmail] = useState('eshwar@gmail.com');
  
  // Selection State
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [checkingCapacity, setCheckingCapacity] = useState(false);

  // Modals Visibility
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(getStates());
  }, [dispatch]);

  const handleDetectLocation = async (isAuto = false) => {
    setIsLocating(true);
    try {
      const position = await LocationService.getLocation();
      const { latitude, longitude } = position.coords;
      const resultAction = await dispatch(resolveLocation({ latitude, longitude }));

      if (resolveLocation.fulfilled.match(resultAction)) {
        const data = resultAction.payload;
        if (data && data.state && data.district) {
          setSelectedState(data.state);
          dispatch(getDistrict(data.state._id));
          setSelectedDistrict(data.district);
          
          dispatch(getVillages(data.district._id));
          setSelectedVillage(null);

          setErrors(prev => ({...prev, state: null, district: null}));
          if (!isAuto) Alert.alert('Success', `Location detected: ${data.district.name.en}, ${data.state.name.en}`);
        } else if (!isAuto) {
          Alert.alert('Notice', 'Location detected, but could not match to our database exactly.');
        }
      } else if (!isAuto) {
        Alert.alert('Error', 'Could not resolve location details from server.');
      }
    } catch (error) {
      console.log('Location Error:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'Min 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Alphanumeric & underscore only';

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) newErrors.fullName = 'Min 2 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email)) newErrors.email = 'Invalid email format';

    if (!selectedState) newErrors.state = 'State is required';
    if (!selectedDistrict) newErrors.district = 'District is required';
    if (!selectedVillage) newErrors.village = 'Village is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = async () => {
    if (validateForm()) {
      const { token } = route.params || {};
      
      if (!token) {
        Alert.alert("Error", "Authentication token missing. Please try logging in again.");
        return;
      }

      const payload = {
        username: username,
        full_name: fullName,
        email: email,
        state_id: selectedState._id,
        district_id: selectedDistrict._id,
        village_id: selectedVillage._id,
      };

      // Upload the picked photo; the backend only keeps profile_image when truthy,
      // so skipping it on failure leaves the account with no image rather than a
      // dead local uri. (This used to always post a stock pngtree avatar.)
      if (profileImageAsset) {
        setUploadingImage(true);
        const url = await uploadMedia(profileImageAsset);
        setUploadingImage(false);
        if (url) {
          payload.profile_image = url;
        } else {
          Alert.alert('Notice', 'Could not upload your photo — continuing without it.');
        }
      }

      try {
        const resultAction = await dispatch(applyReporter(payload));
        console.log(resultAction,">>>>>>>>>>RESULT ACTION");
        if (applyReporter.fulfilled.match(resultAction)) {
          Alert.alert('Success', 'Profile setup completed!', [
            { text: 'OK', onPress: () => navigation.replace('ReporterStatus', { status: 'PENDING' }) }
          ]);
        } else {
          const errorMessage = resultAction.payload?.message || 'Failed to submit application';
          Alert.alert('Error', errorMessage);
        }
      } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } else {
      Alert.alert('Validation Error', 'Please fill all fields correctly');
    }
  };

  const handleImagePick = () => {
    const options = { 
      mediaType: 'photo', 
      quality: 0.8,
      includeBase64: true 
    };
    launchImageLibrary(options, response => {
      if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0].uri);
        setProfileImageAsset(response.assets[0]);
      }
    });
  };

  const handleStateSelect = (item) => {
    setSelectedState(item);
    setShowStatePicker(false);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    dispatch(getDistrict(item._id));
    if (errors.state) setErrors({...errors, state: null});
  };

  const handleDistrictSelect = (item) => {
    setSelectedDistrict(item);
    setShowDistrictPicker(false);
    setSelectedVillage(null);
    dispatch(getVillages(item._id)); 
    if (errors.district) setErrors({...errors, district: null});
  };

  const handleVillageSelect = async (item) => {
    setCheckingCapacity(true);
    try {
      const resultAction = await dispatch(checkVillageCapacity(item._id));
      if (checkVillageCapacity.fulfilled.match(resultAction)) {
        const data = resultAction.payload;
        if (data) {
          setSelectedVillage(item);
          setShowVillagePicker(false);
          if (errors.village) setErrors({...errors, village: null});
        } else {
          Alert.alert("Village Full", "This village has reached its maximum reporter capacity. Please select another village.");
          setSelectedVillage(null);
        }
      } else {
        Alert.alert("Error", "Could not verify village capacity. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while checking capacity.");
    } finally {
      setCheckingCapacity(false);
    }
  };

  const isFormValid = 
    username.trim().length >= 3 && 
    fullName.trim().length >= 2 && 
    email.trim().length > 5 && 
    selectedState && 
    selectedDistrict &&
    selectedVillage;

  const SelectionModal = ({visible, onClose, title, data, onSelect, emptyMessage}) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Icon name="close" size={24} color={theme.text} /></TouchableOpacity>
          </View>
          {checkingCapacity && title === "Select Village" ? (
             <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 10, color: theme.textSecondary }}>Checking availability...</Text>
             </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 20}}
              renderItem={({item}) => (
                <TouchableOpacity style={[styles.listItem, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={() => onSelect(item)}>
                  <Text style={[styles.listItemText, { color: theme.text }]}>{item.name?.en || item.name}</Text>
                  <Icon name="chevron-right" size={20} color={isDarkMode ? '#444' : "#ccc"} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>{locationLoading ? 'Loading...' : emptyMessage}</Text>}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePick}>
              {profileImage ? (
                <Image source={{uri: profileImage}} style={styles.profileImage} />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#2196F3' }]}><Icon name="camera" size={32} color={theme.primary} /></View>
              )}
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={[styles.completeText, { color: theme.textSecondary }]}>Complete</Text>
              <Text style={[styles.profileTitle, { color: theme.text }]}>your basic profile</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>User Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.username && styles.inputError]}
                value={username}
                onChangeText={(t) => { setUsername(t); if(errors.username) setErrors({...errors, username: null}) }}
                placeholder="Enter username"
                placeholderTextColor={isDarkMode ? '#444' : "#999"}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(t) => { setFullName(t); if(errors.fullName) setErrors({...errors, fullName: null}) }}
                placeholder="Enter full name"
                placeholderTextColor={isDarkMode ? '#444' : "#999"}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.email && styles.inputError]}
                value={email}
                onChangeText={(t) => { setEmail(t); if(errors.email) setErrors({...errors, email: null}) }}
                placeholder="Enter email address"
                placeholderTextColor={isDarkMode ? '#444' : "#999"}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.locationHeader}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Location Details</Text>
              <TouchableOpacity style={[styles.detectButton, { backgroundColor: isDarkMode ? '#1A222D' : '#E3F2FD' }]} onPress={() => handleDetectLocation(false)} disabled={isLocating}>
                {isLocating ? <ActivityIndicator size="small" color={theme.primary} /> : <><Icon name="crosshairs-gps" size={16} color={theme.primary} /><Text style={[styles.detectButtonText, { color: theme.primary }]}>Use Current Location</Text></>}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>State</Text>
              <TouchableOpacity style={[styles.input, styles.dropdownInput, { borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.state && styles.inputError]} onPress={() => setShowStatePicker(true)}>
                <Text style={[styles.inputText, { color: theme.text }, !selectedState && { color: isDarkMode ? '#444' : '#999' }]}>{selectedState ? selectedState.name.en : 'Select State'}</Text>
                <Icon name="chevron-down" size={24} color={isDarkMode ? '#444' : "#999"} />
              </TouchableOpacity>
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>District</Text>
              <TouchableOpacity 
                style={[styles.input, styles.dropdownInput, { borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.district && styles.inputError, !selectedState && styles.disabledInput]} 
                onPress={() => selectedState && setShowDistrictPicker(true)} 
                disabled={!selectedState}
              >
                <Text style={[styles.inputText, { color: theme.text }, !selectedDistrict && { color: isDarkMode ? '#444' : '#999' }]}>{selectedDistrict ? selectedDistrict.name.en : 'Select District'}</Text>
                <Icon name="chevron-down" size={24} color={isDarkMode ? '#444' : "#999"} />
              </TouchableOpacity>
              {!selectedState && <Text style={styles.helperText}>Select state first</Text>}
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Village</Text>
              <TouchableOpacity 
                style={[styles.input, styles.dropdownInput, { borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }, errors.village && styles.inputError, !selectedDistrict && styles.disabledInput]} 
                onPress={() => selectedDistrict && setShowVillagePicker(true)} 
                disabled={!selectedDistrict}
              >
                <Text style={[styles.inputText, { color: theme.text }, !selectedVillage && { color: isDarkMode ? '#444' : '#999' }]}>{selectedVillage ? selectedVillage.name.en : 'Select Village'}</Text>
                <Icon name="chevron-down" size={24} color={isDarkMode ? '#444' : "#999"} />
              </TouchableOpacity>
              {!selectedDistrict && <Text style={styles.helperText}>Select district first</Text>}
              {errors.village && <Text style={styles.errorText}>{errors.village}</Text>}
            </View>

          </View>

          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' }, isFormValid && !authLoading && [styles.proceedButtonActive, { backgroundColor: isDarkMode ? theme.primary : '#1A1A1A' }]]}
            onPress={handleProceed}
            disabled={!isFormValid || authLoading || uploadingImage}
          >
            {authLoading || uploadingImage ? (
              <ActivityIndicator color={isDarkMode ? "#000" : "#FFF"} />
            ) : (
              <Text style={[styles.proceedButtonText, { color: isDarkMode && isFormValid ? '#000' : '#FFFFFF' }]}>Proceed</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectionModal visible={showStatePicker} onClose={() => setShowStatePicker(false)} title="Select State" data={states} onSelect={handleStateSelect} emptyMessage="No states available" />
      <SelectionModal visible={showDistrictPicker} onClose={() => setShowDistrictPicker(false)} title="Select District" data={districts} onSelect={handleDistrictSelect} emptyMessage="No districts available" />
      <SelectionModal visible={showVillagePicker} onClose={() => setShowVillagePicker(false)} title="Select Village" data={villages} onSelect={handleVillageSelect} emptyMessage="No villages available" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: STATUS_BAR_HEIGHT + 20, paddingHorizontal: 24, paddingBottom: 30 },
  headerSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 16 },
  profileImageContainer: { width: 90, height: 90 },
  profileImage: { width: 90, height: 90, borderRadius: 45 },
  placeholderImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  titleSection: { flex: 1 },
  completeText: { fontSize: 18, marginBottom: 4 },
  profileTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  formSection: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  detectButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  detectButtonText: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '600' },
  subLabel: { fontSize: 15, marginBottom: 8, fontWeight: '500' },
  input: { fontSize: 16, borderBottomWidth: 1, paddingVertical: 12 },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disabledInput: { opacity: 0.5 },
  inputText: { fontSize: 16 },
  inputError: { borderBottomColor: '#FF3B30' },
  errorText: { fontSize: 12, color: '#FF3B30', marginTop: 6 },
  helperText: { fontSize: 12, color: '#999', marginTop: 4 },
  proceedButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  proceedButtonActive: { },
  proceedButtonText: { fontSize: 18, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  listItemText: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});

export default ProfileSetupScreen;
