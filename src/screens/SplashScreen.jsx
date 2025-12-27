import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, Dimensions, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay, 
  withTiming,
  runOnJS 
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { lightTheme } from '../utils/colors'; //
import { applogo } from '../assets';

const SplashScreen = ({ navigation }) => {
  // 1. Get Auth State
  const isOnboardingComplete = useSelector(state => state.auth.isOnboardingComplete); //
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // 2. Animation Values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  // 3. Navigation Logic
  const handleNavigation = () => {
    if (!isOnboardingComplete) {
      navigation.replace('LanguageSelection');
    } else if (isAuthenticated) {
      navigation.replace('Main');
    } else {
      navigation.replace('Main');
    }
  };

  useEffect(() => {
    // 4. Animation Sequence
    // Logo pops up
    scale.value = withSequence(
      withTiming(0.5, { duration: 300 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    opacity.value = withTiming(1, { duration: 800 });
    
    // Text fades in
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));

    // Navigate away after 2.5 seconds
    const timer = setTimeout(() => {
      handleNavigation();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 5. Animated Styles
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withSpring(textOpacity.value ? 0 : 20) }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[lightTheme.primary, '#E85A2A']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo Section */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <View style={styles.logoCircle}>
          {/* Using your specific app logo asset */}
          <Image 
            source={applogo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.title}>Siti News</Text>
        <Text style={styles.subtitle}>Short News, Big Impact</Text>
      </Animated.View>

      {/* Footer Text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made for India</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.primary,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 140, // Slightly larger for image logos
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Padding to ensure logo doesn't touch edges
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
    // fontFamily: 'DMSans-Bold', // Uncomment if using custom font
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;