import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME, CREATE_TABLES } from './schema';

class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

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
    if (this.isInitialized) {
      console.log('[DatabaseService] Already initialized, skipping...');
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      console.log('[DatabaseService] Initializing database on platform:', platform);

      // Get or create SQLiteConnection (now returns Promise)
      const sqlite = await this.getSQLiteConnection();

      if (platform === 'web') {
        // For web, check if jeep-sqlite is available
        const jeepSqliteEl = document.querySelector('jeep-sqlite');
        if (jeepSqliteEl) {
          console.log('[DatabaseService] Initializing web store...');
          await sqlite.initWebStore();
          console.log('[DatabaseService] ✓ Web store initialized');
        } else {
          console.warn('[DatabaseService] jeep-sqlite not found, skipping web store init');
        }
      }

      // Create database connection
      console.log('[DatabaseService] Creating connection to:', DB_NAME);
      this.db = await sqlite.createConnection(
        DB_NAME,
        false, // encrypted
        'no-encryption',
        1, // version
        false // readonly
      );

      // Open connection
      console.log('[DatabaseService] Opening database connection...');
      await this.db.open();
      console.log('[DatabaseService] ✓ Database connection opened successfully');

      // Create tables
      console.log('[DatabaseService] Creating tables...');
      const result = await this.db.execute(CREATE_TABLES);
      console.log('[DatabaseService] ✓ Tables created successfully:', result);

      // Verify tables were created
      const tables = await this.db.query(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        []
      );
      console.log('[DatabaseService] ✓ Existing tables:', tables.values?.map((t: { name: string }) => t.name));

      this.isInitialized = true;
      console.log('[DatabaseService] ✓ Database initialization complete');
    } catch (error) {
      console.error('[DatabaseService] ✗ Error initializing database:', error);
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
