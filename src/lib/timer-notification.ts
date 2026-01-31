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
  }): Promise<void>;
  updateService(options: {
    taskTitle: string;
    productiveTime: string;
    targetTime: string;
    wastedTime: string;
    isPaused: boolean;
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

  async initialize() {
    if (this.isInitialized || !Capacitor.isNativePlatform()) return;

    try {
      // Request notification permissions
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        console.warn('[TimerNotification] Permission not granted');
      }

      // Listen for app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        this.isAppInForeground = isActive;
        
        if (isActive) {
          // App came to foreground - notification continues running in background
          console.log('[TimerNotification] App in foreground');
        } else if (this.currentData && !this.currentData.isPaused) {
          // App went to background - start/update the service
          this.startOrUpdateService(this.currentData);
          console.log('[TimerNotification] App in background, service running');
        }
      });

      // Listen for pause/resume actions from notification
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
    
    // Always update the service when running (background or foreground)
    if (this.isServiceRunning) {
      await this.startOrUpdateService(data);
    } else if (!this.isAppInForeground) {
      // If app is in background and service not running, start it
      await this.startOrUpdateService(data);
    }
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

  startUpdates(getTimerData: () => TimerNotificationData | null) {
    // Update notification every second
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      const data = getTimerData();
      if (data) {
        this.updateNotification(data);
      }
    }, 1000);
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.currentData = null;
    this.stopService();
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
