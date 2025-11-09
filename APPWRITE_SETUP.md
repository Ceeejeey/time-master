# Appwrite Database Setup Instructions

## Setup Steps

You need to create the following in your Appwrite console (https://sgp.cloud.appwrite.io/console):

### 1. Create Database
- Database ID: `timemaster_db`

### 2. Create Collections

Create the following collections with these attributes:

#### Collection: `user`
Attributes:
- `name` (String, required)
- `isPremium` (Boolean, required, default: false)

#### Collection: `tasks`
Attributes:
- `title` (String, required, size: 255)
- `description` (String, required, size: 1000)
- `priorityQuadrant` (String, required, size: 100) - values: "essential_immediate", "essential_not_immediate", "not_essential_immediate", "not_essential_not_immediate"
- `assignedTimeblocks` (String, required, array: ✓, size: 10000) - **Mark as Array type in Appwrite**
- `estimatedTotalTimeMinutes` (Integer, required)
- `metadata` (String, size: 5000) - JSON object stored as string (NOT array)

#### Collection: `sessions`
Attributes:
- `taskId` (String, required, size: 100)
- `timeblockId` (String, required, size: 100)
- `startTimestamp` (String, required, size: 100) - ISO8601 timestamp
- `endTimestamp` (String, **NOT required**, size: 100) - ISO8601 timestamp - **IMPORTANT: Must be optional!**
- `productiveSeconds` (Integer, required, default: 0)
- `wastedSeconds` (Integer, required, default: 0)
- `pausePeriods` (String, array: ✓, size: 10000) - **Mark as Array type in Appwrite** - Array of JSON strings, each containing a PausePeriod object
- `completed` (Boolean, required, default: false)
- `isStopped` (Boolean, required, default: false)
- `isOnLongBreak` (Boolean, required, default: false)
- `notes` (String, **NOT required**, size: 1000)

**IMPORTANT**: If you already created this collection with `endTimestamp` as required, you need to:
1. Go to Appwrite Console → Databases → timemaster_db → sessions collection
2. Click on the `endTimestamp` attribute
3. Uncheck "Required" checkbox
4. Save changes

Indexes:
- Key: `taskId`, Type: fulltext, Attribute: `taskId`
- Key: `createdAt`, Type: fulltext, Attribute: `$createdAt`

#### Collection: `today_plans`
Attributes:
- `date` (String, required, size: 20) - Format: YYYY-MM-DD
- `targetTimeblocks` (Integer, required)
- `timeblockDuration` (Integer, required) - Duration in minutes
- `tasks` (String, required, array: ✓, size: 50000) - **Mark as Array type in Appwrite** - Array of JSON strings, each containing a TodayTask object
- `completedTimeblocks` (Integer, required, default: 0)

Indexes:
- Key: `date`, Type: key, Attribute: `date`

#### Collection: `workplans`
Attributes:
- `title` (String, required, size: 255)
- `scope` (String, required, size: 20) - values: "day", "week", "month"
- `startDate` (String, required, size: 20) - ISO8601 date
- `endDate` (String, required, size: 20) - ISO8601 date
- `tasks` (String, array: ✓, size: 10000) - **Mark as Array type in Appwrite**

#### Collection: `timeblocks`
Attributes:
- `durationMinutes` (Integer, required)
- `label` (String, required)

## Permissions

For each collection, set the following permissions:
- Read: Any
- Create: Any
- Update: Any
- Delete: Any

(Note: In production, you should implement proper user authentication and restrict these permissions)

## Environment Variables

Make sure your `.env` file has:
```
VITE_APPWRITE_PROJECT_ID=690ec68b0024ca04c338
VITE_APPWRITE_PROJECT_NAME=New project
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_DATABASE_ID=timemaster_db
VITE_APPWRITE_COLLECTION_TASKS=tasks
VITE_APPWRITE_COLLECTION_SESSIONS=sessions
VITE_APPWRITE_COLLECTION_TODAY_PLANS=today_plans
VITE_APPWRITE_COLLECTION_WORKPLANS=workplans
VITE_APPWRITE_COLLECTION_TIMEBLOCKS=timeblocks
VITE_APPWRITE_COLLECTION_USER=user
```
