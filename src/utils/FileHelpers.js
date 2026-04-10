import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNShare from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

/**
 * Formats and shares news content with image as temp file
 * @param {string} title - The news headline
 * @param {string} newsId - Unique ID to generate the deep link
 * @param {string} imageUrl - URL of the news image
 */
export const handleShare = async (title, newsId, imageUrl) => {
  const shareUrl = `https://godavariwave.in/news/${newsId}`;
  const message = `${title}\n\n${shareUrl}`;

  try {
    const tempPath = `${RNFetchBlob.fs.dirs.CacheDir}/share_${Date.now()}.jpg`;
    const testImageUrl = imageUrl || 'https://picsum.photos/seed/news/800/450';

    await RNFetchBlob.config({ path: tempPath }).fetch('GET', testImageUrl);

    await RNShare.open({
      title,
      message,
      url: `file://${tempPath}`,
      type: 'image/jpeg',
      failOnCancel: false,
    });

    RNFetchBlob.fs.unlink(tempPath).catch(() => {});
  } catch (error) {
    console.log('Share error:', error);
    // fallback: text only
    try {
      await RNShare.open({ title, message, failOnCancel: false });
    } catch (e) {}
  }
};

/**
 * Downloads image and saves to gallery
 */
export const downloadImageToGallery = async (imageUrl) => {
  if (!imageUrl) return;

//   if (Platform.OS === 'android' && Platform.Version < 33) {
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
//     );
//     if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//       Alert.alert("Permission Denied", "Storage access is needed to save images.");
//       return;
//     }
//   }

  try {
    const { config, fs } = RNFetchBlob;
    const date = new Date();
    const filePath = `${fs.dirs.PictureDir}/News_${Math.floor(date.getTime())}.jpg`;

    const res = await config({
      fileCache: true,
      appendExt: 'jpg',
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path: filePath,
        description: 'Downloading News Image',
      },
    }).fetch('GET', imageUrl);

    await CameraRoll.save(res.data, { type: 'photo' });
    Alert.alert("Success", "Image saved to gallery!");
  } catch (error) {
    console.error("Download Error:", error);
    Alert.alert("Error", "Failed to save image.");
  }
};