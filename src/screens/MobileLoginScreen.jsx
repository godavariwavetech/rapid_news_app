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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { requestOTP } from '../redux/reducers/auth';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const MobileLoginScreen = ({navigation}) => {
  const disptach = useDispatch()
  const [mobileNumber, setMobileNumber] = useState('');

  const handleProceed = async () => {
    if (mobileNumber.length === 10) {
      const payload = {
        "phone": mobileNumber
      }
      const response = await disptach(requestOTP(payload))
      console.log(response,">>>>>>>>Responseeee");
      if(response?.payload?.status==200){
        navigation.navigate('OTPVerification', {mobile: mobileNumber});
      }
    } else {
      alert('Please enter a valid 10-digit mobile number');
    }
  };

  const isValid = mobileNumber.length === 10;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.enterText}>Enter your</Text>
            <Text style={styles.mobileNumberTitle}>Mobile Number</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholderTextColor="#999"
            />
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              by clicking 'proceed' you agree to our{' '}
              <Text style={styles.linkText}>terms & conditions</Text> and{' '}
              <Text style={styles.linkText}>Privacy policy</Text>
            </Text>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              isValid && styles.proceedButtonActive,
            ]}
            onPress={handleProceed}
            disabled={!isValid}
            activeOpacity={0.8}>
            <Text style={styles.proceedButtonText}>proceed</Text>
          </TouchableOpacity>

          {/* Description Text */}
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButtonContainer: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 60,
  },
  enterText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  mobileNumberTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  input: {
    fontSize: 18,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  termsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linkText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  proceedButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  descriptionSection: {
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 22,
  },
});

export default MobileLoginScreen;
