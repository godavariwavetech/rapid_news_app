import {CommonActions} from '@react-navigation/native';
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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';
import {createNews, updateNews} from '../../redux/reducers/news';
import uploadMedia from '../../utils/uploadMedia';
import { useTheme } from '../../context/ThemeContext';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step4ReviewScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { theme, isDarkMode } = useTheme();
  const {reporter} = useSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destructure params
  const {location, headline, description, category, image, images, video, isEditing, newsId, apiPayload} = route.params;

  const uploadToS3 = (asset, mediaType = 'image') =>
    uploadMedia(asset, { reporterId: reporter?._id, mediaType });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalPayload = { ...apiPayload };

    // Upload all images in parallel
    const allImages = images && images.length > 0 ? images : (image ? [image] : []);
    if (allImages.length > 0) {
      const uploadedUrls = await Promise.all(allImages.map(img => uploadToS3(img, 'image')));
      const validUrls = uploadedUrls.filter(Boolean);
      if (validUrls.length === 0 && allImages.some(img => img.base64)) {
        setIsSubmitting(false);
        Alert.alert('Upload Failed', 'Could not upload images. Please try again.');
        return;
      }
      finalPayload.images = validUrls;
    }

    // Upload video if present
    if (video) {
      const videoUrl = await uploadToS3(video, 'video');
      if (!videoUrl) {
        setIsSubmitting(false);
        Alert.alert('Upload Failed', 'Could not upload video. Please try again.');
        return;
      }
      finalPayload.videos = [videoUrl];
    }

    let response;
    if (isEditing && newsId) {
      response = await dispatch(updateNews({
        id: newsId,
        payload: finalPayload
      }));
    } else {
      response = await dispatch(createNews(finalPayload));
    }

    setIsSubmitting(false);

    if (response?.meta?.requestStatus === 'fulfilled') {
      Alert.alert(
        'Success', 
        `Your news has been ${isEditing ? 'updated' : 'submitted'} successfully!`, 
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{name: 'ReporterApp'}],
                }),
              );
            },
          },
        ]
      );
    } else {
      Alert.alert('Failed', 'Something went wrong', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#E8EAED' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{isEditing ? 'Review Update' : 'Review & Submit'}</Text>
        <Text style={[styles.stepIndicator, { color: theme.textSecondary }]}>3 / 3</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Location</Text>
          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
            <Icon name="map-marker" size={20} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{location}</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Category</Text>
          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
            <Icon name="folder-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{category}</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Headline</Text>
          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
            <Text style={[styles.contentText, { color: theme.text }]}>{headline}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
          <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
            <Text style={[styles.contentText, { color: theme.text }]}>{description}</Text>
          </View>
        </View>

        {/* Media preview */}
        {(images && images.length > 0) || image || video ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Media {images && images.length > 1 ? `(${images.length} images)` : ''}
            </Text>
            {video ? (
              <View style={[styles.videoPreview, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F6F8' }]}>
                <Icon name="video" size={28} color="#FF6B35" />
                <Text style={[styles.infoText, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                  {video.fileName || 'video.mp4'}
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {(images && images.length > 0 ? images : [image]).map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: img?.uri || img }}
                    style={[styles.previewImage, i > 0 && { marginLeft: 10 }]}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, {marginBottom: insets.bottom, borderTopColor: isDarkMode ? '#333' : '#E8EAED'}]}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update News' : 'Submit News'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewImage: {
    width: 200,
    height: 160,
    borderRadius: 12,
  },
  imagesRow: {
    flexDirection: 'row',
  },
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Step4ReviewScreen;
