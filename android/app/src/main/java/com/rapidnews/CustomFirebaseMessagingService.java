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

            // Editor-chosen title color, set from the dashboard's push options (see
            // news.notifcation.js resolvePushTitleColor on the backend, which is the
            // only thing allowed to populate this key). Strict 6-digit hex only -
            // this is spliced straight into an HTML attribute below, so anything
            // that isn't exactly that shape is discarded rather than sanitized.
            // No hardcoded color when absent — the TextView falls back to
            // TextAppearance.Compat.Notification.Title, which adapts to the system
            // notification panel theme (dark/light). A <font color> span here would
            // override that and disappear on light themes (white-on-white).
            String titleColor = data.get("title_color");
            boolean hasValidColor = titleColor != null && titleColor.matches("^#[0-9a-fA-F]{6}$");

            // Editors can wrap a word/phrase in **...** (typed straight into the
            // dashboard's title field) to color ONLY that part instead of the whole
            // title — e.g. "Gold worth ₹2 crore **seized** in Annamayya". Falls back
            // to coloring the entire title (the original behavior) when no marker is
            // present, so existing pushes that never used markers are unaffected.
            java.util.regex.Pattern markerPattern = java.util.regex.Pattern.compile("\\*\\*(.+?)\\*\\*");
            java.util.regex.Matcher markerMatcher = markerPattern.matcher(title);

            String plainTitle;
            String htmlText;
            if (markerMatcher.find()) {
                markerMatcher.reset();
                StringBuilder html = new StringBuilder();
                StringBuilder plain = new StringBuilder();
                int lastEnd = 0;
                while (markerMatcher.find()) {
                    String before = title.substring(lastEnd, markerMatcher.start());
                    String word = markerMatcher.group(1);
                    html.append(before);
                    plain.append(before);
                    html.append(hasValidColor ? "<font color='" + titleColor + "'>" + word + "</font>" : word);
                    plain.append(word);
                    lastEnd = markerMatcher.end();
                }
                String tail = title.substring(lastEnd);
                html.append(tail);
                plain.append(tail);
                htmlText = "<b>" + html + "</b>";
                plainTitle = plain.toString();
            } else {
                plainTitle = title;
                htmlText = hasValidColor
                        ? "<font color='" + titleColor + "'><b>" + title + "</b></font>"
                        : "<b>" + title + "</b>";
            }

            // Lockscreen should show ONLY the headline (like Way2News) — pass the title
            // as the content text and leave contentTitle null (generic header). The
            // description body is intentionally NOT forwarded, so no paragraph renders.
            // plainTitle (markers stripped) is used here since this is a plain-text
            // field, not HTML.
            NotificationHelper.showCustomNotification(this, htmlText, null, plainTitle, newsId);
        }

        // Call super so the library's JS event bridge still fires
        // (needed for onNotificationOpenedApp / getInitialNotification)
        super.onMessageReceived(remoteMessage);
    }
}
