import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
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
import { clearReporter, requestOTP, verifyOTP } from '../redux/reducers/auth';
import { setReporterTempToken } from '../redux/reducers/location';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../config/theme';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const MobileLoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  const [mobileNumber, setMobileNumber] = useState('');
  
  const { loading } = useSelector(state => state.auth);

  const handleLocalReporterLogin = async () => {
    const phone = '7997753587';
    setMobileNumber(phone);
    dispatch(clearReporter());
    dispatch(setReporterTempToken(null));

    try {
      await dispatch(requestOTP({ phone })).unwrap();
      const { user } = await dispatch(verifyOTP({ phone, otp: '1234' })).unwrap();
      if (user?.reporter_profile?.status !== 'APPROVED') {
        throw new Error('The local backend did not approve the test reporter account.');
      }
      navigation.replace('ReporterApp');
    } catch (error) {
      Alert.alert(
        'Local reporter login failed',
        error?.message || 'Check that the local backend is running in development mode.',
      );
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          disabled={loading} 
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
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
            <Text style={[styles.enterText, { color: theme.textSecondary }]}>Enter your</Text>
            <Text style={[styles.mobileNumberTitle, { color: theme.text }]}>Mobile Number</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Mobile Number</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderBottomColor: isDarkMode ? '#333' : '#E0E0E0' }]}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholderTextColor={isDarkMode ? '#444' : '#999'}
              editable={!loading} 
            />
          </View>

          <View style={styles.termsSection}>
            <Text style={[styles.termsText, { color: theme.textSecondary }]}>
              by clicking 'proceed' you agree to our{' '}
              <Text style={[styles.linkText, { color: theme.accentBlue }]}>terms & conditions</Text> and{' '}
              <Text style={[styles.linkText, { color: theme.accentBlue }]}>Privacy policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.proceedButton,
              { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' },
              (isValid || loading) ? [styles.proceedButtonActive, { backgroundColor: isDarkMode ? theme.primary : '#1A1A1A' }] : null,
            ]}
            onPress={handleProceed}
            disabled={!isValid || loading} 
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#000" : "#FFFFFF"} />
            ) : (
              <Text style={[styles.proceedButtonText, { color: isDarkMode && isValid ? '#000' : '#FFFFFF' }]}>proceed</Text>
            )}
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.localLoginButton}
              onPress={handleLocalReporterLogin}
              disabled={loading}
              activeOpacity={0.8}>
              <Text style={[styles.localLoginText, { color: theme.accentBlue }]}>
                Local Reporter Login (DEV)
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.descriptionSection}>
            <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
              ఇక్కడ ఫోన్‌ నంబర్‌ ఇచ్చి రాపిడ్‌ న్యూస్‌ నెట్‌వర్క్‌లో చేరండి. మీరు నచ్చే, మెచ్చే వార్తలను చదవడంతో పాటు.. మీరూ స్వయంగా వార్తలను పంపండి.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButtonContainer: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 20, paddingHorizontal: 24 },
  enterText: { fontSize: 16, marginBottom: 4 },
  mobileNumberTitle: { fontSize: 36, fontWeight: '700' },
  inputSection: { marginBottom: 20 },
  label: { fontSize: responsiveFontSize(2.5), marginBottom: 12,fontFamily:fonts.bold },
  input: {
    fontSize: 18,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  termsSection: { marginTop: 24, marginBottom: 32 },
  termsText: { fontSize: responsiveFontSize(2.5), lineHeight: 20,fontFamily:fonts.bold },
  linkText: { fontWeight: '600' },
  proceedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    height: 58, 
    justifyContent: 'center',
  },
  proceedButtonActive: { },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  localLoginButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  localLoginText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: { marginTop: 20 },
  descriptionText: { fontSize: responsiveFontSize(2.5), lineHeight: 22,fontFamily:fonts.bold },
});

export default MobileLoginScreen;
