package com.rapidnews;

import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import java.util.Map;

/**
 * Extends ReactNativeFirebaseMessagingService so all JS callbacks
 * (onNotificationOpenedApp, getInitialNotification) keep working.
 *
 * We override onMessageReceived to suppress FCM's default notification
 * and show our custom styled one instead, then call super so the
 * library's JS event plumbing still fires.
 */
public class CustomFirebaseMessagingService extends ReactNativeFirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();

        if (data != null && !data.isEmpty()) {
            String title = data.get("title");
            if (title == null || title.isEmpty()) title = data.get("news_title");
            if (title == null || title.isEmpty()) title = "New Update";

            String newsId = data.get("newsId");
            if (newsId == null) newsId = data.get("news_id");
            if (newsId == null) newsId = data.get("id");
            if (newsId == null) newsId = "";

            String htmlText = "<b><font color=\"#ffffff\">" + title + "</font></b>";
            NotificationHelper.showCustomNotification(this, htmlText, newsId);
        }

        // Call super so the library's JS event bridge still fires
        // (needed for onNotificationOpenedApp / getInitialNotification)
        super.onMessageReceived(remoteMessage);
    }
}
