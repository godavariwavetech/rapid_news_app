import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const OTPVerificationScreen = ({navigation, route}) => {
  const {mobile} = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(23);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (text, index) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      // Verify OTP and navigate to home
      navigation.replace('ProfileSetup');
    }
  };

  const handleResend = () => {
    if (canResend) {
      // Resend OTP logic
      setTimer(23);
      setCanResend(false);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const isOtpComplete = otp.join('').length === 4;

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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.otpTitle}>Enter OTP</Text>
            <Text style={styles.description}>
              Enter the OTP sent to your phone number{'\n'}
              8*******{mobile.slice(-2)}
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={text => handleOtpChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer and Resend */}
          <View style={styles.resendSection}>
            {!canResend ? (
              <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
            ) : null}
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend}
              style={styles.resendButton}>
              <Text
                style={[
                  styles.resendText,
                  !canResend && styles.resendTextDisabled,
                ]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              isOtpComplete && styles.proceedButtonActive,
            ]}
            onPress={handleVerify}
            disabled={!isOtpComplete}
            activeOpacity={0.8}>
            <Text style={styles.proceedButtonText}>proceed</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 50,
  },
  otpTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  otpInput: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    padding: 4,
  },
  resendText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#BBBBBB',
  },
  proceedButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OTPVerificationScreen;
