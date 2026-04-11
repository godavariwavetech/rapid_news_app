import { NativeModules, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { fetchArticleById } from '../redux/reducers/news';
import { store } from '../redux/store';

const { CustomNewsNotification } = NativeModules;

// 1. Export the background handler separately for Headless JS (Killed State)
export const backgroundMessageHandler = async (remoteMessage) => {
  console.log(">>>>>>>>>>>>>>>HELLOMessage Background/Killed", remoteMessage);
  await displayCustomNotification(remoteMessage);
};

export const setupNotificationHandlers = (navigation) => {
  console.log("<><><><><><><><><><><>Notifications setup");
  
  // Foreground notifications
  messaging().onMessage(async remoteMessage => {
    console.log(">>>>>>>>>>>>>>>HELLOMessage Foreground", remoteMessage);
    displayCustomNotification(remoteMessage);
  });

  // Notification opened handler (When user taps the notification in background)
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationNavigation(remoteMessage.data, navigation);
  });

  // Check if app was opened from notification (Cold boot / Killed state)
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      handleNotificationNavigation(remoteMessage.data, navigation);
    }
  });
};

const displayCustomNotification = async (remoteMessage) => {
  console.log(remoteMessage,">>>>>>>>>>>>>>>>>>>>REMOTE NOTIFICATION");
  if(!remoteMessage?.data) return
  try {
    // If using Data-Only messages (as you should), extract from data
    const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'New Update';
    const body = remoteMessage.data?.body || remoteMessage.notification?.body || '';
    
    if (CustomNewsNotification && CustomNewsNotification.show) {
      if (Platform.OS === 'android') {
        // You can dynamically pass the title/body if needed, or use your hardcoded values
        const newsHtml = `<b><font color="#ffffff">${title}</font></b>`;
        const newsId = remoteMessage.data?.newsId || remoteMessage.data?.news_id || remoteMessage.data?.id || '98765'; 

        CustomNewsNotification.show(newsHtml, newsId);
      } else {
        // iOS implementation
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
    // Await the fetch so the article is in Redux before NewsDetailScreen renders
    await store.dispatch(fetchArticleById(newsId));
    navigation.navigate('NewsDetail', { newsId: newsId });
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