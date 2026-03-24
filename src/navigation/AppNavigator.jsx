import React, { useEffect, useRef } from 'react';
import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useDispatch, useSelector} from 'react-redux';
import { setupNotificationHandlers } from '../services/NotificationsService';
import { AppState, Linking, Text, TextInput } from 'react-native'; // <--- ADD Text, TextInput HERE

// ---> ADD THIS BLOCK TO SET THE GLOBAL FONT <---
const customTextProps = {
  style: {
    fontFamily: 'Ramabhadra', // Your global default font
  },
};

// Apply to all Text components
if (Text.defaultProps) {
  Text.defaultProps.style = { ...Text.defaultProps.style, ...customTextProps.style };
} else {
  Text.defaultProps = customTextProps;
}

// Apply to all TextInput components
if (TextInput.defaultProps) {
  TextInput.defaultProps.style = { ...TextInput.defaultProps.style, ...customTextProps.style };
} else {
  TextInput.defaultProps = customTextProps;
}

// Import Store to check fresh state inside event listeners
import { store } from '../redux/store'; 

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
import UnreadNewsScreen from '../screens/UnreadNewsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen'; // <-- ADDED THIS
import AboutUsScreen from '../screens/AboutUsScreen';

import { endActivity, startActivity, updateGuestLastActiveDate } from '../redux/reducers/auth';
import { fetchArticleById } from '../redux/reducers/news';

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
  const sessionIdRef = useRef(null);

  const serviceHandler = async () =>{
    const response = await dispatch(startActivity({ district_id: districtIdRef.current }));
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

  // Handle App State Changes (Background/Foreground)
  useEffect(() => {
    serviceHandler()
    const subscription = AppState.addEventListener('change', nextAppState => {
      // App comes to Foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
       serviceHandler()
      } 
      // App goes to Background
      else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // --- 1. Track Guest Last Active Date ---
        // Using store.getState() prevents stale closure issues in the event listener
        const currentAuthState = store.getState().auth;
        if (!currentAuthState.userToken && !currentAuthState.reporterToken) {
           dispatch(updateGuestLastActiveDate());
        }

        // --- 2. End Tracking Session ---
        if (sessionIdRef.current) {
          dispatch(endActivity({ session_id: sessionIdRef.current }));
          sessionIdRef.current = null;
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  // Deep Linking & Notification Handling
  useEffect(() => {
    const handleNotificationClick = async (url) => {
      if (url && url.startsWith('rapidnews://news/')) {
        const newsId = url.replace('rapidnews://news/', '');
        console.log(newsId, ">>>>>>>>>>>>>>>>>>>newsId");
        
        // Fetch the news data using the extracted ID
        const resp = await dispatch(fetchArticleById(newsId));
        console.log(resp, ">>>>>>>>News Fetched from Link");
        
        const navigateToNews = () => {
          if (navigationRef.isReady()) {
            navigationRef.current.navigate('Main');
          } else {
            setTimeout(navigateToNews, 300); // Retry if navigation isn't ready
          }
        };
        navigateToNews();
      }
    };

    // Listen for notification click when app is killed/closed
    Linking.getInitialURL().then((url) => {
      handleNotificationClick(url);
    });

    // Listen for notification click when app is already open in background
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleNotificationClick(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  }, [dispatch, navigationRef]);

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

        <Stack.Screen 
          name="UnreadNewsScreen" 
          component={UnreadNewsScreen} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="PrivacyPolicy" 
          component={PrivacyPolicyScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AboutUs" 
          component={AboutUsScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;