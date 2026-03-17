import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker'; 
import { CommonActions } from '@react-navigation/native'; // <-- Added CommonActions import
import { updateProfile } from '../redux/reducers/auth';

// 1. DEFINED OUTSIDE TO PREVENT KEYBOARD CLOSING
const InputField = ({ label, value, onChangeText, placeholder, icon, keyboardType = "default" }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Icon name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const { reporter, loading } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: reporter?.reporter_profile?.username || '',
    fullName: reporter?.reporter_profile?.full_name || '',
    email: reporter?.email || '',
    image: reporter?.profile_image || 'https://png.pngtree.com/png-vector/20190710/ourmid/pngtree-user-vector-avatar-png-image_1541962.jpg',
  });

  // 2. IMAGE PICKER FUNCTIONALITY
  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setFormData({ ...formData, image: response.assets[0].uri });
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.fullName.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      image: formData.image,
      reporter_profile: {
        full_name: formData.fullName,
        username: formData.name,
      }
    };

    console.log(payload, ">>>>>>>>>>>>PAYLOADDDD");

    try {
      await dispatch(updateProfile(payload)).unwrap();
      Alert.alert('Success', 'Profile updated successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            // <-- Reset the navigation stack and navigate to the Main tab
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'ReporterDashboard' }],
              })
            );
          } 
        }
      ]);
    } catch (error) {
        console.log(error, ">>>>>>>>>ERROR RESPONSEE");
      Alert.alert('Update Failed', error?.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={[
        styles.header, 
        { 
          paddingTop: Math.max(insets.top, 20),
          height: Math.max(insets.top, 20) + 70 
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
          <Icon name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading}
          style={styles.primarySaveButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="check" size={20} color="#FFFFFF" style={{marginRight: 4}} />
              <Text style={styles.primarySaveText}>Save</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {formData.image ? (
                  <Image source={{ uri: formData.image }} style={styles.profileImg} />
                ) : (
                  <Icon name="account" size={80} color="#DDD" />
                )}
                <View style={styles.cameraBadge}>
                  <Icon name="camera" size={20} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Change Profile Picture</Text>
          </View>

          <View style={styles.formCard}>
            <InputField 
              label="Username"
              icon="at"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Username"
            />

            <InputField 
              label="Full Name"
              icon="account-outline"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              placeholder="Your Full Name"
            />

            <InputField 
              label="Email Address"
              icon="email-outline"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="email@example.com"
              keyboardType="email-address"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A1A' },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  primarySaveButton: { backgroundColor: '#E74C3C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 85 },
  primarySaveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  scrollContent: { paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginVertical: 25 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1A1A1A', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarHint: { marginTop: 10, fontSize: 13, color: '#999', fontWeight: '600' },
  formCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFBFB', borderRadius: 12, borderWidth: 1, borderColor: '#EDEDED', paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1A1A1A' },
});

export default EditProfileScreen;