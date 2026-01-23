import React, {useState, useRef, useEffect} from 'react';
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
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../redux/reducers/news';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step3NewsDetailsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {currentLocation} = useSelector(state => state.location);
  const {categories} = useSelector(state => state.news);
  const insets = useSafeAreaInsets();

  // Params
  const existingNews = route.params?.existingNews;
  const locationData = route.params?.locationData; 
  const reachData = route.params?.reachData;

  // Form State
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [image, setImage] = useState(null);

  // Transliteration State
  const [headlineTranslitEnabled, setHeadlineTranslitEnabled] = useState(false);
  const [descriptionTranslitEnabled, setDescriptionTranslitEnabled] = useState(false);

  // Refs for tracking previous text (to detect space)
  const previousHeadlineRef = useRef('');
  const previousDescriptionRef = useRef('');

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Pre-fill Data
  useEffect(() => {
    if (existingNews) {
      const content = existingNews.content;
      // Auto-enable Telugu mode if content appears to be Telugu
      const isTeTitle = !content?.en?.title && !!content?.te?.title;
      const isTeBody = !content?.en?.body && !!content?.te?.body;

      const title = content?.te?.title || content?.en?.title || content?.title || '';
      const body = content?.te?.body || content?.en?.body || content?.body || '';
      const imgUrl = existingNews.images?.[0] || null;

      setHeadline(title);
      previousHeadlineRef.current = title;
      
      setDescription(body);
      previousDescriptionRef.current = body;

      setHeadlineTranslitEnabled(isTeTitle);
      setDescriptionTranslitEnabled(isTeBody);
      
      if (imgUrl) setImage({ uri: imgUrl }); // Note: existing images might not have base64 locally unless re-fetched differently

      if (existingNews.category_id && categories.length > 0) {
        const found = categories.find(c => c._id === existingNews.category_id);
        if (found) setSelectedCategoryObj(found);
      }
    }
  }, [existingNews, categories]);

  // --- Transliteration Logic (Google Input Tools) ---
  const transliterate = async (text) => {
    if (!text || text.trim() === '') return text;

    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=te-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1].length > 0) {
        return data[1][0][1][0]; 
      }
      return text;
    } catch (error) {
      console.error('Transliteration error:', error);
      return text;
    }
  };

  const handleHeadlineChange = async (text) => {
    if (!headlineTranslitEnabled) {
      setHeadline(text);
      previousHeadlineRef.current = text;
      return;
    }

    const hadSpace = previousHeadlineRef.current.endsWith(' ');
    const hasSpace = text.endsWith(' ');
    
    if (hasSpace && !hadSpace && text.trim() !== '') {
      const words = text.trim().split(' ');
      const lastWord = words[words.length - 1];
      
      if (lastWord && lastWord.length > 0) {
        const transliteratedWord = await transliterate(lastWord);
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
  // --------------------------------------------------

  const handleCategorySelect = (item) => {
    setSelectedCategoryObj(item);
    setShowCategoryModal(false);
  };

  const handleImageOptions = () => setShowImageOptions(true);

  const handleCamera = () => {
    setShowImageOptions(false);
    launchCamera({ 
      mediaType: 'photo', 
      quality: 0.8,
      includeBase64: true // ADDED: Request Base64
    }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const handleGallery = () => {
    setShowImageOptions(false);
    launchImageLibrary({ 
      mediaType: 'photo', 
      quality: 0.8,
      includeBase64: true // ADDED: Request Base64
    }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const removeImage = () => setImage(null);

  const handleNext = () => {
    if (headline && description && selectedCategoryObj) {
      
      const villageId = locationData?.village?._id || existingNews?.village_id || currentLocation?.village?._id;
      const districtId = locationData?.district?._id || existingNews?.district_id || currentLocation?.district?._id;
      const stateId = locationData?.state?._id || existingNews?.state_id || currentLocation?.state?._id;

      const langKey = headlineTranslitEnabled ? 'te' : 'en';

      // Prepare Image Payload
      let imagesPayload = [];
      if (image) {
        if (image.base64) {
          // If a new image was picked, use the base64 string
          const mimeType = image.type || 'image/jpeg';
          imagesPayload = [`data:${mimeType};base64,${image.base64}`];
        } else if (image.uri && existingNews) {
          // If editing and keeping existing image (no base64 available), use the URL
          imagesPayload = [image.uri];
        }
      }

      const payload = {
        "village_id": villageId || null,
        "district_id": districtId || null,
        "state_id": stateId || null,
        "category_id": selectedCategoryObj._id,
        "content": {
          "te": { 
            "title": headline,
            "short": description.substring(0, 50),
            "body": description
          }
        },
        "images": imagesPayload, // UPDATED: Sends Base64 array
        "videos": []
      };

      const locationDisplay = locationData 
        ? `${locationData.village?.name?.en}, ${locationData.district?.name?.en}`
        : "Current Location";

      navigation.navigate('NewsSubmissionStep4', {
        headline,
        description,
        category: selectedCategoryObj.name.en,
        image: image?.uri, // Pass URI for local preview in next screen
        apiPayload: payload,
        location: locationDisplay,
        isEditing: !!existingNews,
        newsId: existingNews?._id
      });
    } else {
      Alert.alert('Incomplete Form', 'Please fill all required fields');
    }
  };

  const isValid = headline.trim() && description.trim() && selectedCategoryObj;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>News Details</Text>
        <Text style={styles.stepIndicator}>3 / 4</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Headline */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Headline</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={headlineTranslitEnabled}
                onValueChange={(val) => {
                  setHeadlineTranslitEnabled(val);
                  if(!val) previousHeadlineRef.current = headline;
                }}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
                thumbColor={'#FFFFFF'}
                style={styles.switch}
              />
              <Text style={styles.translitLabel}>TE</Text>
            </View>
          </View>
          
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder={headlineTranslitEnabled ? "Type in English & press space..." : "Enter headline..."}
              placeholderTextColor="#999"
              value={headline}
              onChangeText={handleHeadlineChange}
              maxLength={100}
              multiline
            />
            <Text style={styles.charCount}>{headline.length} / 100</Text>
          </View>
          {headlineTranslitEnabled && (
            <Text style={styles.hintText}>💡 Type in English and press SPACE to convert to Telugu</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={descriptionTranslitEnabled}
                onValueChange={(val) => {
                  setDescriptionTranslitEnabled(val);
                  if(!val) previousDescriptionRef.current = description;
                }}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
                thumbColor={'#FFFFFF'}
                style={styles.switch}
              />
              <Text style={styles.translitLabel}>TE</Text>
            </View>
          </View>

          <View style={[styles.inputBox, styles.descriptionBox]}>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder={descriptionTranslitEnabled ? "Type in English & press space..." : "Enter full details here..."}
              placeholderTextColor="#999"
              value={description}
              onChangeText={handleDescriptionChange}
              maxLength={1000}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 1000</Text>
          </View>
        </View>

        {/* Category */}
        <Text style={styles.inputLabel}>Category</Text>
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}>
          <Text style={[styles.categoryText, !selectedCategoryObj && styles.placeholderText]}>
            {selectedCategoryObj ? selectedCategoryObj.name.en : 'Select Category'}
          </Text>
          <Icon name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* Image */}
        <Text style={styles.inputLabel}>Cover Image</Text>
        {!image ? (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImageOptions}
            activeOpacity={0.7}>
            <Icon name="image-outline" size={24} color="#666" />
            <Text style={styles.uploadText}>Upload Image</Text>
            <Text style={styles.uploadSize}>JPG, PNG</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imagePreviewContainer}>
            <Image source={{uri: image.uri}} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Icon name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
            
            {(image.fileSize || image.width) && (
              <View style={styles.imageInfo}>
                {image.fileSize && (
                  <Text style={styles.imageInfoText}>
                    {(image.fileSize / 1024).toFixed(2)} KB
                  </Text>
                )}
                {image.width && image.height && (
                  <Text style={styles.imageInfoText}>
                    {image.width} × {image.height}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, {marginBottom: insets.bottom}]}>
        <TouchableOpacity
          style={[styles.submitButton, isValid && styles.submitButtonActive]}
          onPress={handleNext}
          disabled={!isValid}
          activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>
            {existingNews ? 'Update Preview' : 'Next Step →'}
          </Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => handleCategorySelect(item)}>
                  <View
                    style={[
                      styles.radio,
                      selectedCategoryObj?._id === item._id && styles.radioSelected,
                    ]}>
                    {selectedCategoryObj?._id === item._id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.categoryOptionText}>{item.name.en}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No categories available</Text>
              }
            />
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
            <Text style={styles.modalTitle}>Add Photo</Text>
            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={handleCamera}
              activeOpacity={0.7}>
              <View style={[styles.iconCircle, {backgroundColor: '#E3F2FD'}]}>
                <Icon name="camera" size={24} color="#2196F3" />
              </View>
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={handleGallery}
              activeOpacity={0.7}>
              <View style={[styles.iconCircle, {backgroundColor: '#F3E5F5'}]}>
                <Icon name="image" size={24} color="#9C27B0" />
              </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backButton: {
    padding: 4,
  },
  stepIndicator: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  translitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switch: {
    transform: [{scaleX: 0.8}, {scaleY: 0.8}],
  },
  translitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  inputBox: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  descriptionBox: {
    minHeight: 150,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    padding: 0,
    textAlignVertical: 'top',
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
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 6,
    marginLeft: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: 40,
    gap: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  uploadSize: {
    fontSize: 13,
    color: '#999',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 2,
    zIndex: 10,
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
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    backgroundColor: '#FFF',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonActive: {
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontWeight: '500',
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default Step3NewsDetailsScreen;