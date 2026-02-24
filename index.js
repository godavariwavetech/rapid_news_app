/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { backgroundMessageHandler } from './src/services/NotificationsService';
import messaging from '@react-native-firebase/messaging';

// MUST BE PLACED HERE - Outside of any React component lifecycle!
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

AppRegistry.registerComponent(appName, () => App);
