import { Client, Account, Databases, ID, Query } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Set the session to use the same origin policy
// This is critical for cross-domain OAuth to work properly
client.headers['X-Fallback-Cookies'] = 'true';

const account = new Account(client);
const databases = new Databases(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'timemaster_db';
export const COLLECTIONS = {
  TASKS: import.meta.env.VITE_APPWRITE_COLLECTION_TASKS || 'tasks',
  SESSIONS: import.meta.env.VITE_APPWRITE_COLLECTION_SESSIONS || 'sessions',
  TODAY_PLANS: import.meta.env.VITE_APPWRITE_COLLECTION_TODAY_PLANS || 'today_plans',
  WORKPLANS: import.meta.env.VITE_APPWRITE_COLLECTION_WORKPLANS || 'workplans',
  TIMEBLOCKS: import.meta.env.VITE_APPWRITE_COLLECTION_TIMEBLOCKS || 'timeblocks',
  USER: import.meta.env.VITE_APPWRITE_COLLECTION_USER || 'user',
};

export { client, account, databases, ID, Query };

