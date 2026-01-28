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
import { fonts, lightTheme } from '../config/theme'; //

const { width } = Dimensions.get('window');

const ReporterStatusScreen = ({ route, navigation }) => {
  const { status } = route.params || { status: 'PENDING' };
  const insets = useSafeAreaInsets();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Sequence animations for a polished entrance
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
          bgColor: '#FEF2F2', // Light Red
          borderColor: '#FEE2E2',
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
          icon: 'shield-check-outline', // Or 'timer-sand'
          iconColor: lightTheme.primary, // #064081
          bgColor: '#F0F9FF', // Light Blue
          borderColor: '#E0F2FE',
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.subMessage}>{config.subMessage}</Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 20, opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: lightTheme.primary }]} //
          onPress={handlePrimaryPress}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>{config.primaryAction}</Text>
          <Icon name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {config.showSecondary && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSecondaryPress}
            activeOpacity={0.6}
          >
            <Text style={[styles.secondaryButtonText, { color: lightTheme.darkGray }]}>{config.secondaryAction}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold, //
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.medium, //
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    width: 60,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
    alignSelf: 'center',
  },
  subMessage: {
    fontSize: 14,
    fontFamily: fonts.regular, //
    color: '#6B7280',
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
    shadowColor: "#064081",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold, //
    color: '#FFFFFF',
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
    fontFamily: fonts.medium, //
  },
});

export default ReporterStatusScreen;