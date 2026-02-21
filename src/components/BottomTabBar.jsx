import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomTabBar = ({activeTab, onTabPress, locationName}) => {
  const insets = useSafeAreaInsets()
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
      label: locationName || 'రాజమండ్రి',
    },
    // {
    //   id: 'TrendingTab',
    //   icon: 'fire',
    //   label: 'ట్రెండ్ల్',
    // },
    {
      id: 'ReloadTab',
      icon: 'reload',
      label: 'రిలోడ్',
    },
  ];

  return (
    <View style={[styles.bottomTabBar,{paddingBottom:insets.bottom}]}>
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
                size={20}
                color={isActive ? '#FFFFFF' : '#BBBBBB'}
              />
            </View>
            <Text
            numberOfLines={1}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 6,
    paddingBottom: 12,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 3,
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: responsiveFontSize(1.1),
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default BottomTabBar;
