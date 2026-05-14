import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay 
} from 'react-native-reanimated';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { fonts } from '../config/theme';

const { width } = Dimensions.get('window');

const OfflineFallback = ({ 
  onRetry, 
  title = "No Internet Connection", 
  message = "You seem to be offline. Check your connection and try again.",
  icon = "wifi-off",
  buttonText = "Reload" 
}) => {
  // Animation Values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(100, withSpring(1));
    translateY.value = withDelay(100, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1F2329', '#000000']} 
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />

      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Icon Container with Glow Effect */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={['rgba(231, 76, 60, 0.15)', 'rgba(0,0,0,0)']}
            style={styles.glowEffect}
          />
          <View style={styles.iconCircle}>
            <Icon name={icon} size={48} color="#E74C3C" />
          </View>
        </View>
        
        {/* Text Content */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{message}</Text>

        {/* Retry Button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={onRetry}
          style={styles.buttonShadow}
        >
          <LinearGradient
            colors={['#E74C3C', '#C0392B']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
            <Icon name="refresh" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    marginBottom: responsiveHeight(4),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(2.8),
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#9BA1A6', 
    fontSize: responsiveFontSize(1.9),
    fontFamily: fonts.description,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: responsiveHeight(5),
  },
  buttonShadow: {
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderRadius: 30,
    width: '80%',
    alignSelf: 'center',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(2.2),
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default OfflineFallback;
