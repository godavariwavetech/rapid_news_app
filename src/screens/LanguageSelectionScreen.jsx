import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {completeOnboarding} from '../redux/reducers/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationService from '../utils/LocationService';
import { resolveLocation } from '../redux/reducers/location';
import { useTheme } from '../context/ThemeContext';

const LanguageSelectionScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('telugu');
  const insets = useSafeAreaInsets()
  
  // Check if this is onboarding flow
  const isOnboarding = route?.params?.isOnboarding || false;

  const languages = [
    {
      id: 'telugu',
      icon: 'తě',
      name: 'తెలుగు',
      englishName: 'Telugu',
      color: isDarkMode ? '#2D1A24' : '#FFE5F1',
      iconColor: '#FF1493',
    },
    {
      id: 'tamil',
      icon: 'த',
      name: 'தமிழ்',
      englishName: 'Tamil',
      color: isDarkMode ? '#1A2D1F' : '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      id: 'kannada',
      icon: 'ಕ',
      name: 'ಕನ್ನಡ',
      englishName: 'Kannada',
      color: isDarkMode ? '#1A222D' : '#E3F2FD',
      iconColor: '#2196F3',
    },
  ];

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    dispatch(completeOnboarding());
    navigation.replace('Main');
  };
  
    const fetchLocationAreas = async () => {
      try {
         const position = await LocationService.getLocation();
         dispatch(resolveLocation({latitude:position.coords?.latitude,longitude:position.coords?.longitude}))
      } catch (error) {
        
      }
    }
  
    useEffect(()=>{
       fetchLocationAreas()
    },[])
  

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      <View style={styles.wrapper}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Close Button - Only show when not onboarding */}
          {!isOnboarding && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>Choose your preferred language{'\n'}to read the news</Text>

          {/* Language Options */}
          <View style={styles.languageList}>
            {languages.map((language) => {
              const isSelected = selectedLanguage === language.id;
              return (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageCard,
                    { backgroundColor: theme.background, borderColor: isDarkMode ? '#333' : '#E8EAED' },
                    isSelected && [styles.languageCardSelected, { borderColor: theme.primary, backgroundColor: isDarkMode ? '#1E1A1A' : '#FFFBFB' }],
                  ]}
                  onPress={() => handleLanguageSelect(language.id)}
                  activeOpacity={0.7}>
                  <View style={[styles.iconContainer, {backgroundColor: language.color}]}>
                    <Text style={[styles.iconText, {color: language.iconColor}]}>
                      {language.icon}
                    </Text>
                  </View>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, { color: theme.text }]}>{language.name}</Text>
                    <Text style={[styles.languageEnglishName, { color: theme.textSecondary }]}>{language.englishName}</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                      <Icon name="check" size={20} color={isDarkMode ? '#000' : "#FFFFFF"} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Continue Button - Only show during onboarding */}
        {isOnboarding && (
          <View style={[styles.buttonContainer,{marginBottom:insets.bottom, backgroundColor: theme.background, borderTopColor: isDarkMode ? '#333' : '#F0F0F0'}]}>
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
              onPress={handleContinue}
              activeOpacity={0.8}>
              <Text style={[styles.continueButtonText, { color: isDarkMode ? '#000' : '#FFF' }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 10,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 35,
    lineHeight: 30,
  },
  languageList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
  },
  languageCardSelected: { },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LanguageSelectionScreen;
