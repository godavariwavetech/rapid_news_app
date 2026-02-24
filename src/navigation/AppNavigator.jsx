import React, { useEffect, useRef } from 'react';
import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useDispatch, useSelector} from 'react-redux';
import { setupNotificationHandlers } from '../services/NotificationsService';

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
import Step1LocationScreen from '../screens/NewsSubmissionFlow/Step1LocationScreen';
import Step2SelectionScreen from '../screens/NewsSubmissionFlow/Step2SelectionScreen';
import Step3NewsDetailsScreen from '../screens/NewsSubmissionFlow/Step3NewsDetailsScreen';
import Step4ReviewScreen from '../screens/NewsSubmissionFlow/Step4ReviewScreen';
import ReporterProfileScreen from '../screens/ReporterProfileScreen';
import ReporterDrawerNavigator from './ReporterDrawerNavigator';
import FlipNewsScreen from '../screens/FlipNewsScreen';
import SplashScreen from '../screens/SplashScreen';
import ReporterStatusScreen from '../screens/ReporterStatusScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import { endActivity, startActivity } from '../redux/reducers/auth';
import { AppState } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {display: 'none'},
      }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="VideosTab" component={VideosScreen} />
      <Tab.Screen name="BookmarksTab" component={BookmarksScreen} />
      <Tab.Screen name="MagazinesTab" component={MagazinesScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const dispatch = useDispatch();
  const isOnboardingComplete = useSelector(
    state => state.auth.isOnboardingComplete,
  );
  
  const currentLocation = useSelector(state => state.location?.currentLocation);
  const appState = useRef(AppState.currentState);
  const districtIdRef = useRef(currentLocation?.district?._id);
  
  // Ref to store the session/request ID
  const sessionIdRef = useRef(null);

  const serviceHandler = async () =>{
    const response = await dispatch(startActivity({ district_id: districtIdRef.current }));
    console.log(response,">>>>>>>>>>>>>>>.responseeee>>>>>>>>");
    
    // Capture the requestId from the meta object
    if (response?.meta?.requestId) {
      sessionIdRef.current = response.meta.requestId;
    }
  }

  useEffect(() => {
    districtIdRef.current = currentLocation?.district?._id;
  }, [currentLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigationRef.isReady()) {
        setupNotificationHandlers(navigationRef);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigationRef]);

  useEffect(() => {
    serviceHandler()
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
       serviceHandler()
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // Send the captured session ID when the app goes to the background
        if (sessionIdRef.current) {
          dispatch(endActivity({ session_id: sessionIdRef.current }));
          // Optional: clear it after ending
          sessionIdRef.current = null;
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  return (
    <NavigationContainer ref={navigationRef}>
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
        initialRouteName={'SplashScreen'}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
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

        <Stack.Screen
          name="NewsSubmissionStep1"
          component={Step1LocationScreen}
        />
        <Stack.Screen
          name="NewsSubmissionStep2"
          component={Step2SelectionScreen}
        />
        <Stack.Screen
          name="NewsSubmissionStep3"
          component={Step3NewsDetailsScreen}
        />
        <Stack.Screen
          name="NewsSubmissionStep4"
          component={Step4ReviewScreen}
        />
        <Stack.Screen
          name="ReporterProfileScreen"
          component={ReporterProfileScreen}
        />

        <Stack.Screen
          name="ReporterApp"
          component={ReporterDrawerNavigator}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="FlipNews"
          component={FlipNewsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ReporterStatus"
          component={ReporterStatusScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{headerShown: false}}
        />
             <Stack.Screen
          name="NewsDetail"
          component={NewsDetailScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;