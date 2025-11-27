import React, {useState} from 'react';
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

const LanguageSelectionScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const [selectedLanguage, setSelectedLanguage] = useState('telugu');
  
  // Check if this is onboarding flow
  const isOnboarding = route?.params?.isOnboarding || false;

  const languages = [
    {
      id: 'telugu',
      icon: 'తě',
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

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Save language preference here if needed
    // You can dispatch an action to save the selected language
    dispatch(completeOnboarding());
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.wrapper}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Close Button - Only show when not onboarding */}
          {!isOnboarding && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={28} color="#999" />
            </TouchableOpacity>
          )}

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

        {/* Continue Button - Only show during onboarding */}
        {isOnboarding && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
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

export default LanguageSelectionScreen;
