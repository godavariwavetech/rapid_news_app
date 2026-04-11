package com.sitinews;

import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.view.PixelCopy;
import android.view.Window;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;

public class ScreenshotModule extends ReactContextBaseJavaModule {

    public ScreenshotModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ScreenshotModule";
    }

    @ReactMethod
    public void capture(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }

        try {
            Window window = activity.getWindow();
            android.view.View decorView = window.getDecorView();
            int width = decorView.getWidth();
            int height = decorView.getHeight();

            if (width == 0 || height == 0) {
                promise.reject("INVALID_SIZE", "Window has zero size");
                return;
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // PixelCopy works with New Architecture / Fabric
                PixelCopy.request(window, bitmap, copyResult -> {
                    if (copyResult == PixelCopy.SUCCESS) {
                        saveBitmapAndResolve(bitmap, promise);
                    } else {
                        promise.reject("PIXEL_COPY_FAILED", "PixelCopy failed with code: " + copyResult);
                    }
                }, new Handler(Looper.getMainLooper()));
            } else {
                // Fallback for Android < 8
                activity.runOnUiThread(() -> {
                    try {
                        decorView.setDrawingCacheEnabled(true);
                        Bitmap cache = Bitmap.createBitmap(decorView.getDrawingCache());
                        decorView.setDrawingCacheEnabled(false);
                        saveBitmapAndResolve(cache, promise);
                    } catch (Exception e) {
                        promise.reject("DRAW_CACHE_FAILED", e.getMessage());
                    }
                });
            }
        } catch (Exception e) {
            promise.reject("CAPTURE_ERROR", e.getMessage());
        }
    }

    private void saveBitmapAndResolve(Bitmap bitmap, Promise promise) {
        try {
            File cacheDir = getReactApplicationContext().getCacheDir();
            File file = new File(cacheDir, "screenshot_" + System.currentTimeMillis() + ".jpg");
            FileOutputStream out = new FileOutputStream(file);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.flush();
            out.close();
            bitmap.recycle();
            promise.resolve("file://" + file.getAbsolutePath());
        } catch (Exception e) {
            promise.reject("SAVE_ERROR", e.getMessage());
        }
    }
}
