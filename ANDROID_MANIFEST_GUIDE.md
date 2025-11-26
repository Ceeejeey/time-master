# AndroidManifest.xml Guide for Capacitor APK

## Quick Answer

**Yes, you NEED AndroidManifest.xml**, but **Capacitor creates it automatically** when you run:

```bash
npx cap add android
```

The file will be generated at:
```
android/app/src/main/AndroidManifest.xml
```

## What You Need to Do

### 1. **Let Capacitor Generate It First**

Run these commands in order:
```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor
npx cap init
# Enter: TimeMaster, com.timemaster.app, dist

# 3. Build your web app
npm run build

# 4. Add Android platform (this creates AndroidManifest.xml)
npx cap add android
```

### 2. **Then Customize It**

After Capacitor generates the default manifest, you'll need to customize it for your app.

## Default AndroidManifest.xml

Capacitor generates a file that looks like this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.timemaster.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="com.timemaster.app.MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

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

    <!-- Permissions automatically added by Capacitor -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

## Customizations for TimeMaster

### Step 1: Open the File

After running `npx cap add android`, edit:
```
android/app/src/main/AndroidManifest.xml
```

### Step 2: Add Required Permissions

Add these permissions inside the `<manifest>` tag (before `<application>`):

```xml
<!-- Essential permissions for TimeMaster -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Step 3: Configure Application Settings

Update the `<application>` tag:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true"
    android:hardwareAccelerated="true"
    android:largeHeap="true">
```

**What these do:**
- `usesCleartextTraffic="true"` - Allows HTTP connections (needed for Appwrite API)
- `hardwareAccelerated="true"` - Better performance
- `largeHeap="true"` - More memory for the app

### Step 4: Configure MainActivity

Update the `<activity>` tag:

```xml
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

    <!-- Deep linking support (optional) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="time-master-new.appwrite.network" />
    </intent-filter>

</activity>
```

## Complete Custom AndroidManifest.xml for TimeMaster

Here's the complete file you should have:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.timemaster.app">

    <!-- Permissions -->
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
        android:hardwareAccelerated="true"
        android:largeHeap="true">

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

            <!-- Deep linking for OAuth callbacks -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" 
                      android:host="time-master-new.appwrite.network" 
                      android:pathPrefix="/auth-callback" />
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

    <!-- Minimum SDK version (handled by build.gradle, but good to document) -->
    <uses-sdk 
        android:minSdkVersion="22" 
        android:targetSdkVersion="33" />

</manifest>
```

## When to Edit AndroidManifest.xml

You need to edit it when:

### ✅ Required Changes
1. **After first `npx cap add android`** - Add permissions and configurations above
2. **Before building release APK** - Ensure all permissions are correct

### 🔄 Optional Changes
1. **Adding new Capacitor plugins** - Some plugins auto-add permissions
2. **Deep linking** - Configure custom URL schemes
3. **OAuth redirects** - Add intent filters for auth callbacks
4. **Background tasks** - Add wake lock permissions
5. **Notifications** - Add notification permissions

### ❌ Don't Touch
1. **MainActivity class name** - Let Capacitor manage this
2. **FileProvider** - Required by Capacitor
3. **Package name** - Set in capacitor.config.ts instead

## Common Permissions Explained

```xml
<!-- Required for internet access (Appwrite API) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Check if internet is available -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Haptic feedback for better UX -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Keep timer running in background -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Send timer completion notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Read external storage (if needed for file uploads) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Camera access (if adding task photos) -->
<uses-permission android:name="android.permission.CAMERA" />
```

## File Location Reminder

```
your-project/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml  ← Edit this file
│   │   │   │   ├── res/
│   │   │   │   │   ├── values/
│   │   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── mipmap-*/          ← App icons here
│   │   │   │   ├── assets/
│   │   │   │   ├── java/
│   │   ├── build.gradle
│   ├── build.gradle
│   ├── gradle.properties
```

## Workflow Summary

```bash
# 1. Initialize Capacitor (one time)
npx cap init

# 2. Add Android platform (creates AndroidManifest.xml)
npx cap add android

# 3. Customize AndroidManifest.xml
# Edit: android/app/src/main/AndroidManifest.xml
# Add permissions and configurations shown above

# 4. Build web app
npm run build

# 5. Sync changes to Android
npx cap sync android

# 6. Open Android Studio
npx cap open android

# 7. Build APK in Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

## Important Notes

### 🎯 Key Points
- ✅ Capacitor **auto-generates** AndroidManifest.xml
- ✅ You **must customize** it for your app's needs
- ✅ File location: `android/app/src/main/AndroidManifest.xml`
- ✅ Edit **after** running `npx cap add android`
- ✅ Run `npx cap sync` after changes

### ⚠️ Common Mistakes
- ❌ Creating AndroidManifest.xml manually before running `npx cap add android`
- ❌ Editing the wrong manifest (there are multiple in Android project)
- ❌ Forgetting `INTERNET` permission (app won't connect to Appwrite)
- ❌ Not syncing after changes (`npx cap sync`)

### 🔍 Troubleshooting

**Problem**: "App has no internet connection"
- **Fix**: Check `INTERNET` permission in AndroidManifest.xml

**Problem**: "Deep links not working"  
- **Fix**: Add proper `<intent-filter>` in `<activity>`

**Problem**: "Keyboard covers input fields"
- **Fix**: Add `android:windowSoftInputMode="adjustResize"` to activity

**Problem**: "Changes not reflected in APK"
- **Fix**: Run `npx cap sync android` before building

## Next Steps

1. ✅ Run `npx cap add android` (creates the file)
2. ✅ Edit `android/app/src/main/AndroidManifest.xml` with customizations above
3. ✅ Run `npx cap sync android` to apply changes
4. ✅ Open Android Studio with `npx cap open android`
5. ✅ Build your APK

Your AndroidManifest.xml is now ready for TimeMaster! 🚀
