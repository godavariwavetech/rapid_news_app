import {useState, useRef, useEffect} from 'react';
import {Animated} from 'react-native';

export function useAnimatedTabs(initialVisible = true) {
  const [uiVisible, setUiVisible] = useState(initialVisible);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const bottomTabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: uiVisible ? 0 : -200,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.spring(bottomTabAnim, {
        toValue: uiVisible ? 0 : 100,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
    ]).start();
  }, [uiVisible, headerAnim, bottomTabAnim]);

  const toggleUI = () => {
    setUiVisible(prev => !prev);
  };

  return {
    uiVisible,
    headerAnim,
    bottomTabAnim,
    toggleUI,
    setUiVisible,
  };
}
