import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ArticleLinks({ links, onNavigate, compact = false }) {
  const navigation = useNavigation();
  const dark = useSelector(state => state.settings.isDarkMode);
  const internalId = typeof links?.internal_article_id === 'string' && /^[a-f\d]{24}$/i.test(links.internal_article_id) ? links.internal_article_id : null;
  const url = typeof links?.external_url === 'string' && /^https?:\/\//i.test(links.external_url) ? links.external_url : null;
  if (!internalId && !url) return null;
  const openInternal = () => {
    onNavigate?.();
    navigation.push('NewsDetail', { articleId: internalId, fromArticleLink: true });
  };
  const openExternal = async () => {
    try { await Linking.openURL(url); }
    catch { Alert.alert('Unable to open link', 'Please try again or check your internet connection.'); }
  };
  const button = (label, icon, action) => <TouchableOpacity accessibilityRole="link" accessibilityLabel={label} onPress={event => { event.stopPropagation?.(); action(); }} style={[styles.button, compact && styles.compact, { backgroundColor: dark ? '#26344b' : '#edf3fc' }]}><Icon name={icon} size={compact ? 15 : 18} color={dark ? '#c2d7ff' : '#244e85'} /><Text style={[styles.label, { color: dark ? '#c2d7ff' : '#244e85' }]}>{label}</Text></TouchableOpacity>;
  return <View style={styles.row}>
    {internalId && button('Related article', 'newspaper-variant-outline', openInternal)}
    {url && button('Open external link', 'open-in-new', openExternal)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 8 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  compact: { paddingHorizontal: 8, paddingVertical: 7 },
  label: { fontSize: 12, fontWeight: '600' },
});
