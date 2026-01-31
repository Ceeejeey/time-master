import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { saveBreakSession } from '@/lib/storage';
import { BreakSession } from '@/lib/types';

interface BreakState {
  isOnBreak: boolean;
  breakStartTime: number | null;
  targetBreakMinutes: number;
  elapsedBreakSeconds: number;
  isBreakTimeReached: boolean;
  // Saved timer state
  savedProductiveSeconds: number;
  savedWastedSeconds: number;
  wasTimerRunning: boolean;
}

interface BreakContextType {
  // State
  isOnBreak: boolean;
  breakStartTime: number | null;
  targetBreakMinutes: number;
  elapsedBreakSeconds: number;
  isBreakTimeReached: boolean;
  showBreakDialog: boolean;
  showBreakOverlay: boolean;
  
  // Actions
  openBreakDialog: () => void;
  closeBreakDialog: () => void;
  startBreak: (minutes: number, savedProductiveSeconds?: number, savedWastedSeconds?: number, wasTimerRunning?: boolean) => void;
  stopBreak: () => Promise<{ savedProductiveSeconds: number; savedWastedSeconds: number; wasTimerRunning: boolean } | null>;
  getBreakProgress: () => number;
}

const BreakContext = createContext<BreakContextType | null>(null);

export const useBreak = () => {
  const context = useContext(BreakContext);
  if (!context) {
    throw new Error('useBreak must be used within BreakProvider');
  }
  return context;
};

interface BreakProviderProps {
  children: ReactNode;
}

const BREAK_ALARM_ID = 99999;

export const BreakProvider: React.FC<BreakProviderProps> = ({ children }) => {
  const [breakState, setBreakState] = useState<BreakState>({
    isOnBreak: false,
    breakStartTime: null,
    targetBreakMinutes: 5,
    elapsedBreakSeconds: 0,
    isBreakTimeReached: false,
    savedProductiveSeconds: 0,
    savedWastedSeconds: 0,
    wasTimerRunning: false,
  });
  
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);
  
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  // Break timer tick effect
  useEffect(() => {
    if (!breakState.isOnBreak || !breakState.breakStartTime) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    tickIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - breakState.breakStartTime!) / 1000);
      const targetSeconds = breakState.targetBreakMinutes * 60;
      
      setBreakState(prev => ({
        ...prev,
        elapsedBreakSeconds: elapsed,
        isBreakTimeReached: elapsed >= targetSeconds,
      }));
    }, 1000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [breakState.isOnBreak, breakState.breakStartTime, breakState.targetBreakMinutes]);

  // Fire alarm when break time is reached
  useEffect(() => {
    if (breakState.isBreakTimeReached && breakState.isOnBreak) {
      fireBreakAlarm();
    }
  }, [breakState.isBreakTimeReached, breakState.isOnBreak]);

  const fireBreakAlarm = async () => {
    console.log('[Break] Target break time reached - firing alarm');
    
    // Vibrate
    if (Capacitor.isNativePlatform()) {
      try {
        // Continuous vibration pattern
        const vibratePattern = async () => {
          for (let i = 0; i < 5; i++) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        };
        vibratePattern();
        
        // Repeat vibration every 3 seconds while alarm is active
        alarmIntervalRef.current = setInterval(() => {
          if (breakState.isOnBreak) {
            vibratePattern();
          }
        }, 3000);
      } catch (e) {
        console.warn('[Break] Haptics not available:', e);
      }
    }
    
    // Send notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: BREAK_ALARM_ID,
            title: '⏰ Break Time is Over!',
            body: 'Your break time has ended. Tap to return to work.',
            sound: 'default',
            importance: 5,
            ongoing: false,
          }],
        });
      } catch (e) {
        console.warn('[Break] Notification failed:', e);
      }
    }
  };

  const stopAlarm = async () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    
    // Cancel the notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: BREAK_ALARM_ID }] });
      } catch (e) {
        console.warn('[Break] Failed to cancel notification:', e);
      }
    }
  };

  const openBreakDialog = useCallback(() => {
    setShowBreakDialog(true);
  }, []);

  const closeBreakDialog = useCallback(() => {
    setShowBreakDialog(false);
  }, []);

  const startBreak = useCallback((
    minutes: number,
    savedProductiveSeconds: number = 0,
    savedWastedSeconds: number = 0,
    wasTimerRunning: boolean = false
  ) => {
    console.log('[Break] Starting break for', minutes, 'minutes');
    console.log('[Break] Saved state - productive:', savedProductiveSeconds, 'wasted:', savedWastedSeconds, 'wasRunning:', wasTimerRunning);
    
    setBreakState({
      isOnBreak: true,
      breakStartTime: Date.now(),
      targetBreakMinutes: minutes,
      elapsedBreakSeconds: 0,
      isBreakTimeReached: false,
      savedProductiveSeconds,
      savedWastedSeconds,
      wasTimerRunning,
    });
    
    setShowBreakDialog(false);
    setShowBreakOverlay(true);
  }, []);

  const stopBreak = useCallback(async () => {
    console.log('[Break] Stopping break');
    
    // Stop the alarm
    stopAlarm();
    
    // Save break session to database
    if (breakState.breakStartTime && breakState.elapsedBreakSeconds > 0) {
      try {
        const breakSession: BreakSession = {
          id: `break-${Date.now()}`,
          userId: '1',
          startTimestamp: new Date(breakState.breakStartTime).toISOString(),
          endTimestamp: new Date().toISOString(),
          targetMinutes: breakState.targetBreakMinutes,
          actualSeconds: breakState.elapsedBreakSeconds,
        };
        await saveBreakSession(breakSession);
        console.log('[Break] Session saved:', breakState.elapsedBreakSeconds, 'seconds');
      } catch (error) {
        console.error('[Break] Failed to save break session:', error);
      }
    }
    
    const savedState = {
      savedProductiveSeconds: breakState.savedProductiveSeconds,
      savedWastedSeconds: breakState.savedWastedSeconds,
      wasTimerRunning: breakState.wasTimerRunning,
    };
    
    setBreakState({
      isOnBreak: false,
      breakStartTime: null,
      targetBreakMinutes: 5,
      elapsedBreakSeconds: 0,
      isBreakTimeReached: false,
      savedProductiveSeconds: 0,
      savedWastedSeconds: 0,
      wasTimerRunning: false,
    });
    
    setShowBreakOverlay(false);
    
    return savedState;
  }, [breakState.breakStartTime, breakState.elapsedBreakSeconds, breakState.targetBreakMinutes, breakState.savedProductiveSeconds, breakState.savedWastedSeconds, breakState.wasTimerRunning]);

  const getBreakProgress = useCallback(() => {
    if (!breakState.targetBreakMinutes) return 0;
    const targetSeconds = breakState.targetBreakMinutes * 60;
    return Math.min(100, (breakState.elapsedBreakSeconds / targetSeconds) * 100);
  }, [breakState.elapsedBreakSeconds, breakState.targetBreakMinutes]);

  const value: BreakContextType = {
    isOnBreak: breakState.isOnBreak,
    breakStartTime: breakState.breakStartTime,
    targetBreakMinutes: breakState.targetBreakMinutes,
    elapsedBreakSeconds: breakState.elapsedBreakSeconds,
    isBreakTimeReached: breakState.isBreakTimeReached,
    showBreakDialog,
    showBreakOverlay,
    openBreakDialog,
    closeBreakDialog,
    startBreak,
    stopBreak,
    getBreakProgress,
  };

  return (
    <BreakContext.Provider value={value}>
      {children}
    </BreakContext.Provider>
  );
};
