# Google Sign-In Setup Guide

This guide walks you through setting up Google Sign-In for TimeMaster on Android.

## Prerequisites

- Google Cloud Console account
- Access to Firebase Console (optional, but recommended)
- Your app's SHA-1 fingerprint

---

## Step 1: Get Your SHA-1 Fingerprint

### Debug Keystore (for development)

```bash
cd android
./gradlew signingReport
```

Or manually:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Release Keystore (for production)

```bash
keytool -list -v -keystore /path/to/your/release-keystore.jks -alias your-key-alias
```

**Copy the SHA-1 fingerprint** - you'll need it for Google Cloud Console.

---

## Step 2: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google People API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google People API"
   - Click "Enable"

---

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (or Internal if using Google Workspace)
3. Fill in required fields:
   - App name: `TimeMaster`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

---

## Step 4: Create OAuth 2.0 Credentials

### Create Android Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select "Android" as application type
4. Fill in:
   - Name: `TimeMaster Android`
   - Package name: `com.timemaster.app`
   - SHA-1 certificate fingerprint: (paste your debug/release SHA-1)
5. Click "Create"

### Create Web Client ID (Required for server-side token verification)

1. Click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "Web application" as application type
3. Fill in:
   - Name: `TimeMaster Web`
   - Authorized JavaScript origins: (leave empty for now)
   - Authorized redirect URIs: (leave empty for now)
4. Click "Create"
5. **Copy the Client ID** - this is your `VITE_GOOGLE_CLIENT_ID`

---

## Step 5: Configure Your App

### 5.1. Create Environment Variables

Create or update `.env` in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 5.2. Update Android strings.xml

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">TimeMaster</string>
    <string name="title_activity_main">TimeMaster</string>
    <string name="package_name">com.timemaster.app</string>
    <string name="custom_url_scheme">com.timemaster.app</string>
    <!-- Google Sign-In Server Client ID (Web Client ID) -->
    <string name="server_client_id">your-web-client-id.apps.googleusercontent.com</string>
</resources>
```

### 5.3. (Optional) Add google-services.json

If you're using Firebase for other services:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or link your Google Cloud project
3. Add an Android app with package name `com.timemaster.app`
4. Download `google-services.json`
5. Place it in `android/app/google-services.json`

---

## Step 6: Sync Capacitor

After making changes, rebuild:

```bash
# Build web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio (optional)
npx cap open android
```

---

## Step 7: Test

1. Run the app on a device or emulator with Google Play Services
2. Go to the onboarding screen
3. Tap "Sign in with Google"
4. The native Google account picker should appear
5. Select an account to sign in

---

## Troubleshooting

### Error: DEVELOPER_ERROR

This usually means:
- SHA-1 fingerprint mismatch
- Wrong package name in Google Console
- Using wrong Client ID (use Web Client ID, not Android Client ID)

**Solution**: Double-check your SHA-1 and package name in Google Cloud Console.

### Error: 10 (Network Error)

- Check internet connection
- Verify Google Play Services is available on device

### Error: Sign-in cancelled

User cancelled the sign-in flow - this is expected behavior.

### Google Sign-In button not appearing

The button only shows on native platforms. In browser, users must use the name-only sign-up.

---

## Production Release Checklist

Before releasing to Play Store:

1. [ ] Create a **release** OAuth credential with release SHA-1
2. [ ] Update `strings.xml` with production Web Client ID
3. [ ] Verify OAuth consent screen is in "Published" status
4. [ ] Test on release build

---

## Architecture Overview

```
┌─────────────────────┐
│   Onboarding.tsx    │
│  (Google Sign-In    │
│     button)         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  src/lib/           │
│  google-auth.ts     │
│  (Service layer)    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  @southdevs/        │
│  capacitor-google-  │
│  auth               │
│  (Capacitor Plugin) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Android Native     │
│  Google Sign-In     │
│  (Account Picker)   │
└─────────────────────┘
```

---

## Files Modified

- `src/lib/google-auth.ts` - Google Auth service
- `src/pages/Onboarding.tsx` - Sign-in UI
- `capacitor.config.ts` - Plugin configuration
- `android/app/src/main/res/values/strings.xml` - Android config

---

## Need Help?

- [Google Sign-In Documentation](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Capacitor Google Auth Plugin](https://github.com/nicksouthdevs/capacitor-google-auth)
