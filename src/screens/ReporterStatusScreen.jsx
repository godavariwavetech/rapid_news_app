import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../config/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ReporterStatusScreen = ({ route, navigation }) => {
  const { status } = route.params || { status: 'PENDING' };
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Configuration based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'DISAPPROVED':
      case 'REJECTED':
        return {
          icon: 'shield-alert-outline',
          iconColor: '#DC2626',
          bgColor: isDarkMode ? '#2D1F1F' : '#FEF2F2',
          borderColor: isDarkMode ? '#442222' : '#FEE2E2',
          title: 'Application Not Approved',
          message: 'Thank you for your interest. Unfortunately, your profile did not meet our current criteria for reporters.',
          subMessage: 'If you believe this is a mistake, please review your details or contact our support team.',
          primaryAction: 'Back to Home',
          secondaryAction: 'Contact Support',
          showSecondary: true,
        };
      case 'PENDING':
      default:
        return {
          icon: 'shield-check-outline',
          iconColor: theme.primary,
          bgColor: isDarkMode ? '#1A222D' : '#F0F9FF',
          borderColor: isDarkMode ? '#223344' : '#E0F2FE',
          title: 'Verification Pending',
          message: 'Your application is currently under review by our verification team.',
          subMessage: 'This usually takes 24-48 hours. We will notify you once your reporter access is approved.',
          primaryAction: 'Explore News',
          showSecondary: false,
        };
    }
  };

  const config = getStatusConfig();

  const handlePrimaryPress = () => {
    navigation.replace('Main');
  };

  const handleSecondaryPress = () => {
    Linking.openURL('mailto:support@way2news.com?subject=Reporter Application Inquiry');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Decorative Background Circles */}
      <View style={[styles.circle, styles.circleTop, { backgroundColor: config.bgColor }]} />
      <View style={[styles.circle, styles.circleBottom, { backgroundColor: config.bgColor }]} />

      <View style={styles.contentContainer}>
        
        {/* Animated Icon Section */}
        <Animated.View style={[
          styles.iconWrapper, 
          { 
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            transform: [{ scale: scaleAnim }] 
          }
        ]}>
          <Icon name={config.icon} size={64} color={config.iconColor} />
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{config.message}</Text>
          
          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }]} />
          
          <Text style={[styles.subMessage, { color: theme.textSecondary }]}>{config.subMessage}</Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 20, opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handlePrimaryPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: isDarkMode ? '#000' : '#FFF' }]}>{config.primaryAction}</Text>
          <Icon name="arrow-right" size={20} color={isDarkMode ? '#000' : '#FFF'} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {config.showSecondary && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSecondaryPress}
            activeOpacity={0.6}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>{config.secondaryAction}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    opacity: 0.5,
    zIndex: -1,
  },
  circleTop: {
    top: -width * 0.7,
    right: -width * 0.3,
  },
  circleBottom: {
    bottom: -width * 0.8,
    left: -width * 0.4,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    width: 60,
    marginVertical: 24,
    alignSelf: 'center',
  },
  subMessage: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
  },
});

export default ReporterStatusScreen;
