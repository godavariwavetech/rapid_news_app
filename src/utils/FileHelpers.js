import { Alert } from 'react-native';
import RNShare from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { createThumbnail } from "react-native-create-thumbnail";

export const generateVideoThumbnail = async (url) => {
  console.log('[FileHelpers/Thumbnail] >>>>>>>>createThumbnail function exists:', !!createThumbnail);
  if (!url) {
    console.log('[FileHelpers/Thumbnail] ❌ Called with null/undefined url');
    return null;
  }
  console.log('[FileHelpers/Thumbnail] Calling createThumbnail for:', url);
  try {
    const cacheName = `thumb_${Math.random().toString(36).substring(7)}`;
    const response = await createThumbnail({
      url: url,
      timeStamp: 1000, // Capture at 1 second to be safe for shorter videos
      format: 'jpeg',
      cacheName: cacheName
    });
    console.log('[FileHelpers/Thumbnail] ✅ createThumbnail response path:>>', response?.path);
    return response.path;
  } catch (err) {
    console.log('[FileHelpers/Thumbnail] ❌ createThumbnail failed at 1000ms:', err?.message, err?.code);

    // Fallback: try capturing at 0ms (first frame) in case the video is extremely short or 1s is out of bounds
    try {
      console.log('[FileHelpers/Thumbnail] Retrying createThumbnail at 0ms...');
      const fallbackResponse = await createThumbnail({
        url: url,
        timeStamp: 0,
        format: 'jpeg',
        cacheName: `thumb_fallback_${Math.random().toString(36).substring(7)}`
      });
      console.log('[FileHelpers/Thumbnail] ✅ fallback createThumbnail response path:>>>>', fallbackResponse?.path);
      return fallbackResponse.path;
    } catch (fallbackErr) {
      console.log('[FileHelpers/Thumbnail] ❌ fallback createThumbnail failed:', fallbackErr?.message, fallbackErr?.code);
      return null;
    }
  }
};

export const handleShare = async (title, newsId, base64Data, imageUrl) => {
  const appUrl = 'https://play.google.com/store/apps/details?id=com.rapidnews&pcampaignid=web_share';
  const message = `${title}\n\n${appUrl}`;

  console.log('[FileHelpers/Share] ▶ handleShare called');
  console.log('[FileHelpers/Share] base64Data present:', !!base64Data, '| base64 length:', base64Data?.length);
  console.log('[FileHelpers/Share] imageUrl:', imageUrl);

  try {
    // 1. Share the screenshot by writing Base64 to disk first. This bypasses Android IPC limits!
    if (base64Data) {
      console.log('[FileHelpers/Share] Trying: ViewShot base64 -> File -> RNShare...');
      const destPath = `${RNFetchBlob.fs.dirs.CacheDir}/share_screenshot_${Date.now()}.jpg`;
      
      try {
        await RNFetchBlob.fs.writeFile(destPath, base64Data, 'base64');
        console.log('[FileHelpers/Share] ViewShot written to:', destPath);
        
        await RNShare.open({
          title,
          message,
          url: `file://${destPath}`,
          type: 'image/jpeg',
          failOnCancel: false,
        });
        console.log('[FileHelpers/Share] ✅ ViewShot file share succeeded');
        // Clean up the temp file after share
        RNFetchBlob.fs.unlink(destPath).catch(() => {});
        return; // Stop here if successful
      } catch (err) {
        console.log('[FileHelpers/Share] ❌ ViewShot file share failed:', err?.message);
      }
    }
  } catch (err) {
    console.log('[FileHelpers/Share] ❌ base64 share failed:', err?.message);
  }

  // 2. Fallback: share the network news image if available
  if (imageUrl) {
    if (imageUrl.startsWith('http')) {
      console.log('[FileHelpers/Share] Trying: download remote image then share...');
      const destPath = `${RNFetchBlob.fs.dirs.CacheDir}/share_img_${Date.now()}.jpg`;
      try {
        await RNFetchBlob.config({ path: destPath, trusty: true }).fetch('GET', imageUrl);
        console.log('[FileHelpers/Share] Downloaded to:', destPath);
        await RNShare.open({ title, message, url: `file://${destPath}`, type: 'image/jpeg', failOnCancel: false });
        console.log('[FileHelpers/Share] ✅ remote image share succeeded');
        RNFetchBlob.fs.unlink(destPath).catch(() => { });
        return;
      } catch (err) {
        console.log('[FileHelpers/Share] ❌ remote image share failed:', err?.message);
      }
    } else {
      // It's likely a local file path (like generated thumbnail)
      const localUrl = imageUrl.startsWith('file://') ? imageUrl : `file://${imageUrl}`;
      console.log('[FileHelpers/Share] Trying: local file share:', localUrl);
      try {
        await RNShare.open({
          title,
          message,
          url: localUrl,
          type: 'image/jpeg',
          failOnCancel: false
        });
        console.log('[FileHelpers/Share] ✅ local file share succeeded');
        return;
      } catch (err) {
        console.log('[FileHelpers/Share] ❌ local file share failed:', err?.message);
      }
    }
  }

  // 3. Last resort: text only
  console.log('[FileHelpers/Share] Falling back to text-only share...');
  try { await RNShare.open({ title, message, failOnCancel: false }); } catch (_) { }
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