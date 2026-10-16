package com.rapidnews;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.view.View;
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

        // MUST run on UI thread to draw the View hierarchy
        activity.runOnUiThread(() -> {
            try {
                Window window = activity.getWindow();
                View decorView = window.getDecorView();
                int width = decorView.getWidth();
                int height = decorView.getHeight();

                if (width == 0 || height == 0) {
                    promise.reject("INVALID_SIZE", "Window has zero size");
                    return;
                }

                // THE FIX: We use a standard Canvas to draw the React Native View Hierarchy.
                // This guarantees the fallback image is captured and completely prevents 
                // the "black hardware hole" caused by PixelCopy and SurfaceViews.
                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                canvas.drawColor(Color.WHITE); // Prevent transparency issues
                decorView.draw(canvas);

                saveBitmapAndResolve(bitmap, promise);
            } catch (Exception e) {
                promise.reject("CAPTURE_ERROR", e.getMessage());
            }
        });
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