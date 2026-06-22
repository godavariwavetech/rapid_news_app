import { NativeModules, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { fetchArticleById } from '../redux/reducers/news';
import { store } from '../redux/store';

const { CustomNewsNotification } = NativeModules;

// Background/Killed state handler — navigation only, display is handled natively
export const backgroundMessageHandler = async (remoteMessage) => {
  console.log(">>>>>>>>>>>>>>>FCM Background/Killed", remoteMessage);
  // Notification display is handled by CustomFirebaseMessagingService.java
  // Nothing to do here for display — just return so the headless task completes
};

export const setupNotificationHandlers = (navigation) => {
  console.log("<><><><><><><><><><><>Notifications setup");
  
  // Foreground: display is handled natively by CustomFirebaseMessagingService
  // We only need to listen for navigation on tap
  messaging().onMessage(async remoteMessage => {
    console.log(">>>>>>>>>>>>>>>FCM Foreground", remoteMessage);
    // Display already handled natively — nothing to do
  });

  // Tapped while app in background
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationNavigation(remoteMessage.data, navigation);
  });

  // Tapped from killed state
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      handleNotificationNavigation(remoteMessage.data, navigation);
    }
  });
};

const displayCustomNotification = async (remoteMessage) => {
  console.log(remoteMessage,">>>>>>>>>>>>>>>>>>>>REMOTE NOTIFICATION");
  if(!remoteMessage?.data) return;

  try {
    // Backend may send title at different paths — try all common ones
    const data = remoteMessage.data;
    const title = data?.title
      || data?.content?.title
      || data?.news_title;

    // If no valid title is found, skip the notification entirely
    if (!title || !title.trim()) {
      console.log('Skipping notification — no valid title found in payload.');
      return;
    }

    const newsId = data?.newsId || data?.news_id || data?.id || '';

    if (CustomNewsNotification && CustomNewsNotification.show) {
      if (Platform.OS === 'android') {
        // No hardcoded color — the notification's themed text color (set via
        // TextAppearance.Compat.Notification.Title in the layout) adapts to the
        // light/dark shade. A <font color> span here would override it and break
        // on light themes (white-on-white). See CustomFirebaseMessagingService for the killed-app path.
        const newsHtml = `<b>${title}</b>`;
        CustomNewsNotification.show(newsHtml, newsId);
      }
    } else {
      console.warn("CustomNewsNotification is not linked or the method name is incorrect.");
    }

  } catch (error) {
    console.error('Error displaying custom native notification:', error);
  }
};

const handleNotificationNavigation = async (data, navigation) => {
  if (!data) return;

  if (data.type === 'order_update') {
    navigation.navigate('OrderDetails', { orderId: data.orderId });
  } else if (data.newsId || data.news_id || data.id) {
    const newsId = data.newsId || data.news_id || data.id;

    // Fetch article — this also prepends it to index 0 in the Redux feed
    await store.dispatch(fetchArticleById(newsId));

    const navigateTo = () => {
      if (navigation.isReady()) {
        // Go to Main (HomeScreen) — the fetched article is at index 0 in the flip feed
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        setTimeout(navigateTo, 300);
      }
    };
    navigateTo();
  }
};

export const fetchFCMToken = async () => {
  try {
    return await messaging().getToken();
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}; 

export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token in getFCMToken:', error);
    return null;
  }
};