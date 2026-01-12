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

  // Edit Mode Props
  const existingNews = route.params?.existingNews;
  const passedLocation = route.params?.location;

  // Form State
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [image, setImage] = useState(null);

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [headlineTranslitEnabled, setHeadlineTranslitEnabled] = useState(false);
  const [descriptionTranslitEnabled, setDescriptionTranslitEnabled] = useState(false);

  const previousHeadlineRef = useRef('');
  const previousDescriptionRef = useRef('');

  console.log(existingNews,">>>>>>>>>>>>>>>>>>>>existingNews");

  // 1. Fetch Categories
  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // 2. Pre-fill Data
  useEffect(() => {
    if (existingNews) {
      const content = existingNews.content;
      const title = content?.en?.title || content?.te?.title || content?.title || '';
      const body = content?.en?.body || content?.te?.body || content?.body || '';
      const imgUrl = existingNews.images?.[0] || null;

      setHeadline(title);
      setDescription(body);
      if (imgUrl) setImage({ uri: imgUrl });

      if (existingNews.category_id && categories.length > 0) {
        const found = categories.find(c => c._id === existingNews.category_id);
        if (found) setSelectedCategoryObj(found);
      }
    }
  }, [existingNews, categories]);

  // Handlers
  const handleCategorySelect = (item) => {
    setSelectedCategoryObj(item);
    setShowCategoryModal(false);
  };

  const handleImageOptions = () => setShowImageOptions(true);

  const handleCamera = () => {
    setShowImageOptions(false);
    launchCamera({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const handleGallery = () => {
    setShowImageOptions(false);
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const removeImage = () => setImage(null);

  const handleNext = () => {
    if (headline && description && selectedCategoryObj) {
      
      // Use || null to ensure keys are sent even if values are undefined
      const payload = {
        "village_id": currentLocation?.village?._id || existingNews?.village_id || null,
        "district_id": currentLocation?.district?._id || existingNews?.district_id || null,
        "state_id": currentLocation?.state?._id || existingNews?.state_id || null,
        "category_id": selectedCategoryObj._id,
        "content": {
          "en": {
            "title": headline,
            "short": description.substring(0, 50),
            "body": description
          }
        },
        "images": image ? [image.uri] : [],
        "videos": []
      };

      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

      navigation.navigate('NewsSubmissionStep4', {
        headline,
        description,
        category: selectedCategoryObj.name.en,
        image: image?.uri,
        apiPayload: payload,
        location: passedLocation || "Current Location",
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
        <Text style={styles.stepIndicator}>3 / 4</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Headline */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Enter Headline</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={headlineTranslitEnabled}
                onValueChange={setHeadlineTranslitEnabled}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              />
              <Text style={styles.translitLabel}>EN/TE</Text>
            </View>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Headline"
              placeholderTextColor="#999"
              value={headline}
              onChangeText={setHeadline}
              maxLength={75}
              multiline
            />
            <Text style={styles.charCount}>{headline.length} / 75 Chars</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={descriptionTranslitEnabled}
                onValueChange={setDescriptionTranslitEnabled}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
              />
              <Text style={styles.translitLabel}>EN/TE</Text>
            </View>
          </View>
          <View style={[styles.inputBox, styles.descriptionBox]}>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder="Enter details here..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              maxLength={400}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 400 Chars</Text>
          </View>
        </View>

        {/* Category */}
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
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Icon name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
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
            {existingNews ? 'Update Preview →' : 'Submit →'}
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
            <Text style={styles.modalTitle}>Select Category</Text>
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
                <Text style={{textAlign:'center', color:'#999'}}>No categories available</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Modal */}
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
  translitLabel: {
    fontSize: 12,
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
    maxHeight: '80%',
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