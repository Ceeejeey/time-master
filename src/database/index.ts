import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME, CREATE_TABLES } from './schema';

class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null; // Singleton promise for initialization

  constructor() {
    // Don't initialize SQLiteConnection here - wait for initialize()
  }

  private async getSQLiteConnection(): Promise<SQLiteConnection> {
    if (!this.sqlite) {
      console.log('[DatabaseService] Creating SQLiteConnection...');
      
      // Ensure we're on a platform that supports SQLite
      const platform = Capacitor.getPlatform();
      console.log('[DatabaseService] Platform check:', platform);
      
      // Check if plugin is available
      const isAvailable = await Capacitor.isPluginAvailable('CapacitorSQLite');
      console.log('[DatabaseService] CapacitorSQLite plugin available:', isAvailable);
      
      if (!isAvailable) {
        const error = 'CapacitorSQLite plugin not available. Platform: ' + platform;
        console.error('[DatabaseService]', error);
        throw new Error(error);
      }
      
      // Wait for Capacitor to be ready on native platforms
      if (platform === 'android' || platform === 'ios') {
        console.log('[DatabaseService] Waiting for native platform to be ready...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!CapacitorSQLite) {
        const error = 'CapacitorSQLite plugin object is null. Platform: ' + platform;
        console.error('[DatabaseService]', error);
        throw new Error(error);
      }
      
      console.log('[DatabaseService] CapacitorSQLite object:', typeof CapacitorSQLite);
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      console.log('[DatabaseService] ✓ SQLiteConnection created');
    }
    return this.sqlite;
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      console.log('[DatabaseService] Already initialized, skipping...');
      return;
    }
    
    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      console.log('[DatabaseService] Initialization in progress, waiting...');
      return this.initializationPromise;
    }
    
    // Start initialization and store the promise
    this.initializationPromise = this.doInitialize();
    
    try {
      await this.initializationPromise;
    } catch (error) {
      // Reset promise on failure so retry is possible
      this.initializationPromise = null;
      throw error;
    }
  }
  
  private async doInitialize(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      console.log('[DatabaseService] Initializing database on platform:', platform);

      // 1. Get SQLite Connection Helper
      const sqlite = await this.getSQLiteConnection();

      // 2. Web Store (if applicable)
      if (platform === 'web') {
        const jeepSqliteEl = document.querySelector('jeep-sqlite');
        if (jeepSqliteEl) {
          await sqlite.initWebStore();
        }
      }

      // 3. Check for Existing Connection (PREVENT 'already exists' ERROR)
      console.log('[DatabaseService] Checking existing connections...');
      const consistency = await sqlite.checkConnectionsConsistency({ 
        dbNames: [DB_NAME], 
        openModes: ['RW'], // ReadWrite
      });
      console.log('[DatabaseService] Connection consistency:', consistency);

      const isConn = await sqlite.isConnection(DB_NAME, false);
      console.log('[DatabaseService] Is connection present:', isConn.result);

      if (isConn.result) {
        console.log('[DatabaseService] Connection exists, verifying state...');
        // Retrieve existing connection
        this.db = await sqlite.retrieveConnection(DB_NAME, false);
        
        // If retrieved, check if open. 
        // Note: retrieveConnection usually returns an open connection handle or allows us to use it.
        // We'll try to check isDBOpen if possible, or just proceed.
        const isOpen = await this.db.isDBOpen();
        if (!isOpen.result) {
             console.log('[DatabaseService] Existing connection found but closed. Opening...');
             await this.db.open();
        }
      } else {
        // Create new connection
        console.log('[DatabaseService] Creating NEW connection to:', DB_NAME);
        this.db = await sqlite.createConnection(
          DB_NAME,
          false, // encrypted
          'no-encryption',
          1, // version
          false // readonly
        );
        
        // Open it
        console.log('[DatabaseService] Opening database connection...');
        await this.db.open();
      }
      
      console.log('[DatabaseService] ✓ Database connection ready');

      // 4. Create Tables (Idempotent)
      console.log('[DatabaseService] Ensuring tables exist...');
      await this.db.execute(CREATE_TABLES);
      
      this.isInitialized = true;
      console.log('[DatabaseService] ✓ Initialization complete');
    } catch (error) {
      console.error('[DatabaseService] ✗ Error initializing database:', error);
      // Even if init fails, if we have a db object, we might still be okay? 
      // No, re-throw to let app know.
      throw error;
    }
  }

  async getDb(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(sql: string, values: any[] = []): Promise<any> {
    const db = await this.getDb();
    return await db.query(sql, values);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async run(sql: string, values: any[] = []): Promise<any> {
    const db = await this.getDb();
    console.log('[DatabaseService] Executing SQL:', sql.substring(0, 50) + '...', 'Values:', values.length);
    const result = await db.run(sql, values);
    console.log('[DatabaseService] ✓ SQL executed, changes:', result.changes?.changes);
    return result;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
