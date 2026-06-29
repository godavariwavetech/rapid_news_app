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

            // No hardcoded color — the TextView uses TextAppearance.Compat.Notification.Title,
            // which adapts to the system notification panel theme (dark/light). A <font color>
            // span here would override it and disappear on light themes (white-on-white).
            String htmlText = "<b>" + title + "</b>";
            // Lockscreen should show ONLY the headline (like Way2News) — pass the title
            // as the content text and leave contentTitle null (generic header). The
            // description body is intentionally NOT forwarded, so no paragraph renders.
            NotificationHelper.showCustomNotification(this, htmlText, null, title, newsId);
        }

        // Call super so the library's JS event bridge still fires
        // (needed for onNotificationOpenedApp / getInitialNotification)
        super.onMessageReceived(remoteMessage);
    }
}
