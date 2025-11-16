# 🚀 Quick Start: Build Your Android APK

## Prerequisites Check

```bash
# Check Node.js (need 16+)
node --version

# Check npm
npm --version

# Check if Android Studio is installed
# Open Android Studio and check SDK is installed
```

## 5-Minute Setup

### 1. Install Capacitor (1 min)

```bash
cd /home/gihan/Documents/time-master/block-wise-plan

npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/app
```

### 2. Initialize Capacitor (30 sec)

```bash
npx cap init

# Answer prompts:
# App name: TimeMaster
# App ID: com.timemaster.app
# Web directory: dist
```

### 3. Build Web App (1 min)

```bash
npm run build
```

### 4. Add Android Platform (1 min)

```bash
npx cap add android
```

### 5. Sync Code (30 sec)

```bash
npx cap sync android
```

### 6. Open in Android Studio (30 sec)

```bash
npx cap open android
```

### 7. Build APK in Android Studio (1 min)

In Android Studio:
1. Wait for Gradle sync to complete
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to finish
4. Click "locate" in the notification

**APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Install on Phone

### Method 1: USB Cable

```bash
# Enable USB Debugging on your phone first!
# Settings → About Phone → Tap Build Number 7 times
# Settings → Developer Options → Enable USB Debugging

# Connect phone and run:
adb devices  # Should see your device

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: File Transfer

1. Copy `app-debug.apk` to your phone
2. Open file on phone
3. Allow "Install from unknown sources"
4. Install

---

## Development Workflow

Every time you make changes:

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Rebuild in Android Studio or:
cd android && ./gradlew assembleDebug
```

---

## Common Issues & Fixes

### ❌ "Command not found: npx"
**Fix:** Update npm
```bash
npm install -g npm@latest
```

### ❌ "JAVA_HOME not set"
**Fix:** Install JDK 17 and set environment variable

### ❌ "Android SDK not found"
**Fix:** Open Android Studio → SDK Manager → Install latest SDK

### ❌ White screen on app launch
**Fix:** Check Logcat in Android Studio:
```bash
adb logcat | grep Capacitor
```

### ❌ App doesn't update
**Fix:** Always sync after building:
```bash
npm run build && npx cap sync android
```

---

## Configuration Files Created

Capacitor will create:
- `capacitor.config.ts` - Main config
- `android/` - Android project folder

### Recommended `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timemaster.app',
  appName: 'TimeMaster',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
```

---

## File Structure After Setup

```
block-wise-plan/
├── android/                    # ← Android project
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── gradle/
├── capacitor.config.ts         # ← Capacitor config
├── dist/                       # ← Built web app
├── src/                        # Your source code
├── package.json
└── ...
```

---

## Testing

### On Computer (Chrome DevTools)

1. Open in browser: `http://localhost:5173`
2. Press **F12** → **Toggle Device Toolbar** (Ctrl+Shift+M)
3. Select mobile device from dropdown
4. Test all pages

### On Real Device

1. Build and install APK (steps above)
2. Open app on phone
3. Test all features
4. Check for any layout issues

---

## Production APK (For Play Store)

### 1. Create Keystore

```bash
keytool -genkey -v -keystore my-release-key.keystore \
  -alias timemaster -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure in `android/app/build.gradle`

Add above `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android {`, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 3. Create `android/key.properties`

```properties
storePassword=yourStorePassword
keyPassword=yourKeyPassword
keyAlias=timemaster
storeFile=../my-release-key.keystore
```

### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

**APK**: `android/app/build/outputs/apk/release/app-release.apk`

---

## Quick Commands Reference

```bash
# Doctor (check setup)
npx cap doctor

# Sync everything
npx cap sync

# Sync just Android
npx cap sync android

# Open Android Studio
npx cap open android

# Build web app
npm run build

# Install on connected device
adb install path/to/app.apk

# Uninstall from device
adb uninstall com.timemaster.app

# View logs
adb logcat | grep Capacitor
```

---

## Performance Tips

1. **Always build production version:**
   ```bash
   npm run build  # Uses production mode
   ```

2. **Enable Proguard** (shrinks APK):
   In `android/app/build.gradle`:
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
       }
   }
   ```

3. **Optimize images** before building

4. **Test on low-end devices** too

---

## Resources

- 📚 [Capacitor Docs](https://capacitorjs.com/docs)
- 📱 [Android Studio](https://developer.android.com/studio)
- 🎨 [Material Design](https://material.io/)
- 📊 [Google Play Console](https://play.google.com/console)

---

## Support

If you encounter issues:

1. Check `npx cap doctor` output
2. Review Android Studio Logcat
3. Search [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
4. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)

---

## ✅ You're Ready!

Your TimeMaster app is:
- ✅ Fully responsive for mobile
- ✅ Touch-optimized
- ✅ Safe area compatible
- ✅ Ready for Capacitor conversion

**Just run the 7 steps above and you'll have your APK!** 🎉

---

**Build time:** ~5-10 minutes (first time)  
**APK size:** ~5-10 MB  
**Minimum Android:** API 22 (Android 5.1)
