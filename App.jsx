import React, {useEffect, useState} from 'react';
import {LogBox, InteractionManager, NativeModules, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {store, persistorStore} from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import {TabBarProvider} from './src/context/TabBarContext';
import {ThemeProvider} from './src/context/ThemeContext'; // Wait, it was ThemeContext.tsx? Let me check.
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import CustomModal from './src/components/CustomModal';
import UpdateGate from './src/components/UpdateGate';
import { getFCMToken } from './src/services/NotificationsService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

LogBox.ignoreAllLogs();

function App() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
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

  // Update checks now live in the <UpdateGate /> component (backend-driven gate +
  // Play In-App Updates). The old VersionCheck.needUpdate() Alert was removed.

  const getToken = async () => {
    await getFCMToken();
  }

  useEffect(() => {
    // checkAndRequestPermissions();
    // #3: defer non-critical startup work off the first-paint path so it doesn't
    // compete with the initial feed render. Runs after the first frame/interactions.
    const task = InteractionManager.runAfterInteractions(() => {
      getToken();
      // notifee.requestPermission();
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '41246324898-qj2qc1jnrmasiluhdl0cf73cdgdb6rs1.apps.googleusercontent.com',
      offlineAccess: true, 
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GestureHandlerRootView style={{flex: 1}}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistorStore}>
            <TabBarProvider>
              <ThemeProvider>
                <AppNavigator />
                <UpdateGate />
              </ThemeProvider>
            </TabBarProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
