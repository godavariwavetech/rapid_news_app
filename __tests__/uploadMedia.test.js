/**
 * The profile-picture bug was a screen saving the picked file:// uri straight to the
 * server. uploadMedia is the one place that turns a picked asset into a URL other
 * devices can load — so it must PUT the bytes and return the URL *without* the
 * presign query string, and must return null (never the local uri) when it can't.
 */
jest.mock('rn-fetch-blob', () => ({ fetch: jest.fn(), wrap: jest.fn(p => p) }));
jest.mock('axios', () => ({ put: jest.fn() }));
jest.mock('../src/utils/api', () => ({ post: jest.fn() }));

import axios from 'axios';
import api from '../src/utils/api';
import uploadMedia from '../src/utils/uploadMedia';

const SIGNED = 'https://api.example.com/media/f/reporter_1/123_pic.jpg?expires=9&token=abc';
const PUBLIC = 'https://api.example.com/media/f/reporter_1/123_pic.jpg';

const picked = { uri: 'file:///data/pic.jpg', base64: 'aGk=', type: 'image/jpeg' };

beforeEach(() => {
  jest.clearAllMocks();
  api.post.mockResolvedValue({ data: { data: { signedUrl: SIGNED } } });
  axios.put.mockResolvedValue({ status: 200 });
});

test('uploads picked bytes and returns the public url', async () => {
  await expect(uploadMedia(picked, { reporterId: '1' })).resolves.toBe(PUBLIC);
  expect(axios.put).toHaveBeenCalledWith(SIGNED, expect.anything(), expect.anything());
});

test('passes an existing remote url straight through', async () => {
  await expect(uploadMedia({ uri: PUBLIC })).resolves.toBe(PUBLIC);
  expect(api.post).not.toHaveBeenCalled();
});

test('returns null — never the local uri — when the upload fails', async () => {
  axios.put.mockRejectedValue(new Error('network down'));
  await expect(uploadMedia(picked, { reporterId: '1' })).resolves.toBeNull();
});

test('returns null when the presign call fails', async () => {
  api.post.mockRejectedValue(new Error('401'));
  await expect(uploadMedia(picked, { reporterId: '1' })).resolves.toBeNull();
});
