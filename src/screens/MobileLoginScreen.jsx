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
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator, 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { clearReporter, requestOTP } from '../redux/reducers/auth';
import { setReporterTempToken } from '../redux/reducers/location';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const MobileLoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [mobileNumber, setMobileNumber] = useState('');
  
  // 1. Getting loading state from Redux
  const { loading } = useSelector(state => state.auth);

  const handleProceed = async () => {
    if (mobileNumber.length === 10) {
      const payload = { "phone": mobileNumber };
      
      try {
        const response = await dispatch(requestOTP(payload));
        if (response?.payload?.status === 200) {
          dispatch(clearReporter())
          dispatch(setReporterTempToken(null))
          navigation.navigate('OTPVerification', {mobile: mobileNumber});
        }
      } catch (error) {
        console.error("Login Error:", error);
      }
    } else {
      alert('Please enter a valid 10-digit mobile number');
    }
  };

  const isValid = mobileNumber.length === 10;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          disabled={loading} 
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <View style={{ marginBottom: 60 }}>
            <Text style={styles.enterText}>Enter your</Text>
            <Text style={styles.mobileNumberTitle}>Mobile Number</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholderTextColor="#999"
              editable={!loading} // Prevents typing while API is fetching
            />
          </View>

          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              by clicking 'proceed' you agree to our{' '}
              <Text style={styles.linkText}>terms & conditions</Text> and{' '}
              <Text style={styles.linkText}>Privacy policy</Text>
            </Text>
          </View>

          {/* 2. Enhanced Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              // Keep button dark if valid OR if currently loading
              (isValid || loading) ? styles.proceedButtonActive : null,
            ]}
            onPress={handleProceed}
            disabled={!isValid || loading} 
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.proceedButtonText}>proceed</Text>
            )}
          </TouchableOpacity>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              ఇక్కడ ఫ్రాన్ సంబంధ ఇవ్వి వేణుస్తు నేటుప్ర్యబ్లో చేరండి. మీరు
              సున్నాన్ మొత్తే వార్తలను చుటుప్పకళ్లతో పొటు.. మీరు సుర్వర్యంగా
              వార్తలను పంపండి, ఆదాయన్ని పొందండి..
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  backButtonContainer: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 20, paddingHorizontal: 24 },
  enterText: { fontSize: 16, color: '#666', marginBottom: 4 },
  mobileNumberTitle: { fontSize: 36, fontWeight: '700', color: '#1A1A1A' },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 16, color: '#999', marginBottom: 12 },
  input: {
    fontSize: 18,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  termsSection: { marginTop: 24, marginBottom: 32 },
  termsText: { fontSize: 14, color: '#666', lineHeight: 20 },
  linkText: { color: '#2196F3', fontWeight: '600' },
  proceedButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    height: 58, // Fixed height prevents the button from jumping when loader appears
    justifyContent: 'center',
  },
  proceedButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  descriptionSection: { marginTop: 20 },
  descriptionText: { fontSize: 14, color: '#999', lineHeight: 22 },
});

export default MobileLoginScreen;