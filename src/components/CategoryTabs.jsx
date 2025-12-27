import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CATEGORIES} from '../utils/constants';

const CategoryTabs = ({selectedCategory, onSelectCategory}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {CATEGORIES.map(category => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                isSelected && styles.tabSelected,
              ]}
              onPress={() => onSelectCategory(category.id)}
              activeOpacity={0.7}>
              {category.icon && (
                <Icon
                  name={category.icon}
                  size={17}
                  color={isSelected ? '#FFFFFF' : '#DDD'}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
