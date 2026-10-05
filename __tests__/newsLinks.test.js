import {Linking} from 'react-native';
import {getNewsShareUrl, normalizeNewsLink} from '../src/utils/newsLinks';
import {newsLinking} from '../src/navigation/newsLinking';

const articleUrl = 'https://www.rapidnewsnetwork.in/app/article/abc123';

afterEach(() => jest.restoreAllMocks());

test('shares an article URL instead of a store URL and handles missing IDs', () => {
  expect(getNewsShareUrl('abc123')).toBe(articleUrl);
  expect(getNewsShareUrl(undefined)).toBe('https://www.rapidnewsnetwork.in/app');
  expect(getNewsShareUrl('')).not.toContain('undefined');
});

test.each([
  articleUrl,
  `${articleUrl}/?utm_source=whatsapp#story`,
  'https://rapidnewsnetwork.in/app/article/abc123',
  'rapidnews://news/abc123',
  'https://godavariwave.in/news/abc123?utm_source=share',
])('normalizes supported article links: %s', url => {
  expect(normalizeNewsLink(url)).toBe(articleUrl);
});

test.each([
  null,
  'https://www.rapidnewsnetwork.in.evil.test/app/article/abc123',
  'https://www.rapidnewsnetwork.in/app/article/abc123/other',
  'https://www.rapidnewsnetwork.in/app/article/%ZZ',
  'https://www.rapidnewsnetwork.in/app/article/%2Fother',
  'https://play.google.com/store/apps/details?id=com.rapidnews',
])('ignores invalid or unrelated links: %s', url => {
  expect(normalizeNewsLink(url)).toBeNull();
});

test('cold launch delivers the article link and keeps Home behind detail', async () => {
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('rapidnews://news/abc123');
  expect(await newsLinking.getInitialURL()).toBe(articleUrl);
  expect(newsLinking.config.initialRouteName).toBe('Main');
  expect(newsLinking.config.screens.NewsDetail).toBe('app/article/:articleId');
});

test('warm launch delivers each new article and cleans up its subscription', () => {
  let receive;
  const remove = jest.fn();
  jest.spyOn(Linking, 'addEventListener').mockImplementation((event, handler) => {
    expect(event).toBe('url');
    receive = handler;
    return {remove};
  });
  const listener = jest.fn();
  const unsubscribe = newsLinking.subscribe(listener);
  receive({url: articleUrl});
  receive({url: 'rapidnews://news/second'});
  receive({url: 'https://unrelated.test/'});
  expect(listener.mock.calls).toEqual([
    [articleUrl],
    ['https://www.rapidnewsnetwork.in/app/article/second'],
  ]);
  unsubscribe();
  expect(remove).toHaveBeenCalledTimes(1);
});
