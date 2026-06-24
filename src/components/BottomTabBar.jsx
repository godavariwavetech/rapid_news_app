import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../config/theme';

// Same wide-screen rule as Way2NewsCard: foldables/tablets (unfolded) are short/wide
// (aspect < 1.6), normal phones are ~1.8–2.2. On wide screens we shrink the tab bar so
// it eats less of the limited vertical space. Normal phones keep the original sizing.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_WIDE_SCREEN = SCREEN_HEIGHT / SCREEN_WIDTH < 1.6;

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
    <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, IS_WIDE_SCREEN ? 4 : 10) }]}>
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
                size={IS_WIDE_SCREEN ? 16 : 22}
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
    paddingTop: IS_WIDE_SCREEN ? 3 : 10,
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
    paddingVertical: IS_WIDE_SCREEN ? 1 : 4,
    paddingHorizontal: 3,
    flex: 1,
  },
  iconContainer: {
    width: IS_WIDE_SCREEN ? 22 : 28,
    height: IS_WIDE_SCREEN ? 22 : 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_WIDE_SCREEN ? 0 : 3,
  },
  tabLabel: {
    fontSize: responsiveFontSize(IS_WIDE_SCREEN ? 1.3 : 1.7),
    // fontWeight: '700',
    fontFamily:fonts.bold,
    textAlign: 'center',
    // letterSpacing: 0.2,

  },
});

export default BottomTabBar;