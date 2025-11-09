# Quick Fix Summary - OAuth Cross-Domain Issue

## 🔴 The Problem
Your OAuth login is failing because:
- App hosted at: `time-master-new.appwrite.network`
- Appwrite API at: `sgp.cloud.appwrite.io`
- **Browser is blocking cross-domain cookies**
- Result: 401 Unauthorized errors after OAuth redirect
- Error: `User (role: guests) missing scopes (["account"])`

## ✅ Code Changes Applied (Already Done)

### 1. Updated `src/lib/appwrite.js`
- Added fallback cookie header
- Added fetch interceptor to include credentials

### 2. Updated `src/pages/AuthCallback.tsx`
- Increased wait time for session establishment
- Added retry logic (5 attempts)
- Better error messages

### 3. Updated `src/pages/Login.tsx`
- Added error display when authentication fails

## � CRITICAL STEPS (You MUST Do These)

### ⭐ STEP 1: Configure Appwrite Console Platform (MOST IMPORTANT!)

**This is the #1 reason OAuth fails. You MUST do this:**

1. Go to https://cloud.appwrite.io/console
2. Select your project (`690ec68b0024ca04c338`)
3. Click **"Settings"** (left sidebar)
4. Scroll to **"Platforms"** section
5. Click **"Add Platform"**
6. Select **"Web App"**
7. Enter:
   - **Name**: `TimeMaster Production`
   - **Hostname**: `time-master-new.appwrite.network`
     - ❌ NOT: `https://time-master-new.appwrite.network`
     - ❌ NOT: `time-master-new.appwrite.network/`
     - ✅ YES: `time-master-new.appwrite.network`
8. Click **"Next"** and **"Create"**

**Without this, OAuth WILL NOT WORK!**

### STEP 2: Check Browser Cookie Settings

Your browser might be blocking third-party cookies:

**Chrome/Edge:**
- Settings → Privacy → Cookies
- Set to: "Allow all cookies" (for testing)

**Firefox:**
- Settings → Privacy & Security
- Enhanced Tracking Protection: **Standard** (not Strict)

**Safari:**
- Preferences → Privacy
- Temporarily **uncheck** "Prevent cross-site tracking"

### STEP 3: Update Google OAuth Settings
1. Go to https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. **Authorized JavaScript origins** - ADD both:
   ```
   https://time-master-new.appwrite.network
   https://sgp.cloud.appwrite.io
   ```
4. **Authorized redirect URIs** - ADD both:
   ```
   https://time-master-new.appwrite.network/auth/callback
   https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338
   ```
5. Click **Save**

### STEP 4: Update GitHub OAuth Settings
1. Go to https://github.com/settings/developers
2. Select your OAuth App
3. **Homepage URL**:
   ```
   https://time-master-new.appwrite.network
   ```
4. **Authorization callback URL** - ADD both:
   ```
   https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/690ec68b0024ca04c338
   https://time-master-new.appwrite.network/auth/callback
   ```
5. Click **Update application**

### STEP 5: Clear Browser Data & Test

**IMPORTANT: Clear cookies for BOTH domains!**

1. Open DevTools (F12)
2. Application tab → Storage → **"Clear site data"**
3. Manually delete cookies:
   - `sgp.cloud.appwrite.io`
   - `time-master-new.appwrite.network`
4. **Close browser completely**
5. Reopen and test

### STEP 6: Test in Incognito Mode

1. Open Incognito/Private window
2. Visit `https://time-master-new.appwrite.network`
3. Try OAuth login
4. Check console for errors

## 🧪 How to Verify It's Working

### Check Console Logs:
```
✅ AuthCallback: Attempt 1/5 to verify session...
✅ AuthCallback: User authenticated successfully! user@example.com
✅ AuthCallback: Redirecting to home page...
```

### Check Network Tab:
1. DevTools → Network
2. Look for `/v1/account` request
3. Check Headers → Request Headers
4. Should see: `Cookie: a_session_...`

### Check Cookies:
1. DevTools → Application → Cookies
2. Under `sgp.cloud.appwrite.io`:
   - Should see `a_session_*` cookie after OAuth

## 🔄 Alternative: Use Appwrite's Default Domain

If custom domain doesn't work, temporarily use Appwrite's default:

1. Appwrite Console → Settings
2. Find your default hostname: `690ec68b0024ca04c338.appwrite.network` (or similar)
3. Update OAuth providers to use this URL instead
4. Update your code's `window.location.origin` references

This should work without cookie issues while you resolve custom domain setup.

## 🐛 Still Not Working?

See detailed diagnostics: **`OAUTH_DIAGNOSTIC.md`**

### Quick Debug Commands:

**In browser console on your app:**
```javascript
// Check current location
console.log(window.location.hostname);

// Try to get account (should fail with 401)
fetch('https://sgp.cloud.appwrite.io/v1/account', {
  credentials: 'include',
  headers: {
    'x-appwrite-project': '690ec68b0024ca04c338'
  }
}).then(r => r.json()).then(console.log);
```

### Get Help:

1. **Appwrite Discord**: https://appwrite.io/discord
2. **GitHub Discussions**: https://github.com/appwrite/appwrite/discussions
3. **Check** `OAUTH_DIAGNOSTIC.md` for detailed troubleshooting

## 📝 What to Tell Appwrite Support (if needed)

> "I'm using custom hostname `time-master-new.appwrite.network` on Appwrite Cloud (Singapore region, project `690ec68b0024ca04c338`). OAuth completes but session isn't created - getting 401 with 'User (role: guests) missing scopes'. Cookies appear blocked cross-domain. Platform is configured in console. How do I enable cookie sharing between my hostname and sgp.cloud.appwrite.io?"

## 🎯 Expected Flow (After Fix)

1. User clicks "Continue with Google/GitHub" ✓
2. Redirects to OAuth provider ✓
3. User authorizes ✓
4. Redirects to `https://time-master-new.appwrite.network/auth/callback` ✓
5. **Appwrite creates session cookie** ← Should work after STEP 1
6. App verifies session (5 retry attempts) ✓
7. User redirected to home page ✓
8. User stays logged in ✓

---

**Priority Actions:**
1. ⭐ **MUST:** Add platform in Appwrite Console
2. ⭐ **MUST:** Allow third-party cookies in browser (for testing)
3. Update OAuth provider redirect URIs
4. Clear all browser data
5. Test in incognito mode
