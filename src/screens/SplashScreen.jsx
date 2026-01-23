import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { applogo } from '../assets';

const SplashScreen = ({ navigation }) => {
  const isOnboardingComplete = useSelector(state => state.auth.isOnboardingComplete);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  console.log(isAuthenticated,">>>>>>>>>>>>isAuthenticated",isOnboardingComplete);

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
    // Logo Animation: Bounce in
    scale.value = withSequence(
      withTiming(0.5, { duration: 300 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    opacity.value = withTiming(1, { duration: 800 });
    
    // Navigate away after 2.5 seconds
    const timer = setTimeout(() => {
      handleNavigation();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Animated Styles
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Light content status bar looks best on Blue */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* BACKGROUND: The Royal Blue Gradient you liked */}
      <LinearGradient
        colors={['#1e3c72', '#2a5298']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo Section */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        
        {/* FIX: White Background Circle
            This ensures the logo sits on White, preventing it 
            from mixing with the Blue background. 
        */}
        <View style={styles.logoCircle}>
          <Image 
            source={applogo} 
            style={styles.logoImage}
            resizeMode="contain" 
          />
        </View>

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
    backgroundColor: '#1e3c72', // Fallback color
  },
  logoContainer: {
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoCircle: {
    width: 200, 
    height: 200,
    // Pure White Background to protect the logo
    backgroundColor: '#FFFFFF', 
    borderRadius: 100, // Perfectly round
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30, // Padding keeps the logo away from the blue edge
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)', 
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;