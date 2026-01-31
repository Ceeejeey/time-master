import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { TimerSession, Task, Timeblock, TodayPlan, TodayTask } from '@/lib/types';
import { saveTimerSession, getTodayPlan, saveTodayPlan, getCurrentUserId, getTimerSessions } from '@/lib/storage';
import { calculateSessionStats, isSessionPaused, getTotalPauseTimeSeconds, isSessionRunning } from '@/lib/timer';
import { timerNotificationService, formatTimeForNotification } from '@/lib/timer-notification';
import { format } from 'date-fns';

interface TimerContextType {
  // State
  session: TimerSession | null;
  selectedTask: Task | null;
  selectedTimeblock: Timeblock | null;
  elapsedSeconds: number;
  productiveSeconds: number;
  wastedSeconds: number;
  isPaused: boolean;
  isRunning: boolean;
  isStopped: boolean;
  isOnLongBreak: boolean;
  isTargetReached: boolean;
  remainingBlocks: number;
  todayPlan: TodayPlan | null;
  
  // Actions
  setSelectedTask: (task: Task | null) => void;
  setSelectedTimeblock: (timeblock: Timeblock | null) => void;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  takeLongBreak: () => Promise<void>;
  resumeFromLongBreak: () => Promise<void>;
  getProgress: () => number;
  startNextBlock: () => Promise<void>;
  dismissTargetReached: () => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export const useGlobalTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useGlobalTimer must be used within TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [session, setSession] = useState<TimerSession | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTimeblock, setSelectedTimeblock] = useState<Timeblock | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [productiveSeconds, setProductiveSeconds] = useState(0);
  const [wastedSeconds, setWastedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTargetReached, setIsTargetReached] = useState(false);
  const [remainingBlocks, setRemainingBlocks] = useState(0);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  
  // Refs for notification callbacks
  const pauseTimerRef = useRef<(() => Promise<void>) | null>(null);
  const resumeTimerRef = useRef<(() => Promise<void>) | null>(null);

  // Initialize notification service
  useEffect(() => {
    timerNotificationService.initialize();
  }, []);

  // Calculate remaining blocks for the current task
  const calculateRemainingBlocks = useCallback(async (taskId: string) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const plan = await getTodayPlan(today);
      if (!plan) return 0;

      const taskInPlan = plan.tasks.find(t => t.taskId === taskId);
      if (!taskInPlan) return 0;

      // Get completed sessions for this task today
      const sessions = await getTimerSessions();
      const todayStart = new Date(today).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;
      
      const completedBlocks = sessions.filter(s => 
        s.taskId === taskId && 
        s.completed && 
        new Date(s.startTimestamp).getTime() >= todayStart &&
        new Date(s.startTimestamp).getTime() < todayEnd
      ).length;

      return Math.max(0, taskInPlan.timeblockCount - completedBlocks - 1); // -1 for current block
    } catch (error) {
      console.error('Error calculating remaining blocks:', error);
      return 0;
    }
  }, []);

  // Update notification when timer state changes
  useEffect(() => {
    if (!session || !selectedTimeblock || !selectedTask) {
      timerNotificationService.stopUpdates();
      return;
    }

    if (session.isStopped || session.endTimestamp) {
      timerNotificationService.stopUpdates();
      return;
    }

    const targetSeconds = selectedTimeblock.durationMinutes * 60;

    // Set up notification callbacks
    timerNotificationService.setCallbacks(
      () => pauseTimerRef.current?.(),
      () => resumeTimerRef.current?.()
    );

    // Start notification updates
    timerNotificationService.startUpdates(() => ({
      taskTitle: selectedTask.title,
      productiveTime: formatTimeForNotification(productiveSeconds),
      targetTime: formatTimeForNotification(targetSeconds),
      wastedTime: formatTimeForNotification(wastedSeconds),
      isPaused: isPaused || session.isOnLongBreak,
    }));

    return () => {
      // Don't stop updates on cleanup - let app state change handle it
    };
  }, [session, selectedTimeblock, selectedTask, productiveSeconds, wastedSeconds, isPaused]);

  // Timer tick effect with auto-stop when target reached
  useEffect(() => {
    if (!session || !selectedTimeblock) return;
    
    // Don't run timer if session is stopped or on long break
    if (session.isStopped || session.isOnLongBreak) return;
    
    const targetSeconds = selectedTimeblock.durationMinutes * 60;
    
    const interval = setInterval(async () => {
      if (!isSessionPaused(session) && !session.endTimestamp) {
        setElapsedSeconds(prev => prev + 1);
        setProductiveSeconds(prev => {
          const newValue = prev + 1;
          
          // Check if target time reached
          if (newValue >= targetSeconds && !isTargetReached) {
            // Auto-stop the timer
            handleAutoStop();
          }
          
          return newValue;
        });
      } else if (isSessionPaused(session) && !session.endTimestamp) {
        setElapsedSeconds(prev => prev + 1);
        setWastedSeconds(getTotalPauseTimeSeconds(session));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, selectedTimeblock, isTargetReached]);

  // Handle auto-stop when target is reached
  const handleAutoStop = useCallback(async () => {
    if (!session || !selectedTimeblock || !selectedTask) return;
    if (isTargetReached) return; // Prevent multiple triggers

    console.log('[Timer] Target time reached - auto stopping');

    // Calculate remaining blocks
    const remaining = await calculateRemainingBlocks(selectedTask.id);
    setRemainingBlocks(remaining);

    // Close any active pause period
    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    const endTimestamp = new Date().toISOString();
    const targetSeconds = selectedTimeblock.durationMinutes * 60;
    
    const updatedSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: targetSeconds, // Set to exact target
      endTimestamp,
    };
    
    const stats = calculateSessionStats(updatedSession, selectedTimeblock.durationMinutes);

    const finalSession: TimerSession = {
      ...updatedSession,
      ...stats,
      completed: true,
      isStopped: true,
      isOnLongBreak: false,
    };

    setSession(finalSession);
    setIsTargetReached(true);
    await saveTimerSession(finalSession);
    
    // Update today's plan
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const plan = await getTodayPlan(today);
      
      if (plan) {
        const taskInPlan = plan.tasks.find(t => t.taskId === selectedTask.id);
        if (taskInPlan) {
          const updatedPlan = {
            ...plan,
            completedTimeblocks: plan.completedTimeblocks + 1,
          };
          await saveTodayPlan(updatedPlan);
          setTodayPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error updating today plan:', error);
    }
    
    timerNotificationService.stopUpdates();
    console.log('[Timer] Auto-stopped. Remaining blocks:', remaining);
  }, [session, selectedTimeblock, selectedTask, isTargetReached, calculateRemainingBlocks]);

  const startTimer = useCallback(async () => {
    if (!selectedTask || !selectedTimeblock) return;

    const userId = getCurrentUserId();
    const newSession: TimerSession = {
      id: `session-${Date.now()}`,
      userId,
      taskId: selectedTask.id,
      timeblockId: selectedTimeblock.id,
      startTimestamp: new Date().toISOString(),
      pausePeriods: [],
      completed: false,
      productiveSeconds: 0,
      wastedSeconds: 0,
      isStopped: false,
      isOnLongBreak: false,
    };

    setSession(newSession);
    setElapsedSeconds(0);
    setProductiveSeconds(0);
    setWastedSeconds(0);
    setIsPaused(false);
    setIsTargetReached(false);
    await saveTimerSession(newSession);
    
    // Load today's plan
    const today = format(new Date(), 'yyyy-MM-dd');
    const plan = await getTodayPlan(today);
    setTodayPlan(plan);
    
    console.log('[Timer] Started:', selectedTask.title);
  }, [selectedTask, selectedTimeblock]);

  const pauseTimer = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    const updatedSession = {
      ...session,
      pausePeriods: [
        ...session.pausePeriods,
        { pauseStart: new Date().toISOString() },
      ],
    };

    setSession(updatedSession);
    setIsPaused(true);
    await saveTimerSession(updatedSession);
    
    console.log('[Timer] Paused');
  }, [session, selectedTimeblock]);

  const resumeTimer = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    const pausePeriods = [...session.pausePeriods];
    const lastPause = pausePeriods[pausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    const updatedSession = {
      ...session,
      pausePeriods,
    };

    setWastedSeconds(getTotalPauseTimeSeconds(updatedSession));
    setSession(updatedSession);
    setIsPaused(false);
    await saveTimerSession(updatedSession);
    
    console.log('[Timer] Resumed');
  }, [session, selectedTimeblock]);

  // Keep refs updated with latest functions
  useEffect(() => {
    pauseTimerRef.current = pauseTimer;
    resumeTimerRef.current = resumeTimer;
  }, [pauseTimer, resumeTimer]);

  const stopTimer = useCallback(async () => {
    if (!session || !selectedTimeblock || !selectedTask) return;

    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    const endTimestamp = new Date().toISOString();
    
    const updatedSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: productiveSeconds,
      endTimestamp,
    };
    
    const stats = calculateSessionStats(updatedSession, selectedTimeblock.durationMinutes);

    const finalSession: TimerSession = {
      ...updatedSession,
      ...stats,
      completed: true,
      isStopped: true,
      isOnLongBreak: false,
    };

    setSession(finalSession);
    await saveTimerSession(finalSession);
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const plan = await getTodayPlan(today);
      
      if (plan) {
        const taskInPlan = plan.tasks.find(t => t.taskId === selectedTask.id);
        if (taskInPlan) {
          const updatedPlan = {
            ...plan,
            completedTimeblocks: plan.completedTimeblocks + 1,
          };
          await saveTodayPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error updating today plan:', error);
    }
    
    timerNotificationService.stopUpdates();
    console.log('[Timer] Stopped - Productive:', stats.productiveSeconds, 'Wasted:', stats.wastedSeconds);
  }, [session, selectedTimeblock, selectedTask, productiveSeconds]);

  const takeLongBreak = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    // Close any open pause period
    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    // Save current timer state values (not recalculated from pause periods)
    const updatedSession: TimerSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: productiveSeconds,  // Save current productive time
      wastedSeconds: wastedSeconds,          // Save current wasted time
      isOnLongBreak: true,
      isStopped: false,
    };

    setSession(updatedSession);
    setIsPaused(true);
    await saveTimerSession(updatedSession);
    
    console.log('[Timer] Long break started - Saved productive:', productiveSeconds, 'wasted:', wastedSeconds);
  }, [session, selectedTimeblock, productiveSeconds, wastedSeconds]);

  const resumeFromLongBreak = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    console.log('[Timer] Resuming from long break - Restoring productive:', session.productiveSeconds, 'wasted:', session.wastedSeconds);

    const updatedSession: TimerSession = {
      ...session,
      isOnLongBreak: false,
      isStopped: false,
      // Don't add a new pause period - just resume where we left off
    };

    // Restore the saved timer state
    setProductiveSeconds(session.productiveSeconds);
    setWastedSeconds(session.wastedSeconds);
    setElapsedSeconds(session.productiveSeconds + session.wastedSeconds);
    setSession(updatedSession);
    setIsPaused(false);
    
    await saveTimerSession(updatedSession);
    
    console.log('[Timer] Resumed from long break');
  }, [session, selectedTimeblock]);

  const getProgress = useCallback(() => {
    if (!selectedTimeblock) return 0;
    const targetSeconds = selectedTimeblock.durationMinutes * 60;
    return Math.min(100, (productiveSeconds / targetSeconds) * 100);
  }, [productiveSeconds, selectedTimeblock]);

  const startNextBlock = useCallback(async () => {
    if (!selectedTask || !selectedTimeblock) return;

    // Reset state for next block
    setIsTargetReached(false);
    setSession(null);
    
    // Small delay then start new timer
    setTimeout(() => {
      startTimer();
    }, 100);
    
    console.log('[Timer] Starting next block');
  }, [selectedTask, selectedTimeblock, startTimer]);

  const dismissTargetReached = useCallback(() => {
    setIsTargetReached(false);
  }, []);

  const resetTimer = useCallback(() => {
    setSession(null);
    setSelectedTask(null);
    setSelectedTimeblock(null);
    setElapsedSeconds(0);
    setProductiveSeconds(0);
    setWastedSeconds(0);
    setIsPaused(false);
    setIsTargetReached(false);
    setRemainingBlocks(0);
    timerNotificationService.stopUpdates();
  }, []);

  const value: TimerContextType = {
    session,
    selectedTask,
    selectedTimeblock,
    elapsedSeconds,
    productiveSeconds,
    wastedSeconds,
    isPaused,
    isRunning: session ? isSessionRunning(session) : false,
    isStopped: session?.isStopped || false,
    isOnLongBreak: session?.isOnLongBreak || false,
    isTargetReached,
    remainingBlocks,
    todayPlan,
    setSelectedTask,
    setSelectedTimeblock,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    takeLongBreak,
    resumeFromLongBreak,
    getProgress,
    startNextBlock,
    dismissTargetReached,
    resetTimer,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
