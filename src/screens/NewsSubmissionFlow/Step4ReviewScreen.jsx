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
import { Buffer } from 'buffer';
import api from '../../utils/api';
import axios from 'axios';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

const Step4ReviewScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {reporter} = useSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destructure new params: isEditing and newsId
  const {location, headline, description, category, image, isEditing, newsId, apiPayload} = route.params;

  const uploadToS3 = async (imageAsset) => {
    if (!imageAsset || !imageAsset.base64) return imageAsset?.uri || null;

    try {
      // 1. Get Pre-signed URL
      const response = await api.post('media/upload-url', {
        filename: imageAsset.fileName || `news_${Date.now()}.jpg`,
        type: imageAsset.type || 'image/jpeg',
        reporterId: reporter?._id,
      });

      const { signedUrl } = response.data.data;
      const binaryData = Uint8Array.from(Buffer.from(imageAsset.base64, 'base64'));
      const uploadResult = await axios.put(signedUrl, binaryData, {
          headers: { 
            'Content-Type': imageAsset.type || 'image/jpeg',
            'Content-Disposition': 'attachment'
          },
          
          transformRequest: [(data) => data], 
          timeout: 120000,
        });

      if (uploadResult.status === 200) {
        return signedUrl.split('?')[0];
      }
      return null;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalPayload = { ...apiPayload };

    if (image && image.base64) {
      const s3Url = await uploadToS3(image);
      if (!s3Url) {
        setIsSubmitting(false);
        Alert.alert('Upload Failed', 'Could not upload image to S3. Please try again.');
        return;
      }
      finalPayload.images = [s3Url];
    }

    let response;
    // Check if we are in Edit Mode
    if (isEditing && newsId) {
      // Dispatch Update Action
      response = await dispatch(updateNews({
        id: newsId,
        payload: finalPayload
      }));

      console.log(response,">>>>>>>>>>>>>>RESPONSEEEEEE");
    } else {
      // Dispatch Create Action
      response = await dispatch(createNews(finalPayload));
    }

    setIsSubmitting(false);

    if (response?.payload?.news_id) {
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
      Alert.alert('Failed', 'Something went wrong', [
        {
          text: 'OK',
        },
      ]);
    }
  };

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
        {/* Dynamic Header Title */}
        <Text style={styles.headerTitle}>{isEditing ? 'Review Update' : 'Review & Submit'}</Text>
        <Text style={styles.stepIndicator}>3 / 3</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.infoCard}>
            <Icon name="map-marker" size={20} color="#666" />
            <Text style={styles.infoText}>{location}</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.infoCard}>
            <Icon name="folder-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{category}</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Headline</Text>
          <View style={styles.infoCard}>
            <Text style={styles.contentText}>{headline}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={styles.infoCard}>
            <Text style={styles.contentText}>{description}</Text>
          </View>
        </View>

        {/* Image */}
        {image && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Image</Text>
            <Image source={{uri: image.uri || image}} style={styles.previewImage} />
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, {marginBottom: insets.bottom}]}>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stepIndicator: {
    fontSize: 16,
    color: '#999',
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
    color: '#999',
    marginBottom: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
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

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingTop: STATUS_BAR_HEIGHT + 10,
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E8EAED',
//   },
//   backButton: {
//     padding: 4,
//     marginRight: 12,
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//   },
//   stepIndicator: {
//     fontSize: 16,
//     color: '#999',
//   },
//   content: {
//     flex: 1,
//   },
//   section: {
//     padding: 20,
//   },
//   sectionLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#999',
//     marginBottom: 10,
//   },
//   infoCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F5F6F8',
//     padding: 16,
//     borderRadius: 12,
//     gap: 12,
//   },
//   infoText: {
//     fontSize: 15,
//     color: '#333',
//     fontWeight: '600',
//   },
//   contentText: {
//     fontSize: 15,
//     color: '#333',
//     lineHeight: 22,
//   },
//   previewImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   footer: {
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#E8EAED',
//   },
//   submitButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   submitButtonText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
// });

// export default Step4ReviewScreen;