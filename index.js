/**
 * @format
 */

import {AppRegistry, Text, TextInput} from 'react-native';

// Disable font scaling globally - MUST be before App import
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

import App from './App';
import {name as appName} from './app.json';
import { backgroundMessageHandler } from './src/services/NotificationsService';
import messaging from '@react-native-firebase/messaging';

// MUST BE PLACED HERE - Outside of any React component lifecycle!
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

AppRegistry.registerComponent(appName, () => App);
