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
// Use the ID from the news object
      const shareUrl = `https://godavariwave.in/news/${newsId}`;
      // const title = news.content?.title || news.title;
      // const body = news.content?.short || news.description || '';

      await Share.share({
        message: `${title}\n\n${body}\n\nRead more here: ${shareUrl}`,
        url: shareUrl, // For iOS
        title: title   // For Android title
      });
  
    
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