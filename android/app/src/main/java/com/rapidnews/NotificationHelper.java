package com.rapidnews;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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

        // ic_launcher is adaptive (API 26+) and cannot be used as a notification small icon —
        // it renders as a blank white square. Use ic_launcher_foreground which is a flat PNG.
        int smallIconId = context.getResources().getIdentifier("ic_launcher_foreground", "mipmap", packageName);
        if (smallIconId == 0) smallIconId = context.getResources().getIdentifier("ic_launcher", "mipmap", packageName);
        if (smallIconId == 0) smallIconId = android.R.drawable.ic_dialog_info;

        // Large icon shown as the circle avatar in the expanded notification header
        int launcherId = context.getResources().getIdentifier("ic_launcher", "mipmap", packageName);
        Bitmap largeIcon = launcherId != 0
                ? BitmapFactory.decodeResource(context.getResources(), launcherId)
                : null;

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

        if (largeIcon != null) builder.setLargeIcon(largeIcon);

        manager.notify((int) System.currentTimeMillis(), builder.build());
    }
}
