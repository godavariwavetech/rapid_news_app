import React, {useEffect, useState} from 'react';
import {Linking, LogBox} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistorStore} from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import {TabBarProvider} from './src/context/TabBarContext';
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import VersionCheck from 'react-native-version-check'; 
import CustomModal from './src/components/CustomModal';
import { getFCMToken } from './src/services/NotificationsService';

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
    checkAndRequestPermissions();
    getToken();
    checkForUpdate();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistorStore}>
          <TabBarProvider>
            <AppNavigator />
            <CustomModal
              visible={showUpdateModal}
              title="Update Available"
              message="A new version of the app is available. Please update to continue using all features."
              confirmText="Update Now"
              onConfirm={handleUpdate}
              cancelText=''
            />
          </TabBarProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
