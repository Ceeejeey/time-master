# 🚀 Quick Start - Firebase Setup

## Step 1: Enable Google Sign-In (2 minutes)

1. Go to Firebase Console: https://console.firebase.google.com/project/time-master-4c3a3/authentication/providers

2. Click **"Google"** provider

3. Toggle **"Enable"** switch

4. Click **"Save"**

**That's it for web!** You can now test web login.

## Step 2: Setup for Mobile APK (5 minutes)

### Get SHA-1 Fingerprint
```bash
cd /home/gihan/Documents/time-master/block-wise-plan/android
./gradlew signingReport
```

Look for output like:
```
Variant: debugAndroidTest
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

Copy that SHA1 hash.

### Add to Firebase

1. Go to Project Settings: https://console.firebase.google.com/project/time-master-4c3a3/settings/general

2. Scroll to "Your apps" section

3. Click Android icon or "Add app" if not exists

4. Fill in:
   - **Package name:** `com.timemaster.app`
   - **App nickname:** TimeMaster (optional)
   - **SHA-1:** Paste the hash you copied

5. Click "Register app"

6. **Download `google-services.json`**

7. Place it in: `/home/gihan/Documents/time-master/block-wise-plan/android/app/`

### Rebuild APK
```bash
cd /home/gihan/Documents/time-master/block-wise-plan
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Step 3: Create Firestore Database (2 minutes)

1. Go to Firestore: https://console.firebase.google.com/project/time-master-4c3a3/firestore

2. Click **"Create database"**

3. Choose **"Start in production mode"**

4. Select location: **asia-southeast1 (Singapore)**

5. Click **"Enable"**

6. Go to **"Rules"** tab

7. Replace with this:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
                          resource.data.userId == request.auth.uid;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == userId;
    }
  }
}
```

8. Click **"Publish"**

## Step 4: Test Web Login

```bash
cd /home/gihan/Documents/time-master/block-wise-plan
yarn dev
```

Visit http://localhost:5173

Click "Continue with Google" - should work perfectly!

## Step 5: Test Mobile Login

### Install APK
```bash
adb install -r /home/gihan/Documents/time-master/block-wise-plan/android/app/build/outputs/apk/debug/app-debug.apk
```

### Watch Logs (optional)
```bash
adb logcat | grep -E "Firebase|Auth"
```

### Test
1. Open TimeMaster app on your phone
2. Tap "Continue with Google"
3. Complete login in browser
4. App opens automatically
5. **You're logged in! 🎉**

## Optional: Enable GitHub Login

1. Create GitHub OAuth App:
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - **Application name:** TimeMaster
   - **Homepage URL:** `https://time-master-4c3a3.firebaseapp.com`
   - **Authorization callback URL:** `https://time-master-4c3a3.firebaseapp.com/__/auth/handler`
   - Click "Register application"
   - Copy **Client ID** and **Client Secret**

2. Add to Firebase:
   - Go to: https://console.firebase.google.com/project/time-master-4c3a3/authentication/providers
   - Click "GitHub"
   - Enable it
   - Paste Client ID and Client Secret
   - Save

## Troubleshooting

### "unauthorized-domain" error
**Fix:** Add localhost to authorized domains
1. Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Add `localhost`

### "Insufficient permissions" on Firestore
**Fix:** Double-check Firestore rules (Step 3 above)

### Mobile login redirects to blank page
**Fix:** Make sure you completed Step 2 (SHA-1 and google-services.json)

---

**Total Setup Time:** ~10 minutes
**Result:** Working OAuth on both web and mobile! 🚀
