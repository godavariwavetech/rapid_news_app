package com.rapidnews;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.text.Html;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;

public class NotificationHelper {

    // Bumped from the original "custom_news_channel". Android locks a channel's
    // importance at FIRST creation — recreating the old id with IMPORTANCE_HIGH is
    // silently ignored on devices that first created it at a lower importance. A new
    // id forces HIGH to actually apply (heads-up banners) without a reinstall.
    // MUST stay in sync with AndroidManifest.xml default_notification_channel_id.
    private static final String CHANNEL_ID = "custom_news_channel_v2";

    // Each notification gets its OWN unique group key (a "group of one") so the OS
    // never bundles them into a collapsed stack. Android auto-groups 4+ otherwise-
    // ungrouped notifications from one app under a system summary; assigning every
    // notification a distinct group defeats that auto-bundling AND means no summary
    // is ever shown (a single-child group has nothing to summarize). This makes each
    // news item a standalone, independent entry — matching the competitor's behavior.
    private static final String GROUP_KEY_PREFIX = "com.rapidnews.NEWS_";

    // Process-wide monotonically increasing id source. Seeded from the clock so ids
    // don't repeat across app restarts; incremented per-notification so two posts in
    // the same millisecond can't collide (which casting currentTimeMillis to int could).
    private static final java.util.concurrent.atomic.AtomicInteger ID_COUNTER =
            new java.util.concurrent.atomic.AtomicInteger((int) (System.currentTimeMillis() & 0x7FFFFFFF));
    private static final long[] VIBRATION_PATTERN = new long[]{0, 250, 250, 250};

    // Every push gets its own unique id/group (see GROUP_KEY_PREFIX above) so Android
    // never auto-collapses them — but that also means nothing ever cancels old ones,
    // so they pile up in the shade forever. We persist the ids we've posted (oldest
    // first) in SharedPreferences (survives the FCM service's process being killed
    // between pushes) and cancel the oldest ones once more than MAX_VISIBLE are active,
    // keeping only the latest 5 notifications visible.
    private static final String HISTORY_PREFS = "notification_history";
    private static final String HISTORY_KEY_IDS = "posted_ids";
    private static final String HISTORY_DELIMITER = ",";
    private static final int MAX_VISIBLE = 5;

    private static void trackAndTrimHistory(Context context, NotificationManager manager, int newNotificationId) {
        android.content.SharedPreferences prefs =
                context.getSharedPreferences(HISTORY_PREFS, Context.MODE_PRIVATE);
        String stored = prefs.getString(HISTORY_KEY_IDS, "");

        java.util.List<String> ids = new java.util.ArrayList<>();
        if (!stored.isEmpty()) {
            java.util.Collections.addAll(ids, stored.split(HISTORY_DELIMITER));
        }
        ids.add(String.valueOf(newNotificationId));

        while (ids.size() > MAX_VISIBLE) {
            String oldestId = ids.remove(0);
            try {
                manager.cancel(Integer.parseInt(oldestId));
            } catch (NumberFormatException ignored) {
            }
        }

        prefs.edit().putString(HISTORY_KEY_IDS, android.text.TextUtils.join(HISTORY_DELIMITER, ids)).apply();
    }

    // Back-compat overload (e.g. CustomNewsModule's JS bridge): no separate
    // title/body, so the lockscreen fallback fields stay empty.
    public static void showCustomNotification(Context context, String htmlText, String newsId) {
        showCustomNotification(context, htmlText, null, null, newsId);
    }

    public static void showCustomNotification(Context context, String htmlText, String title, String body, String newsId) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = CHANNEL_ID;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId, "News Alerts", NotificationManager.IMPORTANCE_HIGH);
            channel.enableVibration(true);
            channel.setVibrationPattern(VIBRATION_PATTERN);
            manager.createNotificationChannel(channel);
        }

        String packageName = context.getPackageName();
        int layoutId = context.getResources().getIdentifier("custom_news_notification", "layout", packageName);
        int titleId  = context.getResources().getIdentifier("custom_title", "id", packageName);

        if (layoutId == 0 || titleId == 0) return;

        // Small status icon: the monochrome silhouette (ic_notification, alpha-only
        // newspaper mark) — the standard Android small-icon, distinct from the
        // full-color logo so they don't read as duplicated. Falls back to the flat
        // launcher foreground, then the system info icon.
        int smallIconId = context.getResources().getIdentifier("ic_notification", "drawable", packageName);
        if (smallIconId == 0) smallIconId = context.getResources().getIdentifier("ic_launcher_foreground", "mipmap", packageName);
        if (smallIconId == 0) smallIconId = android.R.drawable.ic_dialog_info;

        // No setLargeIcon: the custom layout already shows the full-color logo
        // (notification_logo). Setting a large icon too would render a second
        // duplicate logo beside it.

        RemoteViews collapsedView = new RemoteViews(packageName, layoutId);
        RemoteViews expandedView  = new RemoteViews(packageName, layoutId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            collapsedView.setTextViewText(titleId, Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT));
            expandedView.setTextViewText(titleId,  Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT));
        } else {
            collapsedView.setTextViewText(titleId, Html.fromHtml(htmlText));
            expandedView.setTextViewText(titleId,  Html.fromHtml(htmlText));
        }

        Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
        if (intent != null) {
            intent.setAction(Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse("rapidnews://news/" + newsId));
            intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }

        // Unique id per notification so each is a distinct entry, never a replace, and
        // never collides (incremented, not a possibly-duplicate same-ms timestamp).
        int notificationId = ID_COUNTER.incrementAndGet();

        // Real arrival time, captured once for both setWhen and the sort key below so
        // they agree. This is the actual post time (NOT a backend publish timestamp),
        // so the shade ranks our newest at the top of the importance bucket.
        long postTime = System.currentTimeMillis();

        // Unique group per notification ("group of one") so Android never bundles these
        // into a collapsed stack or posts an auto-generated summary at 4+ notifications.
        String uniqueGroup = GROUP_KEY_PREFIX + notificationId;

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, notificationId, intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(smallIconId)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                // Standard title/body so the secure lockscreen (and any surface that
                // doesn't render our custom RemoteViews) has real content to show
                // instead of the generic "New notification" placeholder.
                .setContentTitle(title)
                .setContentText(body)
                // PUBLIC so the lockscreen shows the content un-redacted even when the
                // device is set to "hide sensitive notifications" — the default PRIVATE
                // gets redacted to a contentless public version ("New notification").
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCustomContentView(collapsedView)
                .setCustomBigContentView(expandedView)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                // Explicit post time = real arrival time, and show it, so users can see
                // recency and the OS sorts by a definite timestamp within the bucket.
                .setWhen(postTime)
                .setShowWhen(true)
                // Deterministic newest-first tiebreaker among OUR OWN notifications:
                // Android sorts sortKey ascending, so newest (largest postTime) → smallest
                // key → ranks highest. (Cross-app order vs other apps is system-controlled.)
                .setSortKey(String.format(java.util.Locale.US, "%020d", Long.MAX_VALUE - postTime))
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVibrate(VIBRATION_PATTERN)
                // Unique group + GROUP_ALERT_ALL keeps each item standalone AND lets every
                // one produce its own heads-up banner + sound (no summary suppresses them).
                .setGroup(uniqueGroup)
                .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_ALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        manager.notify(notificationId, builder.build());
        trackAndTrimHistory(context, manager, notificationId);
    }
}
