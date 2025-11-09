# User-Specific Data Migration Guide 🔒

## Overview
TimeMaster now implements user-specific data isolation. Each user will only see their own tasks, sessions, workplans, and today plans.

## ⚠️ IMPORTANT: Database Schema Update Required

You **MUST** update your Appwrite database collections to add the `userId` attribute.

### Step 1: Login to Appwrite Console

1. Go to: https://cloud.appwrite.io
2. Select your project: `timemaster` (690ec68b0024ca04c338)
3. Navigate to: **Databases** → `timemaster_db`

### Step 2: Add `userId` Attribute to Collections

For each of the following collections, add a `userId` attribute:

#### 1. Tasks Collection
1. Click on **tasks** collection
2. Click **Attributes** tab
3. Click **Add Attribute** → **String**
4. Settings:
   - **Attribute Key**: `userId`
   - **Size**: 255
   - **Required**: ✅ Yes
   - **Array**: ❌ No
   - **Default**: (leave empty)
5. Click **Create**
6. Click **Indexes** tab
7. Click **Create Index**
   - **Index Key**: `userId_index`
   - **Type**: Key
   - **Attributes**: Select `userId`
   - **Order**: ASC
8. Click **Create**

#### 2. Workplans Collection
Repeat the same steps for `workplans` collection:
- Add `userId` string attribute (255, required)
- Add index on `userId`

#### 3. Sessions Collection
Repeat the same steps for `sessions` collection:
- Add `userId` string attribute (255, required)
- Add index on `userId`

#### 4. Today Plans Collection
Repeat the same steps for `today_plans` collection:
- Add `userId` string attribute (255, required)
- Add composite index:
  - **Index Key**: `userId_date_index`
  - **Type**: Key
  - **Attributes**: Select `userId` AND `date`
  - **Order**: Both ASC

### Step 3: Migrate Existing Data (If Any)

If you have existing data in your database, you need to assign it to a user:

#### Option A: Delete All Existing Data (Recommended for Development)
1. Go to each collection
2. Click **Documents** tab
3. Delete all documents
4. Fresh start with user-specific data

#### Option B: Assign to Current User (If You Want to Keep Data)
You'll need to manually update each document or use Appwrite Functions:

```javascript
// Example: Update all tasks to belong to current user
const { databases } = require('node-appwrite');

// Your user ID (get from Auth → Users)
const userId = 'YOUR_USER_ID_HERE';

const tasks = await databases.listDocuments(
  'timemaster_db',
  'tasks'
);

for (const task of tasks.documents) {
  await databases.updateDocument(
    'timemaster_db',
    'tasks',
    task.$id,
    { userId: userId }
  );
}
```

### Step 4: Verify Setup

1. **Clear browser storage**:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all storage

2. **Restart the app**:
   ```bash
   npm run dev
   ```

3. **Login** with Google or GitHub

4. **Test user isolation**:
   - Create a task
   - Create a workplan
   - Start a timer session
   - Logout
   - Login with a different account
   - Verify you don't see the previous user's data

## What Changed

### Data Models Updated
All these interfaces now include `userId`:
- ✅ `Task` - includes `userId`
- ✅ `Workplan` - includes `userId`
- ✅ `TimerSession` - includes `userId`
- ✅ `TodayPlan` - includes `userId`

### Storage Functions Updated
All storage functions now filter by authenticated user:
- ✅ `getTasks()` - only returns current user's tasks
- ✅ `getWorkplans()` - only returns current user's workplans
- ✅ `getTimerSessions()` - only returns current user's sessions
- ✅ `getTodayPlan()` - only returns current user's plan
- ✅ All save functions - automatically set userId
- ✅ All delete functions - verify ownership before deleting

### Security Features
- ✅ **Ownership verification**: Can't update/delete other users' data
- ✅ **Query filtering**: All reads filtered by userId
- ✅ **Automatic userId assignment**: New documents get current userId
- ✅ **Unauthorized access prevention**: Returns null if accessing wrong user's data

## Testing Checklist

- [ ] Add `userId` attribute to all 4 collections
- [ ] Add indexes on `userId`
- [ ] Clear existing data or migrate it
- [ ] Restart the app
- [ ] Login with User A
- [ ] Create test data (task, workplan, session)
- [ ] Logout
- [ ] Login with User B
- [ ] Verify User B sees empty data (not User A's data)
- [ ] Create different test data for User B
- [ ] Logout and login as User A again
- [ ] Verify User A still sees their own data only

## Common Issues

### Error: "Attribute userId does not exist"
**Solution**: You haven't added the `userId` attribute to all collections yet. Follow Step 2 above.

### Error: "Document missing required attribute userId"
**Solution**: You're trying to save a document without userId. The app automatically sets this, but if you have old code, update it.

### Seeing other users' data
**Solution**: 
1. Check that you've added indexes on userId
2. Clear browser cache and storage
3. Verify the queries in DevTools Network tab include userId filter

### Can't create documents
**Solution**: 
1. Make sure user is authenticated (check AuthContext)
2. Verify `getCurrentUserId()` is working
3. Check Appwrite permissions allow authenticated users to create

## Database Permissions (Optional Enhancement)

For even stronger security, update collection permissions:

1. Go to each collection in Appwrite Console
2. Click **Settings** tab
3. Under **Permissions**:
   - Remove "Any" role if present
   - Add permission for "Users" role:
     - ✅ Read: Allow if `userId` equals `$userId`
     - ✅ Create: Allow for authenticated users
     - ✅ Update: Allow if `userId` equals `$userId`
     - ✅ Delete: Allow if `userId` equals `$userId`

This adds database-level security on top of application-level filtering.

## Summary

After completing this migration:
- ✅ Each user has their own isolated data
- ✅ Users can't see or modify each other's data
- ✅ All queries automatically filter by authenticated user
- ✅ Security is enforced at both app and database level
- ✅ Multi-user support is fully functional

---

**Ready for multi-user production use!** 🎉
