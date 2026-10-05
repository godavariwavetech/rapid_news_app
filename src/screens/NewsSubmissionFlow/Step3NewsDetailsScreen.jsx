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
  Dimensions,
  PixelRatio,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../redux/reducers/news';
import { useTheme } from '../../context/ThemeContext';
import CameraComponent from '../../components/CameraComponent';
import { getArticleImageDimensions } from '../../utils/articleImageDimensions';

const MAX_IMAGES = 5;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTICLE_IMAGE_DIMENSIONS = getArticleImageDimensions(SCREEN_WIDTH, SCREEN_HEIGHT);

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step3NewsDetailsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {currentLocation} = useSelector(state => state.location);
  const {categories} = useSelector(state => state.news);
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const {reporter} = useSelector(state=>state.auth)

  // Params
  const existingNews = route.params?.existingNews;
  const locationData = route.params?.locationData; 
  const reachData = route.params?.reachData;

  // Form State
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [images, setImages] = useState([]); // array of image assets
  const [video, setVideo] = useState(null); // single video asset

  // Transliteration State
  const [headlineTranslitEnabled, setHeadlineTranslitEnabled] = useState(false);
  const [descriptionTranslitEnabled, setDescriptionTranslitEnabled] = useState(false);

  const previousHeadlineRef = useRef('');
  const previousDescriptionRef = useRef('');

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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
      setNewsSource(existingNews.news_source || '');
      setHeadlineTranslitEnabled(isTeTitle);
      setDescriptionTranslitEnabled(isTeBody);
      setTags(Array.isArray(existingNews.tags) ? existingNews.tags.join(', ') : '');
      
      if (imgUrl) setImages([{ uri: imgUrl }]);

      const categoryId = existingNews.category?._id || existingNews.category_id;
      
      if (categoryId && categories.length > 0) {
        const found = categories.find(c => c._id === categoryId);
        if (found) setSelectedCategoryObj(found);
      }
    }
  }, [existingNews, categories]);

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
    setShowMediaOptions(false);
    setShowCamera(true);
  };

  const cropImage = async (path) => {
    const cropped = await ImageCropPicker.openCropper({
      path: path.startsWith('file://') || path.startsWith('content://')
        ? path
        : `file://${path}`,
      mediaType: 'photo',
      width: Math.round(ARTICLE_IMAGE_DIMENSIONS.width * PixelRatio.get()),
      height: Math.round(ARTICLE_IMAGE_DIMENSIONS.height * PixelRatio.get()),
      freeStyleCropEnabled: false,
      hideBottomControls: true,
      compressImageQuality: 0.85,
      cropperToolbarTitle: 'Adjust photo',
      cropperToolbarColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      cropperToolbarWidgetColor: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    });

    return {
      uri: cropped.path.startsWith('file://') ? cropped.path : `file://${cropped.path}`,
      type: cropped.mime || 'image/jpeg',
      fileName: cropped.filename || `cropped_${Date.now()}.jpg`,
      width: cropped.width,
      height: cropped.height,
    };
  };

  const handleCapture = async (photo) => {
    setShowCamera(false);
    try {
      const croppedPhoto = await cropImage(photo.uri);
      setImages(prev => [...prev, croppedPhoto].slice(0, MAX_IMAGES));
    } catch (error) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        console.error('Image crop failed:', error);
        Alert.alert('Crop Failed', 'Could not crop this photo. Please try again.');
      }
    }
  };

  const handleGallery = async () => {
    setShowMediaOptions(false);
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    let pickedImages;
    try {
      pickedImages = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        multiple: true,
        maxFiles: remainingSlots,
      });
    } catch (error) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        console.error('Image picker failed:', error);
        Alert.alert('Unable to Select Images', 'Could not open the photo library. Please try again.');
      }
      return;
    }

    const selectedImages = (Array.isArray(pickedImages) ? pickedImages : [pickedImages])
      .slice(0, remainingSlots);
    const pickedImageCount = Array.isArray(pickedImages) ? pickedImages.length : 1;
    const croppedImages = [];

    for (const image of selectedImages) {
      try {
        croppedImages.push(await cropImage(image.path));
      } catch (error) {
        if (error?.code !== 'E_PICKER_CANCELLED') {
          console.error('Image crop failed:', error);
          Alert.alert('Crop Failed', 'Could not crop this photo. Please try again.');
        }
        break;
      }
    }

    if (croppedImages.length > 0) {
      setImages(prev => [...prev, ...croppedImages].slice(0, MAX_IMAGES));
    }
    if (pickedImageCount > remainingSlots) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_IMAGES} images.`);
    }
  };

  const handleVideoGallery = () => {
    setShowMediaOptions(false);
    launchImageLibrary({ mediaType: 'video', videoQuality: 'medium' }, response => {
      if (response.assets && response.assets[0]) setVideo(response.assets[0]);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (headline && description && selectedCategoryObj && (images.length > 0 || video)) {
      const districtId = locationData?.district?._id || existingNews?.district_id || currentLocation?.district?._id;
      const stateId = locationData?.state?._id || existingNews?.state_id || currentLocation?.state?._id;
      // Step1 now supports picking several villages/mandals for the same
      // post. Fall back to the single legacy village (old callers / editing
      // an existing article) so this still works when only one is known.
      const villages = locationData?.villages?.length
        ? locationData.villages
        : (locationData?.village || existingNews?.village_id || currentLocation?.village
            ? [locationData?.village || { _id: existingNews?.village_id || currentLocation?.village?._id }]
            : []);

      // The backend's news create/update endpoint takes a `locations` array —
      // one {state_id, district_id, village_id} entry per targeted village,
      // sharing the same (locked) state/district. Matches what the admin
      // dashboard's AddNews.jsx already sends for multi-location posts.
      const locations = villages
        .map(v => ({ state_id: stateId || null, district_id: districtId || null, village_id: v?._id || null }))
        .filter(loc => loc.village_id);

      const payload = {
        locations,
        "category_id": selectedCategoryObj._id,
        "content": {
          "te": { 
            "title": headline,
            "short": description.substring(0, 50),
            "body": description
          }
        },
        "images": images.filter(img => img.uri && !img.base64).map(img => img.uri),
        "videos": video?.uri ? [video.uri] : [],
        // Keep existing source when older reporter-list responses do not include
        // it, while allowing a new value or an explicit clear when present.
        ...((newsSource.trim() || existingNews?.news_source !== undefined)
          ? { news_source: newsSource.trim() }
          : {}),
        // Raw comma-separated string; the backend's normalizeTags splits and
        // cleans it. Omitted when blank so an edit can't wipe existing tags.
        ...(tags.trim() && { tags: tags.trim() }),
      };

      navigation.navigate('NewsSubmissionStep4', {
        headline,
        description,
        category: selectedCategoryObj.name.en,
        image: images[0] || null,
        images,
        video,
        newsSource: newsSource.trim(),
        apiPayload: payload,
        location: locationData
          ? `${villages.map(v => v?.name?.en).filter(Boolean).join(', ')}, ${locationData.district?.name?.en}`
          : "Current Location",
        isEditing: !!existingNews,
        newsId: existingNews?._id
      });
    } else {
      Alert.alert('Incomplete Form', 'Please fill all required fields and add at least one image or video.');
    }
  };

  const isValid = headline.trim() && description.trim() && selectedCategoryObj && (images.length > 0 || video);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>News Details</Text>
        <Text style={[styles.stepIndicator, { color: theme.textSecondary }]}>2 / 3</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Headline */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Headline *</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={headlineTranslitEnabled}
                onValueChange={setHeadlineTranslitEnabled}
                trackColor={{false: isDarkMode ? '#333' : '#E0E0E0', true: '#4CAF50'}}
                thumbColor={'#FFFFFF'}
              />
              <Text style={[styles.translitLabel, { color: theme.textSecondary }]}>TE</Text>
            </View>
          </View>
          <View style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder={headlineTranslitEnabled ? "Type in English & press space..." : "Enter headline..."}
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={headline}
              onChangeText={handleHeadlineChange}
              maxLength={75}
              multiline
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{headline.length} / 75</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description *</Text>
            <View style={styles.translitToggle}>
              <Switch
                value={descriptionTranslitEnabled}
                onValueChange={setDescriptionTranslitEnabled}
                trackColor={{false: isDarkMode ? '#333' : '#E0E0E0', true: '#4CAF50'}}
                thumbColor={'#FFFFFF'}
              />
              <Text style={[styles.translitLabel, { color: theme.textSecondary }]}>TE</Text>
            </View>
          </View>
          <View style={[styles.inputBox, styles.descriptionBox, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <TextInput
              style={[styles.textInput, styles.descriptionInput, { color: theme.text }]}
              placeholder={descriptionTranslitEnabled ? "Type in English & press space..." : "Enter full details here..."}
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={description}
              onChangeText={handleDescriptionChange}
              maxLength={450}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{description.length} / 450</Text>
          </View>
        </View>

        {/* Tags — optional keywords, searchable alongside headline and body */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tags</Text>
          </View>
          <View style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="cyclone, amaravati (comma separated)"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={tags}
              onChangeText={setTags}
              maxLength={200}
            />
          </View>
        </View>

        {/* Category */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 8 }]}>Category *</Text>
        <TouchableOpacity 
          style={[
            styles.categorySelector, 
            { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' },
            !!existingNews && { opacity: 0.6 } // Add opacity to make it look disabled
          ]} 
          // Only show modal if NOT editing
          onPress={() => {
            if (!existingNews) {
              setShowCategoryModal(true);
            } else {
              Alert.alert("Category Locked", "You cannot change the category of an existing article.");
            }
          }}
          activeOpacity={!!existingNews ? 1 : 0.7} // Prevent click animation if disabled
        >
          <Text style={[styles.categoryText, { color: theme.text }, !selectedCategoryObj && styles.placeholderText]}>
            {selectedCategoryObj ? selectedCategoryObj.name.en : 'Select Category'}
          </Text>
          {/* Hide the chevron icon if editing, or change it to a lock */}
          {!existingNews ? (
            <Icon name="chevron-down" size={24} color={theme.textSecondary} />
          ) : (
            <Icon name="lock" size={20} color={theme.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Media Upload */}
        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Media *</Text>
        <Text style={[styles.mediaHint, { color: theme.textSecondary }]}>
          Add up to {MAX_IMAGES} images OR one video. Adjust each image crop after selecting.
        </Text>

        {/* Images preview grid */}
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageThumbnailContainer}>
                <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                <TouchableOpacity style={styles.removeThumbButton} onPress={() => removeImage(index)}>
                  <Icon name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && !video && (
              <TouchableOpacity
                style={[styles.addMoreButton, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#E0E0E0' }]}
                onPress={() => setShowMediaOptions(true)}>
                <Icon name="plus" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Video preview */}
        {video && (
          <View style={[styles.videoPreview, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
            <Icon name="video" size={32} color={theme.accentBlue} />
            <Text style={[styles.videoName, { color: theme.text }]} numberOfLines={1}>
              {video.fileName || 'video.mp4'}
            </Text>
            <TouchableOpacity onPress={() => setVideo(null)}>
              <Icon name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        {/* Upload button — shown when nothing selected yet */}
        {images.length === 0 && !video && (
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#E0E0E0' }]}
            onPress={() => setShowMediaOptions(true)}>
            <Icon name="image-plus" size={24} color={theme.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.textSecondary }]}>Add Images or Video</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, styles.newsSourceLabel, { color: theme.textSecondary }]}>
            News Source (Optional)
          </Text>
          <View style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8', borderColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Source name or URL"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={newsSource}
              onChangeText={setNewsSource}
              maxLength={300}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <Text style={[styles.newsSourceHint, { color: theme.textSecondary }]}>
            Shared with editors in the dashboard only.
          </Text>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.footer, {marginBottom: insets.bottom, borderTopColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' }, isValid && [styles.submitButtonActive, { backgroundColor: theme.primary }]]}
          onPress={handleNext}
          disabled={!isValid}>
          <Text style={[styles.submitButtonText, { color: isValid ? '#FFF' : theme.textSecondary }]}>
            {existingNews ? 'Update Preview' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
             <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({item}) => (
                <TouchableOpacity style={[styles.categoryOption, { borderBottomColor: isDarkMode ? '#333' : '#F5F5F5' }]} onPress={() => handleCategorySelect(item)}>
                  <Text style={[styles.categoryOptionText, { color: theme.text }]}>{item.name.en}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Media Options Modal */}
      <Modal visible={showMediaOptions} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMediaOptions(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            {/* Camera — only if no video selected and under image limit */}
            {!video && images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.imageOptionButton} onPress={handleCamera}>
                <Icon name="camera" size={24} color={theme.accentBlue} />
                <Text style={[styles.imageOptionText, { color: theme.text }]}>Take Photo</Text>
              </TouchableOpacity>
            )}
            {/* Gallery images — only if no video selected */}
            {!video && images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.imageOptionButton} onPress={handleGallery}>
                <Icon name="image-multiple" size={24} color={theme.secondary} />
                <Text style={[styles.imageOptionText, { color: theme.text }]}>
                  Choose Images {images.length > 0 ? `(${images.length}/${MAX_IMAGES})` : ''}
                </Text>
              </TouchableOpacity>
            )}
            {/* Video — only if no images selected */}
            {images.length === 0 && (
              <TouchableOpacity style={styles.imageOptionButton} onPress={handleVideoGallery}>
                <Icon name="video" size={24} color="#FF6B35" />
                <Text style={[styles.imageOptionText, { color: theme.text }]}>Choose Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <CameraComponent
        isVisible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: STATUS_BAR_HEIGHT + 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  stepIndicator: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  inputContainer: { marginBottom: 20 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  newsSourceLabel: { marginBottom: 8 },
  newsSourceHint: { fontSize: 12, marginTop: 6, marginLeft: 4 },
  translitToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  translitLabel: { fontSize: 12, fontWeight: '600' },
  inputBox: { borderRadius: 12, padding: 16, borderWidth: 1 },
  textInput: { fontSize: 16, padding: 0 },
  descriptionBox: { minHeight: 150 },
  descriptionInput: { height: 120 },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 8 },
  categorySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 20 },
  categoryText: { fontSize: 16 },
  placeholderText: { color: '#999' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 30, borderStyle: 'dashed', borderWidth: 1, gap: 10, marginBottom: 20 },
  uploadText: { fontSize: 16, fontWeight: '600' },
  mediaHint: { fontSize: 12, marginBottom: 10, marginLeft: 4 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  imageThumbnailContainer: { position: 'relative', width: 90, height: 90 },
  imageThumbnail: { width: 90, height: 90, borderRadius: 10, resizeMode: 'cover' },
  removeThumbButton: { position: 'absolute', top: -6, right: -6 },
  addMoreButton: { width: 90, height: 90, borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  videoPreview: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 12, marginBottom: 16 },
  videoName: { flex: 1, fontSize: 14 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitButtonActive: { },
  submitButtonText: { fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '50%' },
  categoryOption: { paddingVertical: 16, borderBottomWidth: 1 },
  categoryOptionText: { fontSize: 16 },
  imageOptionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  imageOptionText: { fontSize: 16, fontWeight: '600' },
});

export default Step3NewsDetailsScreen;
