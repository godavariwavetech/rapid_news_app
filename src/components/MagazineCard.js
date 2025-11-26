import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';

const MagazineCard = ({magazine, onPress}) => {
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: theme.cardBackground}]}
      onPress={onPress}
      activeOpacity={0.9}>
      <Image source={{uri: magazine.cover}} style={styles.cover} />
      <View style={styles.content}>
        <Text style={[styles.title, {color: theme.text}]} numberOfLines={2}>
          {magazine.title}
        </Text>
        <View style={styles.metaInfo}>
          <Icon name="file-document" size={14} color={theme.textSecondary} />
          <Text style={[styles.articles, {color: theme.textSecondary}]}>
            {magazine.articles} articles
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cover: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  articles: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MagazineCard;
