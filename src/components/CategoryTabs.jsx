import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import {useSelector} from 'react-redux';
import {CATEGORIES as FALLBACK_CATEGORIES} from '../utils/constants';

const CategoryTabs = ({selectedCategory, onSelectCategory}) => {
  const {categories} = useSelector(state => state.news);
  
  // Combine "All" with fetched categories if needed, 
  // or just use categories if "All" is included in the backend response.
  // Assuming we might need to prepend "All" if not present.
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {displayCategories.map(category => {
          const categoryId = category._id || category.id;
          const isSelected = selectedCategory === categoryId;
          const categoryName = category.name?.te || category.name?.en || category.name;
          const categoryIcon = category.icon;

          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.tab,
                isSelected && styles.tabSelected,
              ]}
              onPress={() => onSelectCategory(categoryId)}
              activeOpacity={0.7}>
              {categoryIcon ? (
                categoryIcon.startsWith('http') ? (
                  <FastImage
                    source={{ uri: categoryIcon }}
                    style={[styles.icon, { width: 18, height: 18 }]}
                    resizeMode={FastImage.resizeMode.contain}
                    tintColor={isSelected ? '#FFFFFF' : '#DDD'}
                  />
                ) : (
                  <Icon
                    name={categoryIcon}
                    size={17}
                    color={isSelected ? '#FFFFFF' : '#DDD'}
                    style={styles.icon}
                  />
                )
              ) : null}
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                ]}>
                {categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 30% opacity
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 9,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // 15% white opacity
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  icon: {
    marginRight: 5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DDD',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
});

export default CategoryTabs;
