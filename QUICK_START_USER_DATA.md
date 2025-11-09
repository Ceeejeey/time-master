# Quick Start: Add userId to Appwrite Collections

## 🎯 What You Need to Do

You need to add a `userId` attribute to **4 collections** in Appwrite. Here's exactly how:

---

## 📍 Step 1: Open Appwrite Console

1. Go to: **https://cloud.appwrite.io**
2. Click on your project: **`timemaster`**
3. In left sidebar: **Databases** → **`timemaster_db`**

---

## 📍 Step 2: Add userId to Each Collection

Repeat these steps for **each** of the 4 collections:

### Collections to Update:
1. ✅ `tasks`
2. ✅ `workplans`
3. ✅ `sessions`
4. ✅ `today_plans`

### For Each Collection:

#### A. Add Attribute

1. Click on the collection name
2. Go to **Attributes** tab
3. Click **+ Create Attribute**
4. Select **String**
5. Fill in:
   ```
   Attribute Key: userId
   Size: 255
   Required: ✅ (check the box)
   Array: ❌ (leave unchecked)
   Default Value: (leave empty)
   ```
6. Click **Create**
7. Wait for it to show "Available" status

#### B. Add Index

1. Go to **Indexes** tab (same collection)
2. Click **+ Create Index**
3. Fill in:
   ```
   Index Key: userId_index
   Index Type: Key
   Attributes: userId (select from dropdown)
   Order: ASC
   ```
4. Click **Create**

---

## 📍 Step 3: Extra Index for today_plans

**Only for `today_plans` collection**, add ONE MORE index:

1. In **today_plans** collection
2. Go to **Indexes** tab
3. Click **+ Create Index**
4. Fill in:
   ```
   Index Key: userId_date_index
   Index Type: Key
   Attributes: userId, date (select both from dropdown)
   Order: ASC, ASC
   ```
5. Click **Create**

---

## 📍 Step 4: Clean Up Old Data (Optional)

If you have any test data from before authentication:

1. Go to each collection
2. Click **Documents** tab
3. Delete all old documents (they don't have userId)

**OR** keep them by manually adding userId field to each document

---

## 📍 Step 5: Test Your App

1. **Clear browser data**:
   - Press F12 (DevTools)
   - Application tab → Clear storage

2. **Login**:
   - Go to http://localhost:8080
   - Click "Continue with Google" or "Continue with GitHub"

3. **Create test data**:
   - Create a task
   - Create a workplan
   - Start a timer

4. **Test isolation**:
   - Logout
   - Login with different account
   - Verify you see empty state (not the first user's data)

---

## ✅ Checklist

- [ ] Added `userId` attribute to `tasks` collection
- [ ] Added index `userId_index` to `tasks` collection
- [ ] Added `userId` attribute to `workplans` collection
- [ ] Added index `userId_index` to `workplans` collection
- [ ] Added `userId` attribute to `sessions` collection
- [ ] Added index `userId_index` to `sessions` collection
- [ ] Added `userId` attribute to `today_plans` collection
- [ ] Added index `userId_index` to `today_plans` collection
- [ ] Added composite index `userId_date_index` to `today_plans` collection
- [ ] Deleted or migrated old test data
- [ ] Tested login with first user
- [ ] Created test data for first user
- [ ] Tested login with second user
- [ ] Verified second user can't see first user's data

---

## 🎉 Done!

Once all checkboxes above are ✅, your app will have complete multi-user support!

Each user will only see their own:
- Tasks
- Workplans
- Timer Sessions
- Today Plans
- Reports (calculated from their sessions)

---

## 🆘 Need Help?

### Error: "Attribute userId does not exist"
**You haven't added the userId attribute yet. Go back to Step 2.**

### Error: "Document missing required attribute"
**Old documents exist without userId. Go to Step 4 and clean them up.**

### Still seeing other users' data?
**Make sure you added the indexes in Step 2B. Indexes are crucial for filtering.**

---

## 📸 Visual Guide

### What the Appwrite Console should look like:

**Attributes Tab**:
```
┌──────────────────────────────────────┐
│ Attributes                           │
├──────────────────────────────────────┤
│ ✅ userId (String, 255)   Required  │
│ ✅ title (String, 255)    Required  │
│ ✅ description (String, 1000)        │
│ ... other attributes ...             │
└──────────────────────────────────────┘
```

**Indexes Tab**:
```
┌──────────────────────────────────────┐
│ Indexes                              │
├──────────────────────────────────────┤
│ ✅ userId_index (Key: userId ASC)   │
│ ... other indexes ...                │
└──────────────────────────────────────┘
```

**For today_plans only**:
```
┌──────────────────────────────────────┐
│ Indexes                              │
├──────────────────────────────────────┤
│ ✅ userId_index (Key: userId ASC)   │
│ ✅ userId_date_index                │
│    (Key: userId ASC, date ASC)      │
└──────────────────────────────────────┘
```

---

**That's it! Follow these steps and you're ready to go!** 🚀
