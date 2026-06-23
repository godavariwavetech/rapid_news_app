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

    public static void showCustomNotification(Context context, String htmlText, String newsId) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "custom_news_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId, "News Alerts", NotificationManager.IMPORTANCE_HIGH);
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

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, (int) System.currentTimeMillis(), intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(smallIconId)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(collapsedView)
                .setCustomBigContentView(expandedView)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        manager.notify((int) System.currentTimeMillis(), builder.build());
    }
}
