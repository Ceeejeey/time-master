# TimeMaster Authentication Setup Guide 🔐

## Overview
TimeMaster now includes OAuth2 authentication with Google and GitHub login support using Appwrite Cloud.

## Setup Instructions

### 1. Configure OAuth Providers in Appwrite Console

#### Login to Appwrite Console
1. Go to https://cloud.appwrite.io
2. Select your project (`timemaster`)
3. Navigate to **Auth** → **Settings**

#### Enable Google OAuth
1. Click on **Google** under OAuth2 Providers
2. You'll need:
   - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com)
   - **Client Secret**: From Google Cloud Console

**Steps to get Google OAuth credentials:**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   ```
   https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338
   ```
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Appwrite Console

#### Enable GitHub OAuth
1. Click on **GitHub** under OAuth2 Providers
2. You'll need:
   - **Client ID**: Get from GitHub Developer Settings
   - **Client Secret**: From GitHub Developer Settings

**Steps to get GitHub OAuth credentials:**
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: TimeMaster
   - **Homepage URL**: `http://localhost:5173` (for dev) or your production URL
   - **Authorization callback URL**:
     ```
     https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/690ec68b0024ca04c338
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it
7. Paste both into Appwrite Console

### 2. Update Environment Variables (if needed)

Your `.env` file should already have:
```env
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=690ec68b0024ca04c338
VITE_APPWRITE_DATABASE_ID=timemaster_db
```

### 3. Test the Authentication Flow

#### Development (localhost)
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should see the login page
4. Click "Continue with Google" or "Continue with GitHub"
5. Complete the OAuth flow
6. You'll be redirected back to the app

#### Production
1. Build the app:
   ```bash
   npm run build
   ```

2. Update OAuth redirect URIs in Google/GitHub to include your production domain:
   ```
   https://your-domain.com/auth/callback
   ```

3. Update Appwrite OAuth settings with production URLs

### 4. OAuth Redirect URLs Format

For your Appwrite project, the callback URLs follow this pattern:

**Google:**
```
https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/690ec68b0024ca04c338
```

**GitHub:**
```
https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/690ec68b0024ca04c338
```

### 5. How It Works

1. **Login Flow:**
   - User clicks "Continue with Google/GitHub"
   - Redirected to OAuth provider (Google/GitHub)
   - User grants permission
   - Redirected to Appwrite callback URL
   - Appwrite creates session and redirects to `/auth/callback`
   - App checks auth state and redirects to home

2. **Protected Routes:**
   - All main routes (/, /today, /timer, etc.) are protected
   - Unauthenticated users are redirected to `/login`
   - Authentication state is managed by `AuthContext`

3. **Logout:**
   - Click user avatar in navigation
   - Select "Log out"
   - Session is deleted from Appwrite
   - User is redirected to login page

## Troubleshooting

### OAuth Not Working
1. Check that OAuth providers are enabled in Appwrite Console
2. Verify Client ID and Client Secret are correct
3. Ensure redirect URIs match exactly (no trailing slashes)
4. Check browser console for errors

### Redirect Loop
1. Clear browser cookies and localStorage
2. Check that `/auth/callback` route is properly configured
3. Verify Appwrite project ID is correct

### User Not Persisting
1. Check that session cookies are being set
2. Verify Appwrite endpoint is accessible
3. Check browser's cookie settings

## Features Implemented

✅ Google OAuth2 Login
✅ GitHub OAuth2 Login  
✅ Protected Routes
✅ User Profile Display
✅ Logout Functionality
✅ Beautiful Mobile-First Login Page
✅ Loading States
✅ Auth State Persistence
✅ User Avatar with Initials
✅ Responsive Design

## Next Steps

1. **Configure OAuth Providers** in Appwrite Console
2. **Test Login Flow** with both Google and GitHub
3. **Deploy to Production** and update OAuth redirect URLs
4. **Optional**: Add more OAuth providers (Facebook, Apple, etc.)

## Security Notes

- All authentication is handled by Appwrite Cloud
- Sessions are stored securely with HTTP-only cookies
- OAuth tokens are never exposed to the client
- User data is encrypted in transit and at rest

---

**Need Help?**
- Appwrite Docs: https://appwrite.io/docs/authentication
- OAuth2 Guide: https://appwrite.io/docs/authentication-oauth2
