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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../redux/reducers/news';
import { Buffer } from 'buffer'; // Required for S3 binary conversion
import api from '../../utils/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step3NewsDetailsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {currentLocation} = useSelector(state => state.location);
  const {categories} = useSelector(state => state.news);
  const insets = useSafeAreaInsets();
  const {reporter} = useSelector(state=>state.auth)

  console.log(reporter,">>>>>>>>>>>>>reporter");

  // Params
  const existingNews = route.params?.existingNews;
  const locationData = route.params?.locationData; 
  const reachData = route.params?.reachData;

  // Form State
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false); // Track S3 upload status

  // Transliteration State
  const [headlineTranslitEnabled, setHeadlineTranslitEnabled] = useState(false);
  const [descriptionTranslitEnabled, setDescriptionTranslitEnabled] = useState(false);

  const previousHeadlineRef = useRef('');
  const previousDescriptionRef = useRef('');

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Pre-fill Data logic
  useEffect(() => {
    if (existingNews) {
      const content = existingNews.content;
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
      
      if (imgUrl) setImage({ uri: imgUrl });

      if (existingNews.category_id && categories.length > 0) {
        const found = categories.find(c => c._id === existingNews.category_id);
        if (found) setSelectedCategoryObj(found);
      }
    }
  }, [existingNews, categories]);

  const uploadToS3 = async (imageAsset) => {
    // console.log(imageAsset);
    // return
    if (!imageAsset || !imageAsset.base64) return imageAsset?.uri || null;

    try {
      // 1. Get Pre-signed URL
      const response = await api.post('media/upload-url', {
        filename: imageAsset.fileName || `news_${Date.now()}.jpg`,
        type: imageAsset.type || 'image/jpeg',
        reporterId: reporter?._id,
      });

      console.log(response, '>>>>>>>>>RESPOSNSNSNSNSSNSN');

      const { signedUrl } = response.data.data;

      const binaryData = Uint8Array.from(Buffer.from(imageAsset.base64, 'base64'));

      const uploadResult = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': imageAsset.type || 'image/jpeg' },
        body: binaryData,
      });

      console.log(uploadResult,">>>>>>>>>>>>>>>UPLOAD RESPONSEEE");

      if (uploadResult.status === 200) {
        return signedUrl.split('?')[0];
      }
      return null;
    } catch (error) {
      console.log(error,">>>>>>>>>>>>>>>>>>>>>>>>");
      console.error('S3 Upload Error:', error);
      return null;
    }
  };

  // --- Transliteration Logic ---
  const transliterate = async (text) => {
    if (!text || text.trim() === '') return text;
    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=te-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
        return data[1][0][1][0]; 
      }
      return text;
    } catch (error) {
      return text;
    }
  };

  const handleHeadlineChange = async (text) => {
    if (!headlineTranslitEnabled) {
      setHeadline(text);
      previousHeadlineRef.current = text;
      return;
    }
    const hasSpace = text.endsWith(' ') && !previousHeadlineRef.current.endsWith(' ');
    if (hasSpace && text.trim() !== '') {
      const words = text.trim().split(' ');
      const lastWord = words[words.length - 1];
      const translated = await transliterate(lastWord);
      words[words.length - 1] = translated;
      const newText = words.join(' ') + ' ';
      setHeadline(newText);
      previousHeadlineRef.current = newText;
    } else {
      setHeadline(text);
      previousHeadlineRef.current = text;
    }
  };

  const handleDescriptionChange = async (text) => {
    if (!descriptionTranslitEnabled) {
      setDescription(text);
      previousDescriptionRef.current = text;
      return;
    }
    const hasSpace = text.endsWith(' ') && !previousDescriptionRef.current.endsWith(' ');
    if (hasSpace && text.trim() !== '') {
      const words = text.trim().split(' ');
      const lastWord = words[words.length - 1];
      const translated = await transliterate(lastWord);
      words[words.length - 1] = translated;
      const newText = words.join(' ') + ' ';
      setDescription(newText);
      previousDescriptionRef.current = newText;
    } else {
      setDescription(text);
      previousDescriptionRef.current = text;
    }
  };

  const handleCategorySelect = (item) => {
    setSelectedCategoryObj(item);
    setShowCategoryModal(false);
  };

  const handleCamera = () => {
    setShowImageOptions(false);
    launchCamera({ mediaType: 'photo', quality: 0.7, includeBase64: true }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const handleGallery = () => {
    setShowImageOptions(false);
    launchImageLibrary({ mediaType: 'photo', quality: 0.7, includeBase64: true }, response => {
      if (response.assets && response.assets[0]) setImage(response.assets[0]);
    });
  };

  const handleNext = async () => {
    if (headline && description && selectedCategoryObj) {
      setUploading(true);
      
      // Execute S3 Upload procedure
      const finalImageUrl = await uploadToS3(image);

      console.log(finalImageUrl,">>>>>>>>>>>>>>>>>>>>FINALIMAE URL");

      if (image && !finalImageUrl) {
        setUploading(false);
        Alert.alert('Upload Failed', 'Could not upload image to S3.');
        return;
      }

      const villageId = locationData?.village?._id || existingNews?.village_id || currentLocation?.village?._id;
      const districtId = locationData?.district?._id || existingNews?.district_id || currentLocation?.district?._id;
      const stateId = locationData?.state?._id || existingNews?.state_id || currentLocation?.state?._id;

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
        "images": finalImageUrl ? [finalImageUrl] : [], // Sends S3 Link
        "videos": []
      };

      setUploading(false);
      navigation.navigate('NewsSubmissionStep4', {
        headline,
        description,
        category: selectedCategoryObj.name.en,
        image: image?.uri, 
        apiPayload: payload,
        location: locationData ? `${locationData.village?.name?.en}, ${locationData.district?.name?.en}` : "Current Location",
        isEditing: !!existingNews,
        newsId: existingNews?._id
      });
    } else {
      Alert.alert('Incomplete Form', 'Please fill all required fields');
    }
  };

  const isValid = headline.trim() && description.trim() && selectedCategoryObj && !uploading;

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
                onValueChange={setHeadlineTranslitEnabled}
                trackColor={{false: '#E0E0E0', true: '#4CAF50'}}
                thumbColor={'#FFFFFF'}
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
                thumbColor={'#FFFFFF'}
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
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 1000</Text>
          </View>
        </View>

        {/* Category */}
        <Text style={styles.inputLabel}>Category</Text>
        <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategoryModal(true)}>
          <Text style={[styles.categoryText, !selectedCategoryObj && styles.placeholderText]}>
            {selectedCategoryObj ? selectedCategoryObj.name.en : 'Select Category'}
          </Text>
          <Icon name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* Image */}
        <Text style={styles.inputLabel}>Cover Image</Text>
        {!image ? (
          <TouchableOpacity style={styles.uploadButton} onPress={() => setShowImageOptions(true)}>
            <Icon name="image-outline" size={24} color="#666" />
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imagePreviewContainer}>
            <Image source={{uri: image.uri}} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
              <Icon name="close-circle" size={28} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, {marginBottom: insets.bottom}]}>
        <TouchableOpacity
          style={[styles.submitButton, isValid && styles.submitButtonActive]}
          onPress={handleNext}
          disabled={!isValid}>
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingNews ? 'Update Preview' : 'Next Step →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
             <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.categoryOption} onPress={() => handleCategorySelect(item)}>
                  <Text style={styles.categoryOptionText}>{item.name.en}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Options Modal */}
      <Modal visible={showImageOptions} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.imageOptionButton} onPress={handleCamera}>
              <Icon name="camera" size={24} color="#2196F3" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageOptionButton} onPress={handleGallery}>
              <Icon name="image" size={24} color="#9C27B0" />
              <Text style={styles.imageOptionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

// ... Styles remain mostly the same ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: STATUS_BAR_HEIGHT + 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8EAED' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  stepIndicator: { fontSize: 16, color: '#999', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  inputContainer: { marginBottom: 20 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginLeft: 4 },
  translitToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  translitLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  inputBox: { backgroundColor: '#F5F6F8', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  textInput: { fontSize: 16, color: '#333', padding: 0 },
  descriptionBox: { minHeight: 150 },
  descriptionInput: { height: 120 },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 8 },
  categorySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F6F8', borderRadius: 12, padding: 16, marginBottom: 20 },
  categoryText: { fontSize: 16, color: '#333' },
  placeholderText: { color: '#999' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6F8', borderRadius: 12, padding: 30, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E0E0E0', gap: 10 },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#666' },
  imagePreviewContainer: { position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  imagePreview: { width: '100%', height: 220, resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 10, right: 10 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E8EAED' },
  submitButton: { backgroundColor: '#E0E0E0', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitButtonActive: { backgroundColor: '#2196F3' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '50%' },
  categoryOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  categoryOptionText: { fontSize: 16, color: '#333' },
  imageOptionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  imageOptionText: { fontSize: 16, fontWeight: '600' },
});

export default Step3NewsDetailsScreen;