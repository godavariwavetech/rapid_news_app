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

// The logo animation needs a beat to be seen rather than flash past; beyond that,
// holding the splash is pure waiting.
const MIN_SPLASH_MS = 700;
// Hard ceiling for a first-ever launch, where there is no stored location and GPS
// is genuinely worth a short wait. Never longer than this, whatever happens.
const MAX_LOCATION_WAIT_MS = 2500;

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch()
  const isOnboardingComplete = useSelector(state => state.auth.isOnboardingComplete);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  // Location is redux-persist'ed, so on every launch after the first we already
  // know which feed to load and don't have to wait for GPS at all.
  const hasStoredLocation = useSelector(state => !!state.location.currentLocation);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const watchIdRef = useRef(null);
  const navigatedRef = useRef(false);

  const handleNavigation = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
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

    const startedAt = Date.now();
    let minTimer;

    // Leave as soon as we're ready, never before the animation has been seen.
    // This used to be a flat 2500ms setTimeout — a fixed 2.5s tax on every cold
    // start even when the feed could have been fetched immediately.
    const goWhenReady = () => {
      minTimer = setTimeout(handleNavigation, Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt)));
    };

    // Location resolution keeps running either way; with a stored location we
    // just don't block Home on it — HomeScreen refetches if the area changed.
    const resolving = fetchLocationAreas();
    if (hasStoredLocation) {
      goWhenReady();
    } else {
      resolving.finally(goWhenReady);
    }

    const cap = setTimeout(handleNavigation, MAX_LOCATION_WAIT_MS);

    return () => {
      clearTimeout(cap);
      clearTimeout(minTimer);
    };
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