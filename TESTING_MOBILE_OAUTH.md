# Testing Mobile OAuth - Step by Step

## Install APK
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Watch Logs (IMPORTANT!)
Open a terminal and run this to see what's happening:
```bash
adb logcat | grep -E "OAuth|mobile_oauth|App state|Capacitor|AuthCallback"
```

## Testing Steps

### 1. Start the app
You should see:
```
=== Mobile OAuth Detection Initialized ===
🚀 Checking OAuth status on app load...
Initial OAuth check: { success: null, timestamp: null }
```

### 2. Click "Continue with Google"
App sets flag and opens browser. Look for:
```
Initiating Google OAuth, isNative: true
```

### 3. Log in with Google in browser
After successful login, browser redirects to callback page.

### 4. Check what the browser shows

**EXPECTED:** Green success page with:
- ✅ Success icon
- "Login Successful! ✨"
- "Close this browser and return to app"

**Logs should show:**
```
AuthCallback context: { mobileOAuthInProgress: 'true', isCapacitorApp: false, ... }
✅ Mobile OAuth SUCCESS - Set flags in both storages
```

**IF YOU SEE:** Homepage in browser instead
- The `mobile_oauth_in_progress` flag is not being set
- OR the detection logic thinks it's in the app

### 5. Close browser manually
Press back button or close the tab

### 6. Return to app
App should detect you're back and check for success flag.

**EXPECTED LOGS:**
```
App state changed: ACTIVE
Checking for OAuth completion...
OAuth status: { success: 'true', timestamp: '1234567890', ... }
OAuth timestamp age: X seconds
✅ Recent OAuth detected - Status: true
🔄 Reloading app to verify session...
```

### 7. App should reload and you're logged in!

## Common Issues & Solutions

### Issue 1: Browser shows homepage instead of success page
**Problem:** Detection logic thinks it's the app
**Check logs for:**
```
AuthCallback context: { mobileOAuthInProgress: ..., isCapacitorApp: ..., ... }
```

**Should show:**
- `mobileOAuthInProgress: 'true'`
- `isCapacitorApp: false`

**If `isCapacitorApp: true`** - Protocol detection is wrong
**If `mobileOAuthInProgress: 'false' or null`** - Flag not being set in AuthContext

### Issue 2: App doesn't detect OAuth completion
**Problem:** Storage flags not shared between browser and app

**Check logs when returning to app:**
```
OAuth status: { success: null, ... }  ← BAD
OAuth status: { success: 'true', ... } ← GOOD
```

**If success is null:**
- localStorage/sessionStorage not shared
- Browser and app use different storage contexts

**Solution:** We're now setting flags in BOTH localStorage AND sessionStorage

### Issue 3: Success page shows but app still doesn't react
**Check logs when app becomes active:**
```
App state changed: ACTIVE  ← Should appear when you return
```

**If you don't see this:**
- App state listener not working
- Capacitor App plugin issue

**If you see it but no OAuth check:**
- The check logic has an error

## Debug Checklist

Run through these in order:

1. ✅ **App opens browser?**
   - YES → Continue
   - NO → Check OAuth method call

2. ✅ **Browser shows success page?**
   - YES → Continue  
   - NO → Check AuthCallback detection logic

3. ✅ **Logs show "Set flags in both storages"?**
   - YES → Continue
   - NO → Success page not detecting mobile OAuth

4. ✅ **Logs show "App state changed: ACTIVE"?**
   - YES → Continue
   - NO → App state listener not working

5. ✅ **Logs show OAuth flags found?**
   - YES → Continue
   - NO → Storage not shared between browser/app

6. ✅ **Logs show "Reloading app"?**
   - YES → Should work!
   - NO → Check timestamp/validity logic

## Manual Test (If Auto-Detection Fails)

If the app doesn't auto-detect, try manually:

1. After seeing success page in browser, close it
2. In the app, **pull down to refresh** the login page
3. The app should reload and check session

## Full Expected Log Sequence

```
# App start
=== Mobile OAuth Detection Initialized ===

# Click login
Initiating Google OAuth, isNative: true

# Browser loads callback
AuthCallback context: { mobileOAuthInProgress: 'true', isCapacitorApp: false }
✅ Mobile OAuth SUCCESS - Set flags in both storages

# Close browser, return to app
App state changed: ACTIVE
Checking for OAuth completion...
OAuth status: { success: 'true', timestamp: '...' }
✅ Recent OAuth detected - Status: true
🔄 Reloading app to verify session...

# App reloads
AuthCallback: User authenticated successfully!
```

If you see this sequence → SUCCESS! 🎉

## Quick Commands

```bash
# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Watch logs
adb logcat | grep -E "OAuth|mobile_oauth|App state"

# Clear app data (fresh start)
adb shell pm clear com.timemaster.app

# Force stop app
adb shell am force-stop com.timemaster.app

# Launch app
adb shell am start -n com.timemaster.app/.MainActivity
```
