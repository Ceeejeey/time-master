import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Define the plugin interface
interface TimerNotificationPlugin {
  startService(options: {
    taskTitle: string;
    productiveTime: string;
    targetTime: string;
    wastedTime: string;
    isPaused: boolean;
    progressPercent: number;
  }): Promise<void>;
  updateService(options: {
    taskTitle: string;
    productiveTime: string;
    targetTime: string;
    wastedTime: string;
    isPaused: boolean;
    progressPercent: number;
  }): Promise<void>;
  stopService(): Promise<void>;
  addListener(
    eventName: 'timerAction',
    listenerFunc: (data: { action: string }) => void
  ): Promise<{ remove: () => void }>;
}

// Register the native plugin
const TimerNotification = registerPlugin<TimerNotificationPlugin>('TimerNotification');

interface TimerNotificationData {
  taskTitle: string;
  productiveTime: string;
  targetTime: string;
  wastedTime: string;
  isPaused: boolean;
  progressPercent: number;
}

class TimerNotificationService {
  private isInitialized = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private currentData: TimerNotificationData | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;
  private isAppInForeground = true;
  private isServiceRunning = false;
  private listenerHandle: { remove: () => void } | null = null;
  
  // Data getter function — uses refs externally for always-fresh values
  private dataGetter: (() => TimerNotificationData | null) | null = null;
  
  // Track last update timestamp to detect stuck intervals
  private lastUpdateTime = 0;

  async initialize() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) return;

    try {
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        console.warn('[TimerNotification] Permission not granted');
      }

      App.addListener('appStateChange', ({ isActive }) => {
        this.isAppInForeground = isActive;
        
        if (isActive) {
          console.log('[TimerNotification] App in foreground');
          // When returning to foreground, force an immediate update
          // and restart the interval (it may have been throttled by Android)
          if (this.dataGetter) {
            const data = this.dataGetter();
            if (data) {
              this.updateNotification(data);
            }
            // Restart interval to recover from throttling
            this.restartInterval();
          }
        } else if (this.currentData && !this.currentData.isPaused) {
          this.startOrUpdateService(this.currentData);
          console.log('[TimerNotification] App in background, service running');
        }
      });

      this.listenerHandle = await TimerNotification.addListener('timerAction', (data) => {
        console.log('[TimerNotification] Action received:', data.action);
        if (data.action === 'pause' && this.onPauseCallback) {
          this.onPauseCallback();
        } else if (data.action === 'resume' && this.onResumeCallback) {
          this.onResumeCallback();
        }
      });

      this.isInitialized = true;
      console.log('[TimerNotification] Initialized successfully');
    } catch (error) {
      console.error('[TimerNotification] Failed to initialize:', error);
    }
  }

  setCallbacks(onPause: () => void, onResume: () => void) {
    this.onPauseCallback = onPause;
    this.onResumeCallback = onResume;
  }

  private async startOrUpdateService(data: TimerNotificationData) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (!this.isServiceRunning) {
        await TimerNotification.startService(data);
        this.isServiceRunning = true;
        console.log('[TimerNotification] Service started');
      } else {
        await TimerNotification.updateService(data);
      }
    } catch (error) {
      console.error('[TimerNotification] Failed to start/update service:', error);
    }
  }

  async updateNotification(data: TimerNotificationData) {
    this.currentData = data;
    // Always start/update the foreground service when timer is active
    await this.startOrUpdateService(data);
  }

  async stopService() {
    if (!Capacitor.isNativePlatform() || !this.isServiceRunning) return;

    try {
      await TimerNotification.stopService();
      this.isServiceRunning = false;
      console.log('[TimerNotification] Service stopped');
    } catch (error) {
      console.error('[TimerNotification] Failed to stop service:', error);
    }
  }

  /**
   * Restart the notification interval (e.g., after returning from background).
   * Clears old interval and creates a fresh one.
   */
  private restartInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.createInterval();
  }

  /**
   * Create the notification update interval.
   */
  private createInterval() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      if (this.dataGetter) {
        const data = this.dataGetter();
        if (data) {
          this.lastUpdateTime = Date.now();
          this.updateNotification(data);
        }
      }
    }, 1000);
  }

  /**
   * Start notification updates using a data getter function.
   * The getter is called every tick to read the LATEST values (via refs).
   * Only creates one interval — subsequent calls just update the getter.
   */
  startUpdates(getTimerData: () => TimerNotificationData | null) {
    // Always update the getter so it reads from latest refs
    this.dataGetter = getTimerData;
    
    // Only create the interval if one doesn't already exist
    this.createInterval();
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.dataGetter = null;
    this.currentData = null;
    this.lastUpdateTime = 0;
    this.stopService();
  }

  isActive() {
    return this.updateInterval !== null;
  }

  clearData() {
    this.currentData = null;
  }
}

// Singleton instance
export const timerNotificationService = new TimerNotificationService();

// Helper to format time for notification
export function formatTimeForNotification(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
