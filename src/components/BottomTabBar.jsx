import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../config/theme';

const BottomTabBar = ({activeTab, onTabPress, locationName}) => {
  const insets = useSafeAreaInsets();
  
  const tabs = [
    {
      id: 'HomeTab',
      icon: 'newspaper-variant',
      label: 'న్యూస్',
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
    <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
                size={22}
                // Active: Greyish White | Inactive: Dimmed Grey
                color={isActive ? '#E0E0E0' : '#888888'}
              />
            </View>
            <Text
              numberOfLines={1}
               allowFontScaling={false}
              style={[
                styles.tabLabel,
                { color: isActive ? '#E0E0E0' : '#888888' },
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2C2C2C', // Fixed Greyish Black Background
    elevation: 15, // Slightly higher elevation for a floating look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    fontSize: responsiveFontSize(1.7),
    // fontWeight: '700',
    fontFamily:fonts.bold,
    textAlign: 'center',
    // letterSpacing: 0.2,

  },
});

export default BottomTabBar;