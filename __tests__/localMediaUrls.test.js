import { normalizeLocalMediaUrls } from '../src/utils/localMediaUrls';

const localBaseUrl = 'http://192.168.0.134:7778';

test('rewrites viral image hosts when using ADB loopback forwarding', () => {
  const payload = { cards: [{ image: 'http://192.168.0.153:7778/media/f/reporter_a/viral.jpg' }] };
  for (const origin of ['http://127.0.0.1:7778', 'http://localhost:7778']) {
    expect(normalizeLocalMediaUrls(payload, origin).cards[0].image).toBe(`${origin}/media/f/reporter_a/viral.jpg`);
  }
});

test('rewrites stale private media hosts throughout nested feed payloads', () => {
  const payload = {
    items: [{
      images: ['http://192.168.0.153:7778/media/f/reporter_a/photo.jpg'],
      cards: [{ image: 'http://192.168.0.158:7778/media/f/reporter_a/viral.jpg' }],
    }],
  };

  expect(normalizeLocalMediaUrls(payload, localBaseUrl)).toEqual({
    items: [{
      images: ['http://192.168.0.134:7778/media/f/reporter_a/photo.jpg'],
      cards: [{ image: 'http://192.168.0.134:7778/media/f/reporter_a/viral.jpg' }],
    }],
  });
  expect(payload.items[0].images[0]).toBe('http://192.168.0.153:7778/media/f/reporter_a/photo.jpg');
});

test('leaves external media URLs and unrelated URLs unchanged', () => {
  const payload = {
    image: 'https://cdn.example.com/media/f/photo.jpg',
    share: 'http://192.168.0.153:7778/s/news/123',
  };

  expect(normalizeLocalMediaUrls(payload, localBaseUrl)).toEqual(payload);
});

test('does not rewrite media URLs when the app uses a production API host', () => {
  const payload = { image: 'http://192.168.0.153:7778/media/f/photo.jpg' };

  expect(normalizeLocalMediaUrls(payload, 'https://api.example.com')).toBe(payload);
});
