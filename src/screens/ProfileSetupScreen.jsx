import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary} from 'react-native-image-picker';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const ProfileSetupScreen = ({navigation}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('');
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Username validation (3-20 chars, alphanumeric and underscore only)
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscore';
    }

    // Full Name validation (at least 2 chars)
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // District validation
    if (!district.trim()) {
      newErrors.district = 'District location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const handleProceed = () => {
    if (validateForm()) {
      // Save profile data and navigate to home
      const profileData = {
        profileImage,
        username,
        fullName,
        district,
      };
      
      console.log('Profile Data:', profileData);
      // Navigate to main app
      navigation.replace('ReporterApp');
    } else {
      Alert.alert('Validation Error', 'Please fill all fields correctly');
    }
  };

  const isFormValid = username.trim().length >= 3 && 
                      fullName.trim().length >= 2 && 
                      district.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header with Profile Picture */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleImagePick}
              activeOpacity={0.7}>
              {profileImage ? (
                <Image source={{uri: profileImage}} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="camera" size={32} color="#2196F3" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.titleSection}>
              <Text style={styles.completeText}>Complete</Text>
              <Text style={styles.profileTitle}>your basic profile</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>User Name</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) {
                    setErrors({...errors, username: null});
                  }
                }}
                placeholder=""
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors({...errors, fullName: null});
                  }
                }}
                placeholder=""
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* District Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>District Location</Text>
              <TextInput
                style={[styles.input, errors.district && styles.inputError]}
                value={district}
                onChangeText={(text) => {
                  setDistrict(text);
                  if (errors.district) {
                    setErrors({...errors, district: null});
                  }
                }}
                placeholder=""
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              {errors.district && (
                <Text style={styles.errorText}>{errors.district}</Text>
              )}
            </View>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.proceedButton,
              isFormValid && styles.proceedButtonActive,
            ]}
            onPress={handleProceed}
            disabled={!isFormValid}
            activeOpacity={0.8}>
            <Text style={styles.proceedButtonText}>proceed</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: STATUS_BAR_HEIGHT + 40,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
    gap: 16,
  },
  profileImageContainer: {
    width: 90,
    height: 90,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  placeholderImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    flex: 1,
  },
  completeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  formSection: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  proceedButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileSetupScreen;
