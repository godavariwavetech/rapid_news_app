import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {lightTheme, darkTheme} from '../utils/colors';
import {removeBookmark} from '../redux/reducers/bookmarks';
import {getTranslation} from '../utils/translations';

const BookmarksScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.settings.isDarkMode);
  const language = useSelector(state => state.settings.language);
  const bookmarks = useSelector(state => state.bookmarks.items);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = key => getTranslation(language, key);

  const handleRemoveBookmark = newsId => {
    dispatch(removeBookmark(newsId));
  };

  const handleNewsPress = news => {
    navigation.navigate('NewsDetail', {news});
  };

  const renderBookmarkItem = ({item}) => (
    <TouchableOpacity
      style={[styles.bookmarkCard, {backgroundColor: theme.cardBackground}]}
      onPress={() => handleNewsPress(item)}
      activeOpacity={0.9}>
      <Image source={{uri: item.image}} style={styles.image} />
      <View style={styles.content}>
        <View
          style={[styles.categoryBadge, {backgroundColor: theme.secondary}]}>
          <Text style={styles.categoryText}>
            {item.category.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.title, {color: theme.text}]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[styles.description, {color: theme.textSecondary}]}
          numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            <Icon name="map-marker" size={14} color={theme.textSecondary} />
            <Text style={[styles.location, {color: theme.textSecondary}]}>
              {item.location}
            </Text>
            <Text style={[styles.time, {color: theme.textSecondary}]}>
              • {item.timeAgo}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveBookmark(item.id)}
            style={styles.deleteButton}>
            <Icon name="bookmark-remove" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (bookmarks.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: theme.text}]}>
            {t('bookmarks')}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="bookmark-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
            {t('noBookmarks')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          {t('bookmarks')}
        </Text>
        <Text style={[styles.count, {color: theme.textSecondary}]}>
          {bookmarks.length} {t('saved')}
        </Text>
      </View>

      <FlatList
        data={bookmarks}
        renderItem={renderBookmarkItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  bookmarkCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 120,
    height: 150,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 11,
    fontWeight: '500',
  },
  time: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default BookmarksScreen;
