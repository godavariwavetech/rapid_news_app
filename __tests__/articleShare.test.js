jest.mock('react-native-share', () => ({
  Social: {WHATSAPP: 'whatsapp'}, shareSingle: jest.fn(), open: jest.fn(),
}));
jest.mock('react-native-blob-util', () => ({}));
jest.mock('@react-native-camera-roll/camera-roll', () => ({CameraRoll: {}}));
jest.mock('react-native-create-thumbnail', () => ({createThumbnail: jest.fn()}));

import RNShare from 'react-native-share';
import {handleArticleLinkShare} from '../src/utils/FileHelpers';

beforeEach(() => jest.clearAllMocks());

test('WhatsApp receives one article URL and attribution without an image attachment', async () => {
  RNShare.shareSingle.mockResolvedValue({success: true});
  expect(await handleArticleLinkShare('Article title', 'abc123', 'whatsapp')).toBe(true);
  expect(RNShare.shareSingle).toHaveBeenCalledWith({
    social: 'whatsapp', title: 'Article title',
    message: 'Article title\n\nhttps://www.rapidnewsnetwork.in/app/article/abc123\n\nShared via Rapid News',
  });
  const options = RNShare.shareSingle.mock.calls[0][0];
  expect(options.url).toBeUndefined();
  expect(options.type).toBeUndefined();
});

test('cancelled general sharing does not count as a completed share', async () => {
  RNShare.open.mockResolvedValue({success: false});
  expect(await handleArticleLinkShare('Title', 'abc123')).toBe(false);
  expect(RNShare.open.mock.calls[0][0].failOnCancel).toBe(false);
});

test('failed WhatsApp shares do not count as completed shares', async () => {
  RNShare.shareSingle.mockResolvedValue({success: false});
  expect(await handleArticleLinkShare('Title', 'abc123', 'whatsapp')).toBe(false);
});
