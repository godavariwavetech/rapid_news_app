import { Alert } from 'react-native';
import RNShare from 'react-native-share';
import RNFetchBlob from 'react-native-blob-util';
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

// Returns true only if the user actually completed a share (RNShare's
// `success` flag) — `failOnCancel: false` means opening the sheet and then
// cancelling still resolves rather than throwing, so callers that need to
// know whether a share really happened (e.g. counting it server-side) must
// check this return value rather than just whether the call didn't throw.
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

        const result = await RNShare.open({
          title,
          message,
          url: `file://${destPath}`,
          type: 'image/jpeg',
          failOnCancel: false,
        });
        console.log('[FileHelpers/Share] ✅ ViewShot file share succeeded');
        // Clean up the temp file after share
        RNFetchBlob.fs.unlink(destPath).catch(() => {});
        return !!result?.success; // Stop here if successful
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
        const result = await RNShare.open({ title, message, url: `file://${destPath}`, type: 'image/jpeg', failOnCancel: false });
        console.log('[FileHelpers/Share] ✅ remote image share succeeded');
        RNFetchBlob.fs.unlink(destPath).catch(() => { });
        return !!result?.success;
      } catch (err) {
        console.log('[FileHelpers/Share] ❌ remote image share failed:', err?.message);
      }
    } else {
      // It's likely a local file path (like generated thumbnail)
      const localUrl = imageUrl.startsWith('file://') ? imageUrl : `file://${imageUrl}`;
      console.log('[FileHelpers/Share] Trying: local file share:', localUrl);
      try {
        const result = await RNShare.open({
          title,
          message,
          url: localUrl,
          type: 'image/jpeg',
          failOnCancel: false
        });
        console.log('[FileHelpers/Share] ✅ local file share succeeded');
        return !!result?.success;
      } catch (err) {
        console.log('[FileHelpers/Share] ❌ local file share failed:', err?.message);
      }
    }
  }

  // 3. Last resort: text only
  console.log('[FileHelpers/Share] Falling back to text-only share...');
  try {
    const result = await RNShare.open({ title, message, failOnCancel: false });
    return !!result?.success;
  } catch (_) {
    return false;
  }
};

// Opens WhatsApp directly (via shareSingle) instead of the generic share
// sheet. useInternalStorage:true matters here — react-native-share's own
// FileProvider paths (share_download_paths.xml) only cover the app's
// internal cache root or the shared external Downloads folder, NOT
// getExternalCacheDir(); without this flag ShareFile writes there anyway
// and FileProvider.getUriForFile() throws, which surfaced as a misleading
// "WhatsApp Not Found" alert even though WhatsApp was installed.
export const handleWhatsAppShare = async (title, newsId, base64Data, imageUrl) => {
  const appUrl = 'https://play.google.com/store/apps/details?id=com.rapidnews&pcampaignid=web_share';
  const message = `${title}\n\n${appUrl}`;

  console.log('[FileHelpers/WhatsAppShare] ▶ handleWhatsAppShare called');

  try {
    let url;
    let downloadedPath;
    if (base64Data) {
      url = `data:image/jpeg;base64,${base64Data}`;
    } else if (imageUrl && imageUrl.startsWith('http')) {
      // shareSingle (unlike RNShare.open's own share sheet) has no remote-URL
      // fallback of its own — without a local file it silently drops the
      // image and only the text message goes through. Download it first, the
      // same way the generic handleShare() above already does.
      try {
        downloadedPath = `${RNFetchBlob.fs.dirs.CacheDir}/whatsapp_share_${Date.now()}.jpg`;
        await RNFetchBlob.config({ path: downloadedPath, trusty: true }).fetch('GET', imageUrl);
        url = `file://${downloadedPath}`;
      } catch (err) {
        console.log('[FileHelpers/WhatsAppShare] ❌ remote image download failed:', err?.message);
        downloadedPath = undefined;
      }
    } else if (imageUrl) {
      url = imageUrl.startsWith('file://') ? imageUrl : `file://${imageUrl}`;
    }

    const result = await RNShare.shareSingle({
      social: RNShare.Social.WHATSAPP,
      title,
      message,
      useInternalStorage: true,
      ...(url ? { url, type: 'image/jpeg' } : {}),
    });
    if (downloadedPath) RNFetchBlob.fs.unlink(downloadedPath).catch(() => {});
    console.log('[FileHelpers/WhatsAppShare] ✅ WhatsApp share succeeded');
    return !!result;
  } catch (err) {
    const detail = err?.message || err?.error || String(err);
    console.log('[FileHelpers/WhatsAppShare] ❌ WhatsApp share failed:', detail);
    Alert.alert('WhatsApp Share Failed', detail);
    return false;
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