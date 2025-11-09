# ✅ OAuth Fix Checklist - Do These in Order

## Status: 🔴 NOT WORKING
**Error:** `User (role: guests) missing scopes` → Session not created

---

## 🎯 Fix Steps (Complete in Order)

### ☐ 1. Add Platform in Appwrite Console ⭐ MOST CRITICAL

**This is why it's not working!**

1. Open: https://cloud.appwrite.io/console
2. Select project: `690ec68b0024ca04c338`
3. Click: **Settings** (left sidebar)
4. Scroll to: **Platforms**
5. Click: **"Add Platform"**
6. Choose: **"Web App"**
7. Fill in:
   ```
   Name: TimeMaster Production
   Hostname: time-master-new.appwrite.network
   ```
   (NO `https://`, NO trailing `/`)
8. Click: **"Next"** → **"Create"**
9. ✅ Verify you see the platform listed

---

### ☐ 2. Enable Cookies in Browser ⭐ IMPORTANT

**Choose your browser:**

**Chrome/Edge:**
1. Settings → Privacy and security → Cookies
2. Select: **"Allow all cookies"** (temporarily)
3. Restart browser

**Firefox:**
1. Settings → Privacy & Security
2. Enhanced Tracking Protection: **Standard**
3. Restart browser

**Safari:**
1. Preferences → Privacy
2. **Uncheck**: "Prevent cross-site tracking" (temporarily)
3. Restart browser

---

### ☐ 3. Update Google OAuth

1. Open: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   ```
   https://time-master-new.appwrite.network
   ```
4. Under **Authorized redirect URIs**, add:
   ```
   https://time-master-new.appwrite.network/auth/callback
   ```
5. Click **SAVE**
6. ✅ Wait 5 minutes for changes to propagate

---

### ☐ 4. Update GitHub OAuth

1. Open: https://github.com/settings/developers
2. Click your OAuth App
3. Set **Homepage URL**:
   ```
   https://time-master-new.appwrite.network
   ```
4. Set **Authorization callback URL**:
   ```
   https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/690ec68b0024ca04c338
   ```
5. Click **Update application**
6. ✅ Changes are instant

---

### ☐ 5. Clear ALL Browser Data

**CRITICAL: Must clear cookies for both domains!**

1. Open your app: `https://time-master-new.appwrite.network`
2. Press **F12** (DevTools)
3. Go to: **Application** tab
4. Click: **Storage** → **Clear site data**
5. Also manually:
   - Cookies → `sgp.cloud.appwrite.io` → Delete all
   - Cookies → `time-master-new.appwrite.network` → Delete all
6. **Close browser completely**
7. ✅ Reopen browser

---

### ☐ 6. Test in Incognito/Private Mode

1. Open **new Incognito/Private window**
2. Go to: `https://time-master-new.appwrite.network`
3. Open DevTools (**F12**)
4. Go to: **Console** tab
5. Click: **"Continue with Google"** or **"Continue with GitHub"**
6. Complete OAuth flow
7. Watch console for messages

**What you should see:**
```
✅ AuthCallback: Starting authentication check...
✅ AuthCallback: Waiting for OAuth session to be established...
✅ AuthCallback: Attempt 1/5 to verify session...
✅ AuthCallback: User authenticated successfully! your-email@example.com
✅ AuthCallback: Redirecting to home page...
```

**If you still see:**
```
❌ GET https://sgp.cloud.appwrite.io/v1/account 401 (Unauthorized)
❌ AuthCallback: Attempt 1 failed: User (role: guests) missing scopes
```

→ Go to **Step 7** below

---

### ☐ 7. Verify Setup (If Still Not Working)

**A. Check Appwrite Platform:**
1. Appwrite Console → Settings → Platforms
2. You MUST see: `time-master-new.appwrite.network` listed
3. If not listed → Repeat Step 1

**B. Check Browser Cookies:**
1. DevTools (F12) → Application → Cookies
2. Look under `sgp.cloud.appwrite.io`
3. After OAuth, should see: `a_session_*` cookie
4. If NO cookie → Browser is blocking it

**C. Check Network Request:**
1. DevTools (F12) → Network tab
2. Try OAuth login
3. Find request: `/v1/account`
4. Click it → Headers → Request Headers
5. Look for: `Cookie: a_session_...`
6. If NO Cookie header → Platform not configured OR browser blocking

**D. Check OAuth Providers:**
1. Verify Google has both origins and redirect URIs
2. Verify GitHub has callback URL
3. Wait 5-10 minutes after making changes

---

## 🆘 Still Not Working?

### Option A: Use Appwrite's Default Domain (Temporary Fix)

Instead of `time-master-new.appwrite.network`, use Appwrite's default:

1. Appwrite Console → Settings
2. Look for default hostname: `690ec68b0024ca04c338.appwrite.network` or similar
3. Update OAuth providers to use this URL
4. This should work immediately without cookie issues

### Option B: Contact Appwrite Support

1. Join: https://appwrite.io/discord
2. Go to: #support channel
3. Ask:

```
Hi, I'm having OAuth issues with custom hostname.

Project: 690ec68b0024ca04c338
Hostname: time-master-new.appwrite.network
Issue: OAuth succeeds but session not created (401 Unauthorized)
Error: User (role: guests) missing scopes

I've already:
✅ Added platform in console
✅ Updated OAuth redirect URIs
✅ Enabled cookies in browser
✅ Cleared cache and tested in incognito

Please help configure custom hostname for OAuth!
```

---

## 📊 Progress Tracker

Mark what you've completed:

- [ ] Step 1: Added platform in Appwrite Console
- [ ] Step 2: Enabled cookies in browser
- [ ] Step 3: Updated Google OAuth settings
- [ ] Step 4: Updated GitHub OAuth settings
- [ ] Step 5: Cleared all browser data
- [ ] Step 6: Tested in incognito mode
- [ ] Step 7: Verified setup

**All checked?** → Should work! ✅

**Still failing?** → Use Option A or B above

---

## 🎓 What Each Step Does

| Step | Why It's Needed |
|------|----------------|
| 1. Platform | Tells Appwrite to trust your custom domain |
| 2. Cookies | Allows browser to accept cross-domain cookies |
| 3. Google | Tells Google to redirect back to your domain |
| 4. GitHub | Tells GitHub to redirect back to your domain |
| 5. Clear Data | Removes old/broken cookies |
| 6. Incognito | Tests with clean slate |
| 7. Verify | Confirms everything is configured correctly |

---

**Most Common Issue:** Forgetting Step 1 (Add Platform)
**Second Most Common:** Browser blocking cookies (Step 2)

Start with these two! 🎯
