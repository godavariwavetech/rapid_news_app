package com.rapidnews;

import android.content.Context;

import com.bumptech.glide.GlideBuilder;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory;
import com.bumptech.glide.module.AppGlideModule;

/**
 * Replaces react-native-fast-image's empty AppGlideModule (excluded via
 * excludeAppGlideModule in the root build.gradle) so we can bound the image
 * cache.
 *
 * Glide's default disk cache is 250 MB and it only evicts once it reaches that,
 * which is why the app's cache kept climbing into the hundreds of megabytes.
 * Capping it makes Glide LRU-evict continuously instead — no clearing code, no
 * startup scan, and images that are still hot stay cached.
 *
 * Now that media is served off the local volume rather than S3, refetching a
 * cold image is cheap, so a smaller window costs very little.
 */
@GlideModule
public final class RapidNewsGlideModule extends AppGlideModule {

    // Tuning knob: ~40 MB holds a few hundred feed images at typical sizes.
    private static final long DISK_CACHE_BYTES = 40L * 1024L * 1024L;

    @Override
    public void applyOptions(Context context, GlideBuilder builder) {
        builder.setDiskCache(new InternalCacheDiskCacheFactory(context, DISK_CACHE_BYTES));
    }

    // Manifest parsing is for the deprecated pre-Glide-4 module style; we have none.
    @Override
    public boolean isManifestParsingEnabled() {
        return false;
    }
}
