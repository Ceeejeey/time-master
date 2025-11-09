# 🔍 OAuth Diagnostic Guide

## Current Error Analysis

The error message:
```
User (role: guests) missing scopes (["account"])
GET https://sgp.cloud.appwrite.io/v1/account 401 (Unauthorized)
```

This means:
- ❌ The OAuth redirect completed, but **no session was created**
- ❌ Your browser is treating you as a "guest" (unauthenticated)
- ❌ **Cookies are NOT being set or sent** between domains

## Root Cause

You're experiencing a **Third-Party Cookie Blocking** issue:

1. Your app: `time-master-new.appwrite.network`
2. Appwrite API: `sgp.cloud.appwrite.io`
3. Browser blocks cookies from `sgp.cloud.appwrite.io` when accessed from `time-master-new.appwrite.network`

## ⚠️ CRITICAL: You MUST Complete These Steps

### Step 1: Verify Appwrite Console Platform Configuration

**This is THE MOST IMPORTANT step!**

1. Go to: https://cloud.appwrite.io/console
2. Select your project
3. Click **"Settings"** in the left sidebar
4. Scroll to **"Platforms"** section
5. **You MUST see an entry like this:**
   ```
   Name: TimeMaster Production (or any name)
   Type: Web
   Hostname: time-master-new.appwrite.network
   ```

**If you DON'T see this platform entry:**
- Click **"Add Platform"**
- Choose **"Web App"**
- Enter:
  - **Name**: `TimeMaster Production`
  - **Hostname**: `time-master-new.appwrite.network` (NO `https://`, NO trailing slash)
- Click **"Next"** and **"Create"**

**Without this platform entry, OAuth WILL NOT WORK!**

### Step 2: Check Browser Cookie Settings

Your browser might be blocking third-party cookies:

#### Chrome/Edge:
1. Settings → Privacy and security → Cookies and other site data
2. Should be set to: **"Allow all cookies"** OR **"Block third-party cookies in Incognito"**
3. **NOT**: "Block third-party cookies" (this breaks OAuth)

#### Firefox:
1. Settings → Privacy & Security
2. Enhanced Tracking Protection: **Standard** (NOT Strict)
3. Cookies and Site Data: **Don't block**

#### Safari:
1. Preferences → Privacy
2. **Uncheck** "Prevent cross-site tracking" (temporarily for testing)

### Step 3: Verify OAuth Provider Configuration

#### Google Cloud Console:
Go to: https://console.cloud.google.com/apis/credentials

Your OAuth 2.0 Client should have:

**Authorized JavaScript origins:**
```
https://time-master-new.appwrite.network
https://sgp.cloud.appwrite.io
```

**Authorized redirect URIs:**
```
https://time-master-new.appwrite.network/auth/callback
https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338
```

#### GitHub Developer Settings:
Go to: https://github.com/settings/developers

Your OAuth App should have:

**Homepage URL:**
```
https://time-master-new.appwrite.network
```

**Authorization callback URL:**
```
https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338
https://time-master-new.appwrite.network/auth/callback
```

### Step 4: Clear ALL Browser Data

**Critical: You must clear cookies for BOTH domains!**

1. Open DevTools (F12)
2. Go to **Application** tab → **Storage**
3. Click **"Clear site data"**
4. Also manually clear:
   - Right-click on `sgp.cloud.appwrite.io` under Cookies → Delete
   - Right-click on `time-master-new.appwrite.network` under Cookies → Delete
5. Close and reopen browser

### Step 5: Test in Incognito/Private Mode

1. Open an **Incognito/Private window**
2. Go to `https://time-master-new.appwrite.network`
3. Try OAuth login
4. Check if it works (fresh session, no cache)

## 🧪 Diagnostic Test

### Test 1: Check if Platform is Registered

Run this in your browser console on your app:

```javascript
// On https://time-master-new.appwrite.network
console.log('Current hostname:', window.location.hostname);
console.log('Expected:', 'time-master-new.appwrite.network');
console.log('Match:', window.location.hostname === 'time-master-new.appwrite.network');
```

### Test 2: Check Cookies After OAuth

After attempting OAuth login:

1. Open DevTools → **Application** → **Cookies**
2. Check under `sgp.cloud.appwrite.io`:
   - Should see: `a_session_*` or `fallback_*` cookies
3. Check under `time-master-new.appwrite.network`:
   - Might see session cookies here too

**If you see NO cookies after OAuth → Platform not configured or browser blocking**

### Test 3: Check Network Request

1. Open DevTools → **Network** tab
2. Try OAuth login
3. Look for request to `/v1/account`
4. Click on it → **Headers** tab
5. Check **Request Headers**:
   - Should include: `Cookie: a_session_...`
   - If NO Cookie header → cookies are blocked

## 🔧 Alternative Solutions

### Option A: Use Appwrite's Default Subdomain

Instead of custom hostname, use Appwrite's provided subdomain:

1. In Appwrite Console → Settings → check your default hostname
2. It might be something like: `690ec68b0024ca04c338.appwrite.network`
3. Update your OAuth providers to use this URL instead
4. This should work without cookie issues

### Option B: Configure Custom Domain (Requires Appwrite Pro)

Appwrite Pro supports custom domains with CNAME setup:

1. Add CNAME record: `time-master-new → your-region.cloud.appwrite.io`
2. Configure in Appwrite Console → Custom Domains
3. This properly sets cookies for your domain

See: https://appwrite.io/docs/advanced/platform/custom-domains

### Option C: Use JWT Session Method (Advanced)

If cookies don't work, use JWT tokens:

1. Store session in localStorage instead of cookies
2. Manually attach session to each request
3. Requires code changes (I can help with this)

## 📊 Expected vs Actual

### ✅ Expected Flow (Working):
```
1. Click "Login with Google"
2. Redirect to Google → Authorize
3. Redirect back to /auth/callback
4. Appwrite creates session cookie
5. Browser sends cookie with /v1/account request
6. Response: 200 OK with user data
7. Redirect to home page
8. User logged in ✓
```

### ❌ Current Flow (Broken):
```
1. Click "Login with Google"
2. Redirect to Google → Authorize
3. Redirect back to /auth/callback
4. Appwrite tries to create session cookie
5. Browser BLOCKS or DOESN'T SEND cookie ← PROBLEM
6. /v1/account request → 401 Unauthorized
7. Error: User (role: guests) missing scopes
8. Redirect back to login ✗
```

## 🎯 Quick Checklist

Go through this checklist:

- [ ] Platform added in Appwrite Console with exact hostname
- [ ] Browser allows third-party cookies (at least for testing)
- [ ] Google OAuth has correct authorized origins and redirect URIs
- [ ] GitHub OAuth has correct callback URL
- [ ] Cleared all browser cookies and cache
- [ ] Tested in Incognito/Private mode
- [ ] Checked DevTools Network tab for cookies
- [ ] Verified session cookies exist after OAuth

## 🆘 If Nothing Works

### Contact Appwrite Support

If you've completed all steps and it still doesn't work:

1. Go to: https://appwrite.io/discord
2. Join Appwrite Discord
3. Post in #support channel:

```
I'm having OAuth issues with a custom hostname on Appwrite Cloud.

Setup:
- Project ID: 690ec68b0024ca04c338
- Custom hostname: time-master-new.appwrite.network
- Region: Singapore (sgp)
- OAuth providers: Google, GitHub

Issue:
- OAuth redirect completes successfully
- But session is not created (401 Unauthorized)
- Error: "User (role: guests) missing scopes"
- Appears to be cross-domain cookie issue

I've already:
- Added platform in console with correct hostname
- Updated OAuth provider redirect URIs
- Enabled third-party cookies in browser
- Cleared cache and tested in incognito

How can I configure custom hostname to work with OAuth?
```

### Temporary Workaround

While waiting for support, use Appwrite's default hostname:

1. Find your default URL in Appwrite Console
2. Temporarily update OAuth providers to use that URL
3. This should work while you resolve the custom domain issue

## 📚 Resources

- [Appwrite Platforms Docs](https://appwrite.io/docs/getting-started-for-web#add-platform)
- [Appwrite OAuth Docs](https://appwrite.io/docs/products/auth/oauth2)
- [Custom Domains (Pro)](https://appwrite.io/docs/advanced/platform/custom-domains)
- [Appwrite Discord Support](https://appwrite.io/discord)

---

**Next Steps:**
1. Complete the checklist above
2. Test again after each step
3. If still failing, use Alternative Option A (default subdomain)
4. Or contact Appwrite support for custom domain assistance
