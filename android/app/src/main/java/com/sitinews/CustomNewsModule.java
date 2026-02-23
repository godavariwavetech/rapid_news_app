package com.sitinews;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.text.Html;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CustomNewsModule extends ReactContextBaseJavaModule {

    public CustomNewsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CustomNewsNotification";
    }

    @ReactMethod
    public void show(String htmlText, String newsId) {
        ReactApplicationContext context = getReactApplicationContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "custom_news_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "News Alerts", NotificationManager.IMPORTANCE_HIGH);
            manager.createNotificationChannel(channel);
        }

        String packageName = context.getPackageName();
        int layoutId = context.getResources().getIdentifier("custom_news_notification", "layout", packageName);
        int titleId = context.getResources().getIdentifier("custom_title", "id", packageName);
        
        // --- SMART ICON RESOLUTION ---
        // 1. First, try to find the icon in the standard 'drawable' folder
        int iconId = context.getResources().getIdentifier("ic_notification", "drawable", packageName);

        // 2. If not found, Android Studio sometimes hides it in 'mipmap'. Check there.
        if (iconId == 0) {
            iconId = context.getResources().getIdentifier("ic_notification", "mipmap", packageName);
        }

        // 3. FALLBACK: If the icon is missing entirely, use the system "i" icon 
        // so the notification actually triggers instead of failing silently.
        if (iconId == 0) {
            iconId = android.R.drawable.ic_dialog_info;
        }

        // Only abort if the core XML layout is completely missing
        if (layoutId == 0 || titleId == 0) return;

        RemoteViews collapsedView = new RemoteViews(packageName, layoutId);
        RemoteViews expandedView = new RemoteViews(packageName, layoutId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            collapsedView.setTextViewText(titleId, Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT));
            expandedView.setTextViewText(titleId, Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT));
        } else {
            collapsedView.setTextViewText(titleId, Html.fromHtml(htmlText));
            expandedView.setTextViewText(titleId, Html.fromHtml(htmlText));
        }

        Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
        if (intent != null) {
            intent.setAction(Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse("rapidnews://news/" + newsId));
            intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, (int) System.currentTimeMillis(), intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(iconId)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(collapsedView)   
                .setCustomBigContentView(expandedView) 
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        manager.notify((int) System.currentTimeMillis(), builder.build());
    }
}