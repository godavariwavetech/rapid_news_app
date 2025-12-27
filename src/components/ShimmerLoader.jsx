import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';

const {width} = Dimensions.get('window');

const ShimmerLoader = ({height = 200, borderRadius = 12}) => {
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.container,
        {height, borderRadius, backgroundColor: theme.cardBackground},
      ]}>
      <Animated.View style={[styles.shimmer, {transform: [{translateX}]}]}>
        <LinearGradient
          colors={theme.shimmer}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginVertical: 8,
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});

export default ShimmerLoader;
