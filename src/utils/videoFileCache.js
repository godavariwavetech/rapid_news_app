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
 *   clearVideoCache()    -> delete every cached file (Settings > Clear cache)
 *
 * YouTube/streaming links are skipped (they don't play via react-native-video).
 *
 * SIZE: this used to grow without limit — every video the user ever scrolled past
 * stayed on disk forever, which is most of the app's runaway cache. It is now an
 * LRU capped at MAX_CACHE_BYTES, trimmed after each completed download (i.e. off
 * the first-paint path, never during startup).
 */
import RNFetchBlob from 'react-native-blob-util';
import { Platform } from 'react-native';

const { fs } = RNFetchBlob;
const CACHE_DIR = `${fs.dirs.CacheDir}/video-cache`;

// Tuning knob. Videos are megabytes each, so this is the dominant term in the
// app's cache footprint — raise it for smoother swiping, lower it for less disk.
// Must comfortably fit FlipNewsScreen's prefetch window (6 videos ahead, fetched
// in parallel) plus a couple behind for replay-on-return, or trimCache() below
// evicts oldest-first — which tends to be the CURRENT video, since it's kicked
// off first in that loop and so is usually also the first to finish downloading.
// At the old 40MB cap that meant: downloaded, then deleted before it was ever
// watched, silently forcing a slow network re-stream anyway.
const MAX_CACHE_BYTES = 150 * 1024 * 1024;

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

// A deleted file must also leave `memo`, or getCachedVideo hands the player a
// file:// path that no longer exists and playback fails outright.
const forget = (absPath) => {
  const uri = toUri(absPath);
  for (const [url, cached] of memo) {
    if (cached === uri) memo.delete(url);
  }
};

/**
 * Delete oldest-first until the directory is under the cap. One `lstat` lists the
 * whole directory with sizes, so this is a single syscall plus the unlinks.
 * `lastModified` is 0 on some platforms/versions — then the eviction order is
 * arbitrary, but the cap still holds, which is the part that matters.
 */
const trimCache = async () => {
  try {
    const entries = await fs.lstat(CACHE_DIR);
    if (!Array.isArray(entries)) return;

    let total = entries.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
    if (total <= MAX_CACHE_BYTES) return;

    entries.sort((a, b) => (Number(a.lastModified) || 0) - (Number(b.lastModified) || 0));
    for (const f of entries) {
      if (total <= MAX_CACHE_BYTES) break;
      await fs.unlink(f.path).catch(() => {});
      total -= Number(f.size) || 0;
      forget(f.path);
    }
  } catch (e) {
    // A missing dir or a racing unlink is not worth surfacing — playback still
    // works, it just falls back to streaming.
  }
};

/** Wipe every cached video. Used by Settings > Clear cache. */
export const clearVideoCache = async () => {
  try {
    await fs.unlink(CACHE_DIR).catch(() => {});
  } finally {
    memo.clear();
  }
};

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
      // After the write, not before: keeps the just-downloaded file safe from its
      // own eviction pass and keeps the I/O off the render path.
      if (!exists) await trimCache();
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
