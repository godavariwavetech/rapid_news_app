import { Linking } from 'react-native';
import LinkedArticleText from '../src/components/LinkedArticleText';
const mockPush = jest.fn();
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ push: mockPush }) }));
const text = 'Read this story and apply now';
const internal = { text: 'this story', start: 5, end: 15, internal_article_id: '507f1f77bcf86cd799439011' };
const external = { text: 'apply now', start: 20, end: 29, external_url: 'https://example.com/jobs' };
beforeEach(() => jest.clearAllMocks());
test('inline internal link opens only the selected article and closes modal', () => {
  const close = jest.fn();
  const ui = LinkedArticleText({ text, links: { inline: [internal, external] }, onNavigate: close });
  expect(ui.props.children[0]).toBe('Read ');
  expect(ui.props.children[1].props.children).toBe('this story');
  ui.props.children[1].props.onPress({ stopPropagation: jest.fn() });
  expect(close).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith('NewsDetail', { articleId: internal.internal_article_id, fromArticleLink: true });
});
test('external text opens through OS without internal navigation', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const ui = LinkedArticleText({ text, links: { inline: [external] } });
  await ui.props.children[1].props.onPress();
  expect(open).toHaveBeenCalledWith(external.external_url);
  expect(mockPush).not.toHaveBeenCalled();
  open.mockRestore();
});
test('stale anchors remain plain text and screenshots disable navigation', () => {
  expect(LinkedArticleText({ text: 'Edited text', links: { inline: [internal] } }).props.children).toEqual(['Edited text']);
  const ui = LinkedArticleText({ text, links: { inline: [internal] }, disabled: true });
  expect(ui.props.children[1].props.onPress).toBeUndefined();
});
