import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomTabBar = ({activeTab, onTabPress}) => {
  const tabs = [
    {
      id: 'HomeTab',
      icon: 'newspaper-variant',
      label: 'స్వార్న్',
    },
    {
      id: 'CategoriesTab',
      icon: 'view-grid',
      label: 'కేటగిరీలు',
    },
    {
      id: 'LocationTab',
      icon: 'map-marker',
      label: 'రాజమండ్రి',
    },
    {
      id: 'TrendingTab',
      icon: 'fire',
      label: 'ట్రెండ్ల్',
    },
    {
      id: 'ReloadTab',
      icon: 'reload',
      label: 'రిలోడ్',
    },
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}>
            <View style={styles.iconContainer}>
              <Icon
                name={tab.icon}
                size={24}
                color={isActive ? '#FFFFFF' : '#BBBBBB'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {color: isActive ? '#FFFFFF' : '#BBBBBB'},
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 10,
    paddingBottom: 16,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default BottomTabBar;
