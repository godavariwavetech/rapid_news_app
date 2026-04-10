import { Alert } from 'react-native';
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
  const appUrl = 'https://play.google.com/store/apps/details?id=com.rapidnews&pcampaignid=web_share';
  const message = `${title}\n\n${appUrl}`;

  if (imageUrl) {
    let destPath = null;
    try {
      // Use CacheDir — always available on all devices
      const cacheDir = RNFetchBlob.fs.dirs.CacheDir;
      destPath = `${cacheDir}/share_img_${Date.now()}.jpg`;

      const res = await RNFetchBlob.config({ path: destPath, trusty: true }).fetch('GET', imageUrl);

      // Verify file actually exists and has content
      const stat = await RNFetchBlob.fs.stat(destPath);
      if (!stat || stat.size === 0) throw new Error('Downloaded file is empty');

      await RNShare.open({
        title,
        message,
        url: `file://${destPath}`,
        type: 'image/jpeg',
        failOnCancel: false,
      });
    } catch (err) {
      console.log('Share with image failed, using text fallback:', err);
      // Fallback to text-only — never crash
      try {
        await RNShare.open({ title, message, failOnCancel: false });
      } catch (_) {}
    } finally {
      if (destPath) RNFetchBlob.fs.unlink(destPath).catch(() => {});
    }
    return;
  }

  // No image — text only
  try {
    await RNShare.open({ title, message, failOnCancel: false });
  } catch (err) {
    console.log('Share error:', err);
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