/**
 * The video cache used to grow forever — every video the user scrolled past stayed
 * on disk, which is most of the app's runaway cache size. These assert the two
 * things that keep it bounded AND correct: it evicts oldest-first down to the cap,
 * and an evicted file stops being handed to the player as a local path.
 */
// Built inside the factory: imports are hoisted above const declarations, so the
// factory runs before any outer variable exists.
jest.mock('react-native-blob-util', () => {
  const fetch = jest.fn();
  return {
    fs: {
      dirs: { CacheDir: '/cache' },
      mkdir: jest.fn(),
      exists: jest.fn(),
      unlink: jest.fn(),
      lstat: jest.fn(),
    },
    config: jest.fn(() => ({ fetch })),
    __fetch: fetch,
  };
});

import RNFetchBlob from 'react-native-blob-util';

const fs = RNFetchBlob.fs;
const fetchMock = RNFetchBlob.__fetch;
import { prefetchVideo, getCachedVideo, clearVideoCache } from '../src/utils/videoFileCache';

const MB = 1024 * 1024;
// The module derives its own filenames; read them back off the download call.
const pathFor = (url) => {
  const call = RNFetchBlob.config.mock.calls.find(([cfg]) => cfg.path && cfg.path.includes('video-cache'));
  return call ? call[0].path : null;
};

const primeMocks = () => {
  fs.mkdir.mockResolvedValue(undefined);
  fs.unlink.mockResolvedValue(undefined);
  fs.exists.mockResolvedValue(false);
  fs.lstat.mockResolvedValue([]);
  fetchMock.mockResolvedValue({});
};

beforeEach(async () => {
  jest.clearAllMocks();
  primeMocks();
  // The module memoises across tests; clear it, then forget that call.
  await clearVideoCache();
  jest.clearAllMocks();
  primeMocks();
});

test('YouTube links are never downloaded', async () => {
  await expect(prefetchVideo('https://youtu.be/abc123')).resolves.toBeNull();
  expect(RNFetchBlob.config).not.toHaveBeenCalled();
});

test('a cached video is reported as a local path', async () => {
  const url = 'https://media.example.com/a.mp4';
  const uri = await prefetchVideo(url);
  expect(uri).toBeTruthy();
  expect(getCachedVideo(url)).toBe(uri);
  expect(fs.unlink).not.toHaveBeenCalled(); // under the cap: nothing evicted
});

test('evicts oldest-first once over the cap, and forgets what it deleted', async () => {
  const oldUrl = 'https://media.example.com/old.mp4';
  await prefetchVideo(oldUrl);
  const oldPath = pathFor(oldUrl);
  jest.clearAllMocks();

  // Next download pushes the directory to 160MB against a 150MB cap.
  const newUrl = 'https://media.example.com/new.mp4';
  fs.lstat.mockResolvedValue([
    { path: oldPath, size: 80 * MB, lastModified: 1000 },
    { path: '/cache/video-cache/vid_new.mp4', size: 80 * MB, lastModified: 2000 },
  ]);

  await prefetchVideo(newUrl);

  // Only the older file goes.
  expect(fs.unlink).toHaveBeenCalledTimes(1);
  expect(fs.unlink).toHaveBeenCalledWith(oldPath);
  // ...and it must not still be advertised as playable, or the player gets a
  // file:// path to a file that no longer exists.
  expect(getCachedVideo(oldUrl)).toBeNull();
  expect(getCachedVideo(newUrl)).toBeTruthy();
});

test('stays put when already under the cap', async () => {
  await prefetchVideo('https://media.example.com/small.mp4');
  jest.clearAllMocks();
  fs.lstat.mockResolvedValue([
    { path: '/cache/video-cache/vid_1.mp4', size: 5 * MB, lastModified: 1 },
    { path: '/cache/video-cache/vid_2.mp4', size: 5 * MB, lastModified: 2 },
  ]);

  await prefetchVideo('https://media.example.com/another.mp4');
  expect(fs.unlink).not.toHaveBeenCalled();
});

test('an already-downloaded file is not re-fetched', async () => {
  fs.exists.mockResolvedValue(true);
  const uri = await prefetchVideo('https://media.example.com/present.mp4');
  expect(uri).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});
