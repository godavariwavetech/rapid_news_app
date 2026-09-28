import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../config/theme';

const INACTIVE = '#8B8B93';
const ACTIVE = '#FFFFFF';

// Ramabhadra draws both "..." and U+2026 down on the descender, so any tail
// ellipsis on an overflowing label reads as underscores ("Rajamahendra___").
// Verified on device. Cut to a clean word instead and show no ellipsis at all —
// a tab label only has to identify the place, not spell it out.
// ponytail: fixed char cap, not measured text width. Fine while labels are place
// names at one font size; measure with onTextLayout if either stops being true.
const MAX_LABEL = 12;
const truncate = s => (s.length > MAX_LABEL ? s.slice(0, MAX_LABEL).trimEnd() : s);

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
      label: truncate(locationName || 'రాజమండ్రి'),
    },
    // {
    //   id: 'TrendingTab',
    //   icon: 'fire',
    //   label: 'ట్రెండ్ల్',
    // },
    // Reload removed (Requirement 22) - it duplicated the News tab's own
    // reset-and-refetch, and pull-to-refresh (FlipNewsScreen's swipe-down
    // gesture) already covers a manual refresh without a dedicated tab.
    // Create (Requirement 21) - was previously reachable only by opening the
    // Categories bottom-sheet and finding it in that sidebar. Same
    // navigation target as that menu item (CategoriesModal's
    // handleReporterNavigation) - HomeScreen.jsx's handleTabPress just
    // navigates straight there instead of opening a modal first.
    {
      id: 'CreateTab',
      icon: 'plus-circle',
      label: 'క్రియేట్',
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
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Icon
                name={tab.icon}
                size={IS_WIDE_SCREEN ? 16 : 22}
                color={isActive ? ACTIVE : INACTIVE}
              />
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
               allowFontScaling={false}
              style={[
                styles.tabLabel,
                { color: isActive ? ACTIVE : INACTIVE },
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: IS_WIDE_SCREEN ? 4 : 10,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Same ink as the header — the two bars frame the feed as one system.
    backgroundColor: 'rgba(11,11,13,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_WIDE_SCREEN ? 1 : 4,
    paddingHorizontal: 3,
    flex: 1,
  },
  iconContainer: {
    width: IS_WIDE_SCREEN ? 34 : 46,
    height: IS_WIDE_SCREEN ? 22 : 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_WIDE_SCREEN ? 1 : 4,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
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