import React, {useState, useRef} from 'react';
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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step3NewsDetailsScreen = ({navigation, route}) => {
  // const {location} = route.params;
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [image, setImage] = useState(null);
  
  // Transliteration states
  const [headlineTranslitEnabled, setHeadlineTranslitEnabled] = useState(false);
  const [descriptionTranslitEnabled, setDescriptionTranslitEnabled] = useState(false);
  
  // Store previous text to detect space key
  const previousHeadlineRef = useRef('');
  const previousDescriptionRef = useRef('');

  const categories = [
    'Political / Happenings',
    'Administration & Infra',
    'Crime / Accident',
    'Issues',
  ];

  // Transliteration function using Google Input Tools API
  const transliterate = async (text) => {
    if (!text || text.trim() === '') return text;

    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=te-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      // Check if we got valid results
      if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1].length > 0) {
        return data[1][0][1][0]; // Return first suggestion
      }
      
      return text;
    } catch (error) {
      console.error('Transliteration error:', error);
      return text;
    }
  };

  // Handle headline change with transliteration
  const handleHeadlineChange = async (text) => {
    if (!headlineTranslitEnabled) {
      setHeadline(text);
      previousHeadlineRef.current = text;
      return;
    }

    // Check if space was just added
    const hadSpace = previousHeadlineRef.current.endsWith(' ');
    const hasSpace = text.endsWith(' ');
    
    if (hasSpace && !hadSpace && text.trim() !== '') {
      // Split by spaces
      const words = text.trim().split(' ');
      const lastWord = words[words.length - 1];
      
      if (lastWord && lastWord.length > 0) {
        // Transliterate the last word
        const transliteratedWord = await transliterate(lastWord);
        
        // Replace last word with transliterated version
        words[words.length - 1] = transliteratedWord;
        const newText = words.join(' ') + ' ';
        
        setHeadline(newText);
        previousHeadlineRef.current = newText;
        return;
      }
    }
    
    setHeadline(text);
    previousHeadlineRef.current = text;
  };

  // Handle description change with transliteration
  const handleDescriptionChange = async (text) => {
    if (!descriptionTranslitEnabled) {
      setDescription(text);
      previousDescriptionRef.current = text;
      return;
    }

    const hadSpace = previousDescriptionRef.current.endsWith(' ');
    const hasSpace = text.endsWith(' ');
    
    if (hasSpace && !hadSpace && text.trim() !== '') {
      const words = text.trim().split(' ');
      const lastWord = words[words.length - 1];
      
      if (lastWord && lastWord.length > 0) {
        const transliteratedWord = await transliterate(lastWord);
        words[words.length - 1] = transliteratedWord;
        const newText = words.join(' ') + ' ';
        
        setDescription(newText);
        previousDescriptionRef.current = newText;
        return;
      }
    }
    
    setDescription(text);
    previousDescriptionRef.current = text;
  };

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
        // location,
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
            <View style={styles.translitToggle}>
              <Switch
                value={headlineTranslitEnabled}
                onValueChange={(value) => {
                  setHeadlineTranslitEnabled(value);
                  if (!value) {
                    // Reset when turned off
                    previousHeadlineRef.current = headline;
                  }
                }}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
                thumbColor={headlineTranslitEnabled ? '#FFFFFF' : '#F4F4F4'}
                ios_backgroundColor="#E0E0E0"
                style={styles.switch}
              />
              <Text style={styles.translitLabel}>తె</Text>
            </View>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder={headlineTranslitEnabled ? "Type in English and press space" : "హెడ్ లైన్"}
              placeholderTextColor="#999"
              value={headline}
              onChangeText={handleHeadlineChange}
              maxLength={75}
              multiline
            />
            <Text style={styles.charCount}>{headline.length} / 75 Chars</Text>
          </View>
          {headlineTranslitEnabled && (
            <Text style={styles.hintText}>💡 Type in English and press SPACE to convert to Telugu</Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>విషయాన్ని విపరించండి</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={descriptionTranslitEnabled}
                onValueChange={(value) => {
                  setDescriptionTranslitEnabled(value);
                  if (!value) {
                    previousDescriptionRef.current = description;
                  }
                }}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
                thumbColor={descriptionTranslitEnabled ? '#FFFFFF' : '#F4F4F4'}
                ios_backgroundColor="#E0E0E0"
                style={styles.switch}
              />
              <Text style={styles.translitLabel}>తె</Text>
            </View>
          </View>
          <View style={[styles.inputBox, styles.descriptionBox]}>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder={descriptionTranslitEnabled ? "Type in English and press space" : "విషయం"}
              placeholderTextColor="#999"
              value={description}
              onChangeText={handleDescriptionChange}
              maxLength={400}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {description.length} / 400 Chars
            </Text>
          </View>
          {descriptionTranslitEnabled && (
            <Text style={styles.hintText}>💡 Type in English and press SPACE to convert to Telugu</Text>
          )}
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
  translitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switch: {
    transform: [{scaleX: 0.8}, {scaleY: 0.8}],
  },
  translitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  hintText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 6,
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
