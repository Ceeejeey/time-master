# 📱 Converting TimeMaster to Android APK with Capacitor

## Overview
This guide will help you convert your PWA to a native Android app using Capacitor.

## Prerequisites
- Node.js 16+ installed
- Android Studio installed
- Java JDK 17+ installed

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: `TimeMaster`
- **App ID**: `com.timemaster.app` (or your preferred reverse domain)
- **Web directory**: `dist`

## Step 3: Build Your Web App

```bash
npm run build
```

## Step 4: Add Android Platform

```bash
npx cap add android
```

## Step 5: Customize capacitor.config.ts

**Note**: This file is **auto-generated** by `npx cap init`. Don't create it manually!

After `npx cap init` creates the basic file, customize it by adding these configurations:

### Edit `capacitor.config.ts` (created in project root):

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timemaster.app',
  appName: 'TimeMaster',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // For production
    androidScheme: 'https',
    // Enable cleartext for localhost development
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0ea5a6",
      showSpinner: false,
      androidSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0ea5a6"
    }
  }
};

export default config;
```

## Step 6: Install Recommended Plugins

```bash
# Status Bar and Splash Screen
npm install @capacitor/status-bar @capacitor/splash-screen

# Keyboard handling
npm install @capacitor/keyboard

# App info
npm install @capacitor/app

# Network status
npm install @capacitor/network

# Haptics for better mobile feel
npm install @capacitor/haptics
```

## Step 7: Update Your Code for Mobile

### Add Capacitor imports in `src/main.tsx`:

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";

// Capacitor imports
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

// Configure native plugins
if (Capacitor.isNativePlatform()) {
  // Hide splash screen after app loads
  SplashScreen.hide();
  
  // Configure status bar
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0ea5a6' });
  
  // Configure keyboard
  Keyboard.setAccessoryBarVisible({ isVisible: false });
  Keyboard.setResizeMode({ mode: 'native' });
}

createRoot(document.getElementById("root")!).render(<App />);
```

## Step 8: Configure AndroidManifest.xml

File location: `android/app/src/main/AndroidManifest.xml`

Add these permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## Step 9: Update Android App Icons

1. Generate icons using a tool like [App Icon Generator](https://www.appicon.co/)
2. Place icons in: `android/app/src/main/res/`
   - `mipmap-mdpi/`
   - `mipmap-hdpi/`
   - `mipmap-xhdpi/`
   - `mipmap-xxhdpi/`
   - `mipmap-xxxhdpi/`

## Step 10: Sync and Build

### Sync your web code to Android:

```bash
npm run build
npx cap sync android
```

### Open in Android Studio:

```bash
npx cap open android
```

## Step 11: Configure Signing (for Release)

### Create a keystore:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias timemaster -keyalg RSA -keysize 2048 -validity 10000
```

### Update `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'timemaster'
            keyPassword 'your-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 12: Build APK

### Debug APK:

In Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)

Or via command line:

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK:

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Step 13: Test on Device

### Install via ADB:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Or use Android Studio:
- Connect device via USB
- Enable USB Debugging on device
- Click Run in Android Studio

## Mobile-Specific Features Already Implemented

✅ **Touch-friendly UI**
- All buttons have minimum 44x44px touch targets
- `touch-manipulation` CSS for better responsiveness

✅ **Safe Area Support**
- Automatic padding for notched devices
- Uses `env(safe-area-inset-*)` CSS variables

✅ **Viewport Configuration**
- No zoom on input focus
- Prevents overscroll bounce
- Optimized for mobile keyboards

✅ **Responsive Design**
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Flexible grids and layouts

✅ **Performance**
- Smooth scrolling with `-webkit-overflow-scrolling`
- No tap highlight color
- Optimized touch events

## Troubleshooting

### Issue: White screen on app launch

**Solution**: Check browser console in Android Studio Logcat
```bash
adb logcat | grep chromium
```

### Issue: App doesn't update

**Solution**: Always sync after building:
```bash
npm run build
npx cap sync android
```

### Issue: Network requests fail

**Solution**: Check `AndroidManifest.xml` has `INTERNET` permission

### Issue: Keyboard covers inputs

**Solution**: Add to `capacitor.config.ts`:
```typescript
android: {
  captureInput: true
}
```

## Development Workflow

1. Make changes to source code
2. Build: `npm run build`
3. Sync: `npx cap sync android`
4. Run in Android Studio or `adb install`

## Production Checklist

- [ ] Update version in `android/app/build.gradle`
- [ ] Update app icons
- [ ] Configure signing keys
- [ ] Test on multiple devices/screen sizes
- [ ] Test offline functionality
- [ ] Test deep links (if any)
- [ ] Build release APK
- [ ] Test release APK thoroughly
- [ ] Upload to Google Play Console

## Useful Commands

```bash
# Check Capacitor config
npx cap doctor

# List all connected devices
adb devices

# View app logs
adb logcat | grep Capacitor

# Uninstall app
adb uninstall com.timemaster.app

# Clear app data
adb shell pm clear com.timemaster.app

# Copy files from device
adb pull /sdcard/Download/file.txt

# Update Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Google Play Console](https://play.google.com/console)

## Next Steps After APK

1. **Test thoroughly** on real devices
2. **Optimize performance** using Chrome DevTools
3. **Add splash screen** and app icons
4. **Configure deep linking** if needed
5. **Set up crash reporting** (e.g., Sentry)
6. **Prepare for Play Store**:
   - Screenshots
   - Feature graphic
   - Privacy policy
   - App description

---

**Your app is now mobile-ready!** 🎉

All UI components have been optimized for mobile with:
- Responsive layouts
- Touch-friendly buttons
- Safe area insets
- Mobile-optimized navigation
- Proper font sizes
- Flexible grids

Just follow the steps above to build your APK!
