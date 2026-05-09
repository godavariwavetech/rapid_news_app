import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, StatusBar, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { applogo } from '../assets';
import LocationService from '../utils/LocationService';
import { resolveLocation } from '../redux/reducers/location';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const isOnboardingComplete = useSelector(state => state.auth.isOnboardingComplete);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const watchIdRef = useRef(null);

  const handleNavigation = () => {
    navigation.replace('Main');
  };

  const fetchLocationAreas = async () => {
    try {
      // 1. Get the device location (Lat, Long)
      const position = await LocationService.getLocation();
      
      // 2. Resolve those coordinates to your backend location IDs (Village, District, State)
      await dispatch(
        resolveLocation({
          latitude: position.coords?.latitude,
          longitude: position.coords?.longitude,
        }),
      ).unwrap(); 

      // HomeScreen will fetch news once currentLocation is set in Redux

    } catch (error) {
      console.log('Location permission denied or an error occurred:', error);
      // HomeScreen will fall back to default location news
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

    fetchLocationAreas()

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
      
      {/* BACKGROUND: The Royal Blue Gradient */}
      <LinearGradient
        colors={['#1e3c72', '#2a5298']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Logo Section */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
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
    backgroundColor: '#1e3c72',
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
    backgroundColor: '#FFFFFF', 
    borderRadius: 100, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, // Adjusted padding to 10 so logo is larger
  },
  logoImage: {
    width: '90%',
    height: '90%',
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