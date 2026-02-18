import { Share, Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

/**
 * Formats and shares news content
 * @param {string} title - The news headline
 * @param {string} body - The short description or body
 * @param {string} newsId - Unique ID to generate the link
 */
export const handleShare = async (title, body, newsId) => {
  try {
    // Construct the formatted message
    const shareLink = `https://yourapp.com/news/${newsId}`;
    const message = `${title}\n\n${body}\n\nRead more at: ${shareLink}`;

    const result = await Share.share({
      title: title,
      message: message,
      url: shareLink, // iOS specific for link preview
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    console.error("Sharing Error:", error.message);
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