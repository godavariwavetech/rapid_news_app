package com.sitinews;

import com.rapidnews.NotificationHelper;
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
        NotificationHelper.showCustomNotification(getReactApplicationContext(), htmlText, newsId);
    }
}