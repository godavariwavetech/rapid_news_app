import { Alert, NativeModules } from 'react-native';
import RNShare from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

const { ScreenshotModule } = NativeModules;

export const handleShare = async (title, newsId, imageUrl) => {
  const appUrl = 'https://play.google.com/store/apps/details?id=com.rapidnews&pcampaignid=web_share';
  const message = `${title}\n\n${appUrl}`;

  try {
    // Native PixelCopy — works on New Architecture / Fabric (RN 0.79)
    const fileUri = await ScreenshotModule.capture();
    // fileUri = "file:///data/user/0/com.rapidnews/cache/screenshot_xxx.jpg"
    // CacheDir is covered by RNShare's FileProvider → auto-converted to content://
    await RNShare.open({
      title,
      message,
      url: fileUri,
      type: 'image/jpeg',
      failOnCancel: false,
    });

    // Clean up
    RNFetchBlob.fs.unlink(fileUri.replace('file://', '')).catch(() => {});
  } catch (err) {
    console.log('[Share] screenshot failed:', err?.message);
    // Fallback: share news image if available
    if (imageUrl) {
      const destPath = `${RNFetchBlob.fs.dirs.CacheDir}/share_img_${Date.now()}.jpg`;
      try {
        await RNFetchBlob.config({ path: destPath, trusty: true }).fetch('GET', imageUrl);
        await RNShare.open({ title, message, url: `file://${destPath}`, type: 'image/jpeg', failOnCancel: false });
        RNFetchBlob.fs.unlink(destPath).catch(() => {});
        return;
      } catch (_) {}
    }
    // Last resort: text only
    try { await RNShare.open({ title, message, failOnCancel: false }); } catch (_) {}
  }
};

export const downloadImageToGallery = async (imageUrl) => {
  if (!imageUrl) return;
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
