# AndroidManifest.xml Quick Reference

## 🎯 YES, You Need It - But Capacitor Creates It!

### Automatic Generation
```bash
npx cap add android
```
This command creates: `android/app/src/main/AndroidManifest.xml`

---

## 📝 Minimum Required Customization

After Capacitor creates it, add these permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🚀 Full TimeMaster Configuration

Copy this complete file to `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.timemaster.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="com.timemaster.app.MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

</manifest>
```

---

## 🔄 Workflow

```bash
# 1. Add Android platform (creates manifest)
npx cap add android

# 2. Edit the file
# Location: android/app/src/main/AndroidManifest.xml
# Add permissions and config above

# 3. Sync changes
npx cap sync android

# 4. Build
npx cap open android
```

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| No internet | Add `INTERNET` permission |
| Keyboard covers inputs | Add `windowSoftInputMode="adjustResize"` |
| Changes not applied | Run `npx cap sync android` |
| Wrong file edited | Edit `android/app/src/main/AndroidManifest.xml` |

---

## 📍 File Location

```
android/
└── app/
    └── src/
        └── main/
            └── AndroidManifest.xml  ← THIS FILE
```

**NOT** these files:
- ❌ `android/src/main/AndroidManifest.xml` (doesn't exist)
- ❌ `android/AndroidManifest.xml` (doesn't exist)

---

## 💡 Key Points

✅ Capacitor auto-generates it  
✅ You must customize it  
✅ Edit after `npx cap add android`  
✅ Sync with `npx cap sync android`  
✅ Required for APK to work properly

---

## 📚 More Details

See `ANDROID_MANIFEST_GUIDE.md` for complete documentation.
