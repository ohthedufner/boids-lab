

### How to Turn it Into a TV App

1. **Drop the File into Assets:** In a new Android Studio project, place your single HTML file inside the `src/main/assets/` folder (naming it `index.html`).

2. **Add a WebView Activity:** Create a basic activity that loads the local file and enables JavaScript:

   Kotlin

   ```
   val webView = WebView(this).apply {
       settings.javaScriptEnabled = true
       settings.domStorageEnabled = true
       loadUrl("file:///android_asset/index.html")
   }
   setContentView(webView)
   ```

3. **Configure for Android TV:** In your `AndroidManifest.xml`, add the Leanback banner and declare the app as a television-compatible launcher app so it appears neatly on your Chromecast/Streamer home screen:

   XML

   ```
   <uses-feature android:name="android.software.leanback" android:required="false" />
   <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
   
   <intent-filter>
       <action android:name="android.intent.action.MAIN" />
       <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
   </intent-filter>
   ```

   

Because it runs locally inside a WebView wrapper, your control panel (buttons and sliders) will function exactly the same way it does in your workstation browser—fully responsive to your TV remote or a connected gamepad/mouse.