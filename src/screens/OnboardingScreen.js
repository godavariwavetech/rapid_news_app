import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {completeOnboarding} from '../redux/reducers/auth';
import {setLanguage, setLocation} from '../redux/reducers/settings';
import {lightTheme, darkTheme} from '../utils/colors';
import {LANGUAGES, LOCATIONS} from '../utils/constants';

const {width} = Dimensions.get('window');

const OnboardingScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleLanguageSelect = lang => {
    setSelectedLanguage(lang);
  };

  const handleLocationSelect = loc => {
    setSelectedLocation(loc);
  };

  const handleContinue = () => {
    if (step === 1 && selectedLanguage) {
      dispatch(setLanguage(selectedLanguage));
      setStep(2);
    } else if (step === 2 && selectedLocation) {
      dispatch(setLocation(selectedLocation));
      dispatch(completeOnboarding());
      navigation.replace('Main');
    }
  };

  const renderLanguageItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor:
            selectedLanguage === item.code ? theme.primary : theme.border,
          borderWidth: selectedLanguage === item.code ? 2 : 1,
        },
      ]}
      onPress={() => handleLanguageSelect(item.code)}>
      <Text style={[styles.optionTitle, {color: theme.text}]}>
        {item.nativeName}
      </Text>
      <Text style={[styles.optionSubtitle, {color: theme.textSecondary}]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderLocationItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor:
            selectedLocation === item.id ? theme.primary : theme.border,
          borderWidth: selectedLocation === item.id ? 2 : 1,
        },
      ]}
      onPress={() => handleLocationSelect(item.id)}>
      <Text style={[styles.optionTitle, {color: theme.text}]}>
        {item.name}
      </Text>
      <Text style={[styles.optionSubtitle, {color: theme.textSecondary}]}>
        {item.state}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text style={[styles.logo, {color: theme.primary}]}>Way2News</Text>
        <Text style={[styles.subtitle, {color: theme.textSecondary}]}>
          {step === 1 ? 'Select Your Language' : 'Select Your Location'}
        </Text>
      </View>

      <FlatList
        data={step === 1 ? LANGUAGES : LOCATIONS}
        renderItem={step === 1 ? renderLanguageItem : renderLocationItem}
        keyExtractor={item => (step === 1 ? item.code : item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
      />

      <TouchableOpacity
        style={[
          styles.continueButton,
          {
            backgroundColor:
              (step === 1 && selectedLanguage) ||
              (step === 2 && selectedLocation)
                ? theme.primary
                : theme.border,
          },
        ]}
        onPress={handleContinue}
        disabled={
          (step === 1 && !selectedLanguage) ||
          (step === 2 && !selectedLocation)
        }>
        <Text style={styles.continueButtonText}>
          {step === 1 ? 'Continue' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  optionCard: {
    width: (width - 36) / 2,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
