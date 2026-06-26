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

    public static void showCustomNotification(Context context, String htmlText, String newsId) {
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
                .setCustomContentView(collapsedView)
                .setCustomBigContentView(expandedView)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVibrate(VIBRATION_PATTERN)
                // Unique group + GROUP_ALERT_ALL keeps each item standalone AND lets every
                // one produce its own heads-up banner + sound (no summary suppresses them).
                .setGroup(uniqueGroup)
                .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_ALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        manager.notify(notificationId, builder.build());
    }
}
