package com.rapidnews

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.view.WindowInsets
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    applyNavigationBarAppearance()

    // Android 15+ draws content behind system bars. Paint only the navigation
    // inset so its background stays black without moving the article layout.
    if (Build.VERSION.SDK_INT >= 35) {
      val decor = window.decorView
      val protection = object : Drawable() {
        private val paint = Paint().apply { color = Color.BLACK }
        override fun draw(canvas: Canvas) {
          val bottom = decor.rootWindowInsets
              ?.getInsets(WindowInsets.Type.navigationBars())?.bottom ?: 0
          if (bottom > 0) {
            canvas.drawRect(0f, (bounds.height() - bottom).toFloat(),
                bounds.width().toFloat(), bounds.height().toFloat(), paint)
          }
        }
        override fun setAlpha(alpha: Int) { paint.alpha = alpha }
        override fun setColorFilter(colorFilter: ColorFilter?) { paint.colorFilter = colorFilter }
        @Suppress("DEPRECATION")
        override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
      }
      decor.overlay.add(protection)
      decor.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
        protection.setBounds(0, 0, decor.width, decor.height)
        protection.invalidateSelf()
      }
    }
  }

  @Suppress("DEPRECATION")
  private fun applyNavigationBarAppearance() {
    window.navigationBarColor = Color.BLACK
    if (Build.VERSION.SDK_INT >= 29) {
      window.isNavigationBarContrastEnforced = false
    }
    WindowCompat.getInsetsController(window, window.decorView)
        .isAppearanceLightNavigationBars = false
  }

  override fun onResume() {
    super.onResume()
    applyNavigationBarAppearance()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applyNavigationBarAppearance()
  }

  override fun getMainComponentName(): String = "rapidnews"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // Lock font scale to 1.0 regardless of device accessibility settings
  override fun attachBaseContext(newBase: Context) {
    val config = Configuration(newBase.resources.configuration)
    config.fontScale = 1.0f
    val context = newBase.createConfigurationContext(config)
    super.attachBaseContext(context)
  }
}
