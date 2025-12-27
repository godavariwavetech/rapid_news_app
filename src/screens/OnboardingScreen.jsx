import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {completeOnboarding} from '../redux/reducers/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LocationService from '../utils/LocationService';
import { resolveLocation } from '../redux/reducers/location';

  const languages = [
    {
      id: 'telugu',
      icon: 'తె',
      name: 'తెలుగు',
      englishName: 'Telugu',
      color: '#FFE5F1',
      iconColor: '#FF1493',
    },
    {
      id: 'tamil',
      icon: 'த',
      name: 'தமிழ்',
      englishName: 'Tamil',
      color: '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      id: 'kannada',
      icon: 'ಕ',
      name: 'ಕನ್ನಡ',
      englishName: 'Kannada',
      color: '#E3F2FD',
      iconColor: '#2196F3',
    },
  ];

const OnboardingScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [selectedLanguage, setSelectedLanguage] = useState('telugu');

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
  };

  const handleContinue = () => {
    dispatch(completeOnboarding());
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>Choose your preferred language{'\n'}to read the news</Text>

        {/* Language Options */}
        <View style={styles.languageList}>
          {languages.map((language) => {
            const isSelected = selectedLanguage === language.id;
            return (
              <TouchableOpacity
                key={language.id}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardSelected,
                ]}
                onPress={() => handleLanguageSelect(language.id)}
                activeOpacity={0.7}>
                <View style={[styles.iconContainer, {backgroundColor: language.color}]}>
                  <Text style={[styles.iconText, {color: language.iconColor}]}>
                    {language.icon}
                  </Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageEnglishName}>{language.englishName}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Icon name="check" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingHorizontal: 40,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8EAED',
  },
  languageCardSelected: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFFBFB',
  },
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
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default OnboardingScreen;
