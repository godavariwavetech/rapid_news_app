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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { verifyOTP } from '../redux/reducers/auth';
import { setReporterTempToken } from '../redux/reducers/location';
import { useTheme } from '../context/ThemeContext';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const OTPVerificationScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  const {mobile} = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(23);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const maskPhoneNumber = (phone) => {
    if (!phone || phone.length < 4) return phone;
    const firstTwo = phone.slice(0, 2);
    const lastTwo = phone.slice(-2);
    const maskLength = phone.length - 4;
    return `${firstTwo}${'*'.repeat(maskLength)}${lastTwo}`;
  };

  const handleOtpChange = (text, index) => {
    if (errorMessage) {
      setErrorMessage('');
    }
    
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      setErrorMessage('');
      setIsLoading(true);
      
      const payload = {
        phone: mobile,
        otp: otpCode
      };
      
      try {
        const response = await dispatch(verifyOTP(payload));
        
        if (response.type === 'auth/verifyOTP/fulfilled') {
          const { token, user } = response.payload;
          if (!user.reporter_profile?.full_name) {
            dispatch(setReporterTempToken(token))
            navigation.replace('ProfileSetup', { token: token });
          } else {
            const status = user?.reporter_profile?.status;
            if (status === 'APPROVED') {
              navigation.replace('ReporterApp');
            } else {
              navigation.replace('ReporterStatus', { status: status });
            }
          }

        } else if (response.type === 'auth/verifyOTP/rejected') {
          const apiError = response.payload?.message || response.error?.message || 'Verification failed. Please try again.';
          setErrorMessage(apiError);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResend = () => {
    if (canResend) {
      setTimer(23);
      setCanResend(false);
      setOtp(['', '', '', '']);
      setErrorMessage('');
      inputRefs.current[0]?.focus();
    }
  };

  const isOtpComplete = otp.join('').length === 4;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={[styles.otpTitle, { color: theme.text }]}>Enter OTP</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Enter the OTP sent to your phone number{'\n'}
              {maskPhoneNumber(mobile)}
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#D0D5DD', color: theme.text },
                  errorMessage && styles.otpInputError
                ]}
                value={digit}
                onChangeText={text => handleOtpChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* Error Message Display */}
          {errorMessage ? (
            <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#331111' : '#FEE2E2' }]}>
              <Icon name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Timer and Resend */}
          <View style={styles.resendSection}>
            {!canResend ? (
              <Text style={[styles.timerText, { color: theme.textSecondary }]}>Resend OTP in {timer}s</Text>
            ) : null}
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || isLoading}
              style={styles.resendButton}>
              <Text
                style={[
                  styles.resendText,
                  { color: theme.text },
                  (!canResend || isLoading) && [styles.resendTextDisabled, { color: isDarkMode ? '#444' : '#BBBBBB' }],
                ]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' },
              isOtpComplete && [styles.proceedButtonActive, { backgroundColor: isDarkMode ? theme.primary : '#1A1A1A' }],
            ]}
            onPress={handleVerify}
            disabled={!isOtpComplete || isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#000" : "#FFFFFF"} />
            ) : (
              <Text style={[styles.proceedButtonText, { color: isDarkMode && isOtpComplete ? '#000' : '#FFFFFF' }]}>Proceed</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  otpInput: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  otpInputError: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 15,
    marginBottom: 8,
  },
  resendButton: {
    padding: 4,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: { },
  proceedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  proceedButtonActive: { },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
