import axios from 'axios';
import { Buffer } from 'buffer';
import RNFetchBlob from 'rn-fetch-blob';
import api from './api';

// Presigned upload, shared by every screen that sends a picked file to the server
// (news submission media, reporter profile photo). Was inlined in Step4ReviewScreen;
// the profile screens sent the raw file:// uri instead, which the server stored
// verbatim and no device could ever load — hence the avatar "reverting".
//
// Returns the public URL, or null on failure. Callers must treat null as "do not
// save this field" rather than saving the local uri.
export const uploadMedia = async (asset, { reporterId, mediaType = 'image' } = {}) => {
  if (!asset) return null;
  // Already a remote URL (editing case), no upload needed
  if (asset.uri?.startsWith('http')) return asset.uri;

  const isVideo = mediaType === 'video';
  const defaultExt = isVideo ? 'mp4' : 'jpg';
  const defaultMime = isVideo ? 'video/mp4' : 'image/jpeg';
  const mimeType = asset.type || defaultMime;

  try {
    // 1. Get signed URL from server
    const response = await api.post('media/upload-url', {
      filename: asset.fileName || `upload_${Date.now()}.${defaultExt}`,
      type: mimeType,
      reporterId,
    });
    const { signedUrl } = response.data.data;

    // 2. Upload — use base64 for images, RNFetchBlob file stream for videos
    if (!isVideo && asset.base64) {
      const binaryData = Uint8Array.from(Buffer.from(asset.base64, 'base64'));
      const uploadResult = await axios.put(signedUrl, binaryData, {
        headers: { 'Content-Type': mimeType, 'Content-Disposition': 'attachment' },
        transformRequest: [(data) => data],
        timeout: 120000,
      });
      if (uploadResult.status !== 200) return null;
    } else {
      // For video (or image without base64): read from local file path and upload
      const localPath = asset.uri.replace('file://', '');
      const uploadResult = await RNFetchBlob.fetch(
        'PUT',
        signedUrl,
        { 'Content-Type': mimeType, 'Content-Disposition': 'attachment' },
        RNFetchBlob.wrap(localPath),
      );
      if (uploadResult.respInfo.status !== 200) return null;
    }

    return signedUrl.split('?')[0];
  } catch (error) {
    console.error('Media Upload Error:', error);
    return null;
  }
};

export default uploadMedia;
