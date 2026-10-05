import React from 'react';
import { Text, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LinkedArticleText({ text = '', links, onNavigate, disabled = false, ...props }) {
  const navigation = useNavigation();
  const children = [];
  let cursor = 0;
  for (const link of [...(Array.isArray(links?.inline) ? links.inline : [])].sort((a, b) => a.start - b.start)) {
    if (!Number.isInteger(link.start) || !Number.isInteger(link.end) || link.start < cursor || link.end <= link.start || text.slice(link.start, link.end) !== link.text) continue;
    const internal = typeof link.internal_article_id === 'string' && /^[a-f\d]{24}$/i.test(link.internal_article_id) ? link.internal_article_id : null;
    const external = typeof link.external_url === 'string' && /^https?:\/\//i.test(link.external_url) ? link.external_url : null;
    if (Boolean(internal) === Boolean(external)) continue;
    children.push(text.slice(cursor, link.start));
    const open = async event => {
      event?.stopPropagation?.();
      if (internal) {
        onNavigate?.();
        navigation.push('NewsDetail', { articleId: internal, fromArticleLink: true });
      } else {
        try { await Linking.openURL(external); }
        catch { Alert.alert('Unable to open link', 'Please try again or check your internet connection.'); }
      }
    };
    children.push(<Text key={link.start} accessibilityRole={disabled ? undefined : 'link'} accessibilityLabel={link.text} onPress={disabled ? undefined : open} style={{ color: '#2785c5' }}>{link.text}</Text>);
    cursor = link.end;
  }
  children.push(text.slice(cursor));
  return <Text {...props}>{children}</Text>;
}
