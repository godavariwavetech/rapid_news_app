import React, { useEffect, useRef } from 'react';
import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useDispatch, useSelector} from 'react-redux';
import { setupNotificationHandlers } from '../services/NotificationsService';
import { AppState, Text, TextInput, InteractionManager } from 'react-native';

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
import {linkedArticleTransition} from './linkedArticleTransition';
import MagazineViewerScreen from '../screens/MagazineViewerScreen';
import FullScorecardScreen from '../screens/FullScorecardScreen';
import ExamResultScreen from '../screens/ExamResultScreen';
import UnreadNewsScreen from '../screens/UnreadNewsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen'; // <-- ADDED THIS
import AboutUsScreen from '../screens/AboutUsScreen';

import { endActivity, startActivity, registerDevice } from '../redux/reducers/auth';
import { newsLinking } from './newsLinking';
import { getAppOpenTracker } from '../utils/appOpenTracker';

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
  const appOpenTrackerRef = useRef(null);

  const serviceHandler = async () =>{
    const action = await dispatch(startActivity({ district_id: districtIdRef.current }));
    // The backend (usersSession.controller.start) returns the created session's
    // real _id as payload.session_id. Use THAT — meta.requestId is the
    // Redux-Toolkit thunk id (a nanoid), not a Mongo ObjectId, so sending it to
    // /activity/end fails ObjectId.isValid() and the session never closes.
    const sessionId = action?.payload?.session_id;
    if (sessionId) {
      sessionIdRef.current = sessionId;
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
    if (!appOpenTrackerRef.current) {
      appOpenTrackerRef.current = getAppOpenTracker(AppState.currentState, () => {
        serviceHandler();
        dispatch(registerDevice());
      });
    }
    // #3: defer the cold-start analytics session off the first-paint path.
    // The foreground-resume serviceHandler() below stays immediate.
    const initTask = InteractionManager.runAfterInteractions(() => {
      appOpenTrackerRef.current.start();
    });
    const subscription = AppState.addEventListener('change', nextAppState => {
      appOpenTrackerRef.current.change(nextAppState);
      // Inactive is transient; end a session only on a real background transition.
      if (appState.current !== 'background' && nextAppState === 'background') {
        // --- End Tracking Session ---
        if (sessionIdRef.current) {
          dispatch(endActivity({ session_id: sessionIdRef.current }));
          sessionIdRef.current = null;
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      initTask.cancel();
      subscription.remove();
    };
  }, [dispatch]);

  return (
    <NavigationContainer ref={navigationRef} linking={newsLinking}>
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
          options={({route}) => ({
            headerShown: false,
            ...(route.params?.fromArticleLink ? linkedArticleTransition : {}),
          })}
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
        <Stack.Screen
          name="MagazineViewer"
          component={MagazineViewerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FullScorecard"
          component={FullScorecardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ExamResult"
          component={ExamResultScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
