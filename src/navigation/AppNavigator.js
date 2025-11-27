import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSelector} from 'react-redux';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VideosScreen from '../screens/VideosScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import MagazinesScreen from '../screens/MagazinesScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LocationSelectionScreen from '../screens/LocationSelectionScreen';
import ContentListScreen from '../screens/ContentListScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import CommentsScreen from '../screens/CommentsScreen';
import ReporterScreen from '../screens/ReporterScreen';
import MobileLoginScreen from '../screens/MobileLoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ReporterDashboardScreen from '../screens/ReporterDashboardScreen';
// import ReporterDrawerNavigator from './ReporterDrawerNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {display: 'none'}, // Hide default tab bar
      }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="VideosTab" component={VideosScreen} />
      <Tab.Screen name="BookmarksTab" component={BookmarksScreen} />
      <Tab.Screen name="MagazinesTab" component={MagazinesScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const isOnboardingComplete = useSelector(
    state => state.auth.isOnboardingComplete,
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animationEnabled: true,
          cardStyleInterpolator: ({current, layouts}) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
        initialRouteName={isOnboardingComplete ? 'ReporterDashboardScreen' : 'LanguageSelection'}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          initialParams={{isOnboarding: !isOnboardingComplete}}
        />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            cardStyleInterpolator: ({current, layouts}) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        />
        <Stack.Screen
          name="LocationSelection"
          component={LocationSelectionScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ContentList"
          component={ContentListScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ContactUs"
          component={ContactUsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Comments"
          component={CommentsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Reporter"
          component={ReporterScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="MobileLogin"
          component={MobileLoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{headerShown: false}}
        />
         <Stack.Screen
          name="ReporterDashboardScreen"
          component={ReporterDashboardScreen}
          options={{headerShown: false}}
        />
        {/* <Stack.Screen
          name="ReporterApp"
          component={ReporterDrawerNavigator}
          options={{headerShown: false}}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
