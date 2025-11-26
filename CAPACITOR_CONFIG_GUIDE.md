# capacitor.config.ts - Creation Guide

## ❌ DON'T Create It Manually

## ✅ Let Capacitor Create It

### The Right Way:

```bash
# Step 1: Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Step 2: Run init (this creates capacitor.config.ts)
npx cap init
```

When you run `npx cap init`, you'll see:

```
✔ What is the name of your app?
  … TimeMaster

✔ What should be the Package ID for your app?
  … com.timemaster.app

✔ What is the web asset directory for your app?
  … dist

✔ Creating capacitor.config.ts in /your/project/path
✔ Adding Capacitor to package.json dependencies
```

---

## What Gets Created

Capacitor automatically creates this file in your **project root**:

**`capacitor.config.ts`**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timemaster.app',
  appName: 'TimeMaster',
  webDir: 'dist'
};

export default config;
```

Location:
```
your-project/
├── capacitor.config.ts  ← Auto-created here
├── package.json
├── src/
└── dist/
```

---

## Then You Customize It

After Capacitor creates the basic file, **you add** the extra configurations:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timemaster.app',
  appName: 'TimeMaster',
  webDir: 'dist',
  
  // ADD THESE CUSTOMIZATIONS:
  bundledWebRuntime: false,
  
  server: {
    androidScheme: 'https',
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

---

## Complete Workflow

```bash
# 1. Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize (creates capacitor.config.ts)
npx cap init
# Answer prompts:
# - App name: TimeMaster
# - Package ID: com.timemaster.app
# - Web directory: dist

# 3. Manually edit capacitor.config.ts
# Add the customizations shown above

# 4. Build your web app
npm run build

# 5. Add Android platform
npx cap add android

# 6. Sync
npx cap sync android
```

---

## What Each Setting Does

```typescript
{
  appId: 'com.timemaster.app',        // Unique app identifier
  appName: 'TimeMaster',               // App name shown to users
  webDir: 'dist',                      // Build output folder
  
  bundledWebRuntime: false,            // Don't bundle Capacitor runtime
  
  server: {
    androidScheme: 'https',            // Use HTTPS for Android
    cleartext: true                     // Allow HTTP for dev
  },
  
  android: {
    allowMixedContent: true,           // HTTP + HTTPS content
    captureInput: true,                // Better keyboard handling
    webContentsDebuggingEnabled: true  // Chrome DevTools debugging
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,        // Show splash for 2s
      backgroundColor: "#0ea5a6",      // Match your brand color
      showSpinner: false,
      androidSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: "DARK",                   // Dark icons
      backgroundColor: "#0ea5a6"       // Status bar color
    }
  }
}
```

---

## Common Questions

### Q: Can I use `capacitor.config.json` instead?
**A**: Yes! You can choose during `npx cap init`. But TypeScript (`.ts`) is recommended.

### Q: What if I already created it manually?
**A**: Delete it and run `npx cap init` to let Capacitor create it properly.

### Q: Where should this file be?
**A**: In your **project root**, same level as `package.json`.

### Q: Do I need to create it before or after `npm run build`?
**A**: Before! The order is:
1. `npx cap init` (creates config)
2. `npm run build` (builds web app)
3. `npx cap add android` (creates Android project)

### Q: Will `npx cap init` overwrite my existing config?
**A**: No, if it already exists, it won't overwrite. You're safe to run it again.

---

## Verification

After running `npx cap init`, check:

```bash
# Should show the file
ls -la capacitor.config.ts

# Should show valid TypeScript
cat capacitor.config.ts
```

---

## Summary

✅ **Capacitor creates it** - Don't create manually  
✅ **Run `npx cap init`** - Answer 3 questions  
✅ **Then customize it** - Add plugin configs  
✅ **Location: project root** - Next to package.json  
✅ **Edit after creation** - Add your customizations

**The file is auto-generated, then you customize it!** 🚀
