import React, {useEffect} from 'react';
import {Linking, LogBox, Alert} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistorStore} from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import YoutubeTestScreen from './src/screens/YoutubeTestScreen';
import {TabBarProvider} from './src/context/TabBarContext';
import {ThemeProvider} from './src/context/ThemeContext';
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import VersionCheck from 'react-native-version-check'; 
import CustomModal from './src/components/CustomModal';
import { getFCMToken } from './src/services/NotificationsService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NativeModules } from 'react-native';
import notifee from '@notifee/react-native';


LogBox.ignoreAllLogs();

function App() {
  const { CustomNewsNotification } = NativeModules;

  const checkAndRequestPermissions = async () => {
    try {
      const {status} = await checkNotifications();
      if (status !== RESULTS.GRANTED) {
        await requestNotifications(['alert', 'sound']);
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  const checkForUpdate = async () => {
    try {
      const res = await VersionCheck.needUpdate();
      if (res?.isNeeded) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Please update to continue using all features.',
          [
            {
              text: 'Update Now',
              onPress: async () => {
                try {
                  await Linking.openURL(res.storeUrl);
                } catch (e) {
                  console.log('Play Store link error:', e);
                }
              },
            },
          ],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  };

  const handleUpdate = async () => {};

    const getToken = async () => { 
    await getFCMToken();
  }


  useEffect(() => {
    // checkAndRequestPermissions();
    getToken();
    checkForUpdate();
    // notifee.requestPermission();
  }, []);


  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '41246324898-qj2qc1jnrmasiluhdl0cf73cdgdb6rs1.apps.googleusercontent.com',
      offlineAccess: true, 
    });
  }, []);

  const testNot= async () =>{
const newsHtml = '<b><font color="#ffffff">పాలు </font></b>';
  const newsId = '69983a46dfd2ebf3f26169e3'; // The ID of the article

  // Pass the ID as the second argument
  CustomNewsNotification.show(newsHtml, newsId);
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistorStore}>
          <TabBarProvider>
            <ThemeProvider>
              <AppNavigator />
            </ThemeProvider>
          </TabBarProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
