import React, {useEffect, useState} from 'react';
import {Linking, LogBox} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistorStore} from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
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

LogBox.ignoreAllLogs();

function App() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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
        setShowUpdateModal(true);
      } else {
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await VersionCheck.needUpdate();
      const supported = await Linking.canOpenURL(res.storeUrl);
      if (supported) {
        await Linking.openURL(res.storeUrl);
      } else {
        await Linking.openURL(res.storeUrl);
      }
    } catch (error) {
      console.log('Play Store link error:', error);
    } finally {
      setShowUpdateModal(false);
    }
  };

  const getToken = async () => { 
    await getFCMToken();
  }

  useEffect(() => {
    getToken();
    checkForUpdate();
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '41246324898-qj2qc1jnrmasiluhdl0cf73cdgdb6rs1.apps.googleusercontent.com',
      offlineAccess: true, 
    });
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistorStore}>
          <ThemeProvider>
            <TabBarProvider>
              <AppNavigator />
              <CustomModal
                visible={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onUpdate={handleUpdate}
              />
            </TabBarProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
