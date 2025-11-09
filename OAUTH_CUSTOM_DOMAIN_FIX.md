# OAuth Custom Domain Configuration Fix

## Problem
When using a custom Appwrite hostname (`time-master-new.appwrite.network`), OAuth authentication fails with 401 Unauthorized errors because:
1. Appwrite creates session cookies for the Appwrite API domain (`sgp.cloud.appwrite.io`)
2. Your app runs on a different domain (`time-master-new.appwrite.network`)
3. Browsers block cross-domain cookies for security

## Solution

### Step 1: Configure Appwrite Platform Settings

1. **Go to Appwrite Console** → Your Project → Settings

2. **Add your custom domain to the "Platforms" section:**
   - Click "Add Platform"
   - Select "Web App"
   - Name: `TimeMaster Production`
   - Hostname: `time-master-new.appwrite.network` (without https://)
   - Click "Next" and "Create"

3. **CRITICAL: Check "Custom Domains" section (if available):**
   - Some Appwrite Cloud plans support custom domains
   - If you see a "Custom Domains" option, add `time-master-new.appwrite.network`
   - This ensures cookies are set for your domain

### Step 2: Update OAuth Provider Settings

#### For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. **Authorized JavaScript origins:**
   - Add: `https://time-master-new.appwrite.network`
   - Keep: `https://sgp.cloud.appwrite.io`
5. **Authorized redirect URIs:**
   - Add: `https://time-master-new.appwrite.network/auth/callback`
   - Add: `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338`
6. Save changes

#### For GitHub OAuth:
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Navigate to "OAuth Apps" → Your App
3. **Homepage URL:**
   - Set: `https://time-master-new.appwrite.network`
4. **Authorization callback URL:**
   - Add: `https://time-master-new.appwrite.network/auth/callback`
   - Add: `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/690ec68b0024ca04c338`
5. Update application

### Step 3: Verify Appwrite Session Settings

In Appwrite Console → Your Project → Settings → Sessions:
- Ensure "Session Length" is set appropriately (default: 365 days)
- Check "Security" tab for CORS settings
- Verify your hostname is in the allowed origins list

### Step 4: Environment Variables (Already Configured)

Your `.env` should have:
```env
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=690ec68b0024ca04c338
```

### Step 5: Code Changes (Already Applied)

The following code changes have been applied:

1. **`src/lib/appwrite.js`**: Added fallback cookie header
2. **`src/pages/AuthCallback.tsx`**: Simplified OAuth callback handling

### Step 6: Clear Browser Data and Test

1. **Clear browser cookies and cache** for both domains:
   - `time-master-new.appwrite.network`
   - `sgp.cloud.appwrite.io`

2. **Test OAuth flow:**
   - Visit `https://time-master-new.appwrite.network`
   - Click "Continue with Google" or "Continue with GitHub"
   - Authorize the app
   - You should be redirected back and logged in successfully

### Step 7: Alternative Solution (If Above Doesn't Work)

If the issue persists, you might need to use **JWT tokens** instead of session cookies:

**Option A: Use Appwrite's JWT Authentication**
- This requires more code changes but works reliably across domains
- Contact me if you need to implement this

**Option B: Use a CNAME/Custom Domain Setup**
- Point your custom domain to Appwrite using CNAME
- This requires DNS configuration
- Contact Appwrite support for assistance

## Debugging Tips

### Check Browser Console
Look for these messages:
- ✅ `AuthCallback: User authenticated successfully!`
- ❌ `401 (Unauthorized)` - Session not created

### Check Network Tab
1. Open DevTools → Network
2. Look for requests to `sgp.cloud.appwrite.io/v1/account`
3. Check "Cookies" in request headers
4. If no cookies are sent, it's a cross-domain issue

### Check Application Cookies
1. Open DevTools → Application → Cookies
2. Look for cookies under both domains:
   - `sgp.cloud.appwrite.io`
   - `time-master-new.appwrite.network`
3. After OAuth, you should see a session cookie (usually named `a_session_*`)

## What Changed in the Code

### Before (Incorrect):
- Tried to manually create session with `userId` and `secret` parameters
- These parameters don't exist in the OAuth callback URL

### After (Correct):
- Appwrite automatically creates the session during OAuth redirect
- We simply verify the session exists by calling `account.get()`
- Added fallback cookie support via `X-Fallback-Cookies` header

## Still Having Issues?

If you're still experiencing problems:

1. **Check Appwrite Cloud Plan**: Some features (custom domains) might require a paid plan
2. **Contact Appwrite Support**: They can help configure your project for custom domains
3. **Consider Self-Hosting**: Full control over domains and cookies
4. **Use the Default Domain**: Use `*.appwrite.network` subdomains which work out of the box

## Testing Checklist

- [ ] Added platform in Appwrite Console with correct hostname
- [ ] Updated Google OAuth authorized origins and redirects
- [ ] Updated GitHub OAuth callback URLs
- [ ] Cleared browser cookies and cache
- [ ] Tested Google OAuth login
- [ ] Tested GitHub OAuth login
- [ ] Verified session persists after page refresh
- [ ] Checked browser console for errors
- [ ] Verified cookies in DevTools

## Expected Behavior

1. User clicks "Continue with Google/GitHub"
2. Redirects to OAuth provider
3. User authorizes the app
4. Redirects back to `https://time-master-new.appwrite.network/auth/callback`
5. Appwrite session is created automatically
6. App verifies session via `account.get()`
7. User is redirected to home page (`/`)
8. User stays logged in on subsequent visits
