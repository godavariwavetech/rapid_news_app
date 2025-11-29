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
  ScrollView,
  Modal,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step3NewsDetailsScreen = ({navigation, route}) => {
  const {location} = route.params;
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [image, setImage] = useState(null);

  const categories = [
    'Political / Happenings',
    'Administration & Infra',
    'Crime / Accident',
    'Issues',
  ];

  const handleImageOptions = () => {
    setShowImageOptions(true);
  };

  const handleCamera = () => {
    setShowImageOptions(false);
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      saveToPhotos: true,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to open camera');
      } else if (response.assets && response.assets[0]) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleGallery = () => {
    setShowImageOptions(false);
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
      } else if (response.assets && response.assets[0]) {
        setImage(response.assets[0]);
      }
    });
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleNext = () => {
    if (headline && description && category) {
      navigation.navigate('NewsSubmissionStep4', {
        location,
        headline,
        description,
        category,
        image: image?.uri,
      });
    } else {
      Alert.alert('Incomplete Form', 'Please fill all required fields');
    }
  };

  const isValid = headline.trim() && description.trim() && category;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>3 / 4</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Headline Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>శీర్షికను ఇవ్వండి</Text>
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="microphone" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="format-color-text" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="keyboard" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="హెడ్ లైన్"
              placeholderTextColor="#999"
              value={headline}
              onChangeText={setHeadline}
              maxLength={75}
              multiline
            />
            <Text style={styles.charCount}>{headline.length} / 75 Chars</Text>
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>విషయాన్ని విపరించండి</Text>
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="microphone" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="format-color-text" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="keyboard" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputBox, styles.descriptionBox]}>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder="విషయం"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              maxLength={400}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {description.length} / 400 Chars
            </Text>
          </View>
        </View>

        {/* Category Selector */}
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}>
          <Text
            style={[styles.categoryText, !category && styles.placeholderText]}>
            {category || 'Select Category'}
          </Text>
          <Icon name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* Upload Image Section */}
        {!image ? (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImageOptions}
            activeOpacity={0.7}>
            <Icon name="image-outline" size={24} color="#666" />
            <Text style={styles.uploadText}>UPLOAD IMAGE</Text>
            <Text style={styles.uploadSize}>720 × 590</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imagePreviewContainer}>
            <Image source={{uri: image.uri}} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeImage}
              activeOpacity={0.8}>
              <Icon name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
            <View style={styles.imageInfo}>
              <Text style={styles.imageInfoText}>
                {(image.fileSize / 1024).toFixed(2)} KB
              </Text>
              <Text style={styles.imageInfoText}>
                {image.width} × {image.height}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isValid && styles.submitButtonActive]}
          onPress={handleNext}
          disabled={!isValid}
          activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>సబ్మిట్ →</Text>
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryOption}
                onPress={() => handleCategorySelect(cat)}>
                <View
                  style={[
                    styles.radio,
                    category === cat && styles.radioSelected,
                  ]}>
                  {category === cat && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.categoryOptionText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>

            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={handleCamera}
              activeOpacity={0.7}>
              <Icon name="camera" size={24} color="#2196F3" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={handleGallery}
              activeOpacity={0.7}>
              <Icon name="image" size={24} color="#2196F3" />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImageOptions(false)}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 4,
  },
  stepIndicator: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  inputBox: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
  },
  descriptionBox: {
    minHeight: 180,
  },
  textInput: {
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  descriptionInput: {
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    marginLeft: 12,
  },
  uploadSize: {
    fontSize: 13,
    color: '#999',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  imageInfoText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
  },
  submitButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default Step3NewsDetailsScreen;
