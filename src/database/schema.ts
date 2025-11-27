export const DB_NAME = 'timemasterDB';
export const DB_VERSION = 1;

export const CREATE_TABLES = `
  -- User Profile Table
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    profilePic TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Tasks Table
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priorityQuadrant TEXT,
    estimatedTotalTimeMinutes INTEGER DEFAULT 0,
    metadata TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Timeblocks Table
  CREATE TABLE IF NOT EXISTS timeblocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    durationMinutes INTEGER NOT NULL,
    label TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Workplans Table
  CREATE TABLE IF NOT EXISTS workplans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    scope TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    tasks TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Timer Sessions Table
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId TEXT NOT NULL,
    timeblockId TEXT NOT NULL,
    startTimestamp TEXT NOT NULL,
    endTimestamp TEXT,
    productiveSeconds INTEGER DEFAULT 0,
    wastedSeconds INTEGER DEFAULT 0,
    pausePeriods TEXT,
    completed INTEGER DEFAULT 0,
    isStopped INTEGER DEFAULT 0,
    isOnLongBreak INTEGER DEFAULT 0,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Today Plans Table
  CREATE TABLE IF NOT EXISTS today_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    targetTimeblocks INTEGER DEFAULT 8,
    timeblockDuration INTEGER DEFAULT 25,
    tasks TEXT,
    completedTimeblocks INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;
