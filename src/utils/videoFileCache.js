/**
 * videoFileCache.js
 * Prefetch feed videos (ads AND news) to a LOCAL file so they play instantly with
 * no network buffering.
 *
 * Why this is safe where the old `mediaPreloader` fetch-warming was not:
 * that approach warmed the HTTP cache then discarded the bytes, so ExoPlayer
 * still re-fetched on play. Here we download the actual file to disk and play
 * the `file://` path — playback is fully local, no buffering.
 *
 * API:
 *   prefetchVideo(url)   -> kicks off (or dedupes) a background download
 *   getCachedVideo(url)  -> synchronous: local file:// uri if ready, else null
 *
 * YouTube/streaming links are skipped (they don't play via react-native-video).
 */
import RNFetchBlob from 'rn-fetch-blob';
import { Platform } from 'react-native';

const { fs } = RNFetchBlob;
const CACHE_DIR = `${fs.dirs.CacheDir}/video-cache`;

const memo = new Map(); // url -> local file:// uri (download complete)
const inflight = new Map(); // url -> Promise (download in progress)

// Only direct video files are cacheable; YouTube/streaming URLs are not.
const isCacheable = (url) => !!url && !/youtube\.com|youtu\.be/i.test(url);

// Stable filename derived from the URL so the same video reuses the same file.
const fileNameFor = (url) => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  const extMatch = url.split('?')[0].match(/\.(mp4|mov|m4v|webm)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'mp4';
  return `vid_${Math.abs(hash)}.${ext}`;
};

const toUri = (absPath) => (Platform.OS === 'android' ? `file://${absPath}` : absPath);

/** Synchronous lookup used at mount time; null means "not cached yet, use remote". */
export const getCachedVideo = (url) => (isCacheable(url) ? memo.get(url) || null : null);

/** Download the video to local cache (idempotent + deduped). Returns the file uri or null. */
export const prefetchVideo = (url) => {
  if (!isCacheable(url)) return Promise.resolve(null);
  if (memo.has(url)) return Promise.resolve(memo.get(url));
  if (inflight.has(url)) return inflight.get(url);

  const absPath = `${CACHE_DIR}/${fileNameFor(url)}`;

  const task = (async () => {
    try {
      await fs.mkdir(CACHE_DIR).catch(() => {}); // ignore "already exists"
      const exists = await fs.exists(absPath);
      if (!exists) {
        await RNFetchBlob.config({ path: absPath, fileCache: true }).fetch('GET', url);
      }
      const uri = toUri(absPath);
      memo.set(url, uri);
      return uri;
    } catch (e) {
      // On any failure, leave it uncached so the player falls back to the remote URL.
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, task);
  return task;
};
