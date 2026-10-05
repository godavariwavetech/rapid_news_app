import { Alert, Linking } from 'react-native';
import ArticleLinks from '../src/components/ArticleLinks';

const mockPush = jest.fn();
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ push: mockPush }) }));
jest.mock('react-redux', () => ({ useSelector: callback => callback({ settings: { isDarkMode: false } }) }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

beforeEach(() => { jest.clearAllMocks(); });
const event = () => ({ stopPropagation: jest.fn() });

test('old articles without navigation links render no extra UI', () => {
  expect(ArticleLinks({ links: undefined })).toBeNull();
  expect(ArticleLinks({ links: { internal_article_id: null, external_url: '' } })).toBeNull();
  expect(ArticleLinks({ links: { external_url: 'javascript:alert(1)' } })).toBeNull();
});

test('internal link closes a modal then opens a fresh article screen', () => {
  const onNavigate = jest.fn();
  const id = '507f1f77bcf86cd799439011';
  const ui = ArticleLinks({ links: { internal_article_id: id }, onNavigate });
  const press = event();
  ui.props.children[0].props.onPress(press);
  expect(press.stopPropagation).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith('NewsDetail', { articleId: id, fromArticleLink: true });
  expect(onNavigate.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0]);
});

test('external link opens through the OS without changing article navigation', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const url = 'https://www.youtube.com/watch?v=abcdefghijk';
  const ui = ArticleLinks({ links: { external_url: url } });
  ui.props.children[1].props.onPress(event());
  expect(open).toHaveBeenCalledWith(url);
  expect(mockPush).not.toHaveBeenCalled();
  open.mockRestore();
});

test('failed external navigation shows a clear message', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Unavailable'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = ArticleLinks({ links: { external_url: 'https://example.com' } });
  ui.props.children[1].props.onPress(event());
  await Promise.resolve();
  expect(alert).toHaveBeenCalledWith('Unable to open link', expect.any(String));
  open.mockRestore();
  alert.mockRestore();
});
