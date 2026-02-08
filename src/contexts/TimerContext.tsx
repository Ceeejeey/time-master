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
  instanceId: string | null; // Unique instance ID for tracking sessions per day
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
  setSelectedTask: (task: Task | null, instanceId?: string | null) => void;
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
  const [instanceId, setInstanceId] = useState<string | null>(null); // Unique instance ID for session tracking
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
  
  // Ref-based flag to immediately stop tick when break starts (avoids async state delay)
  const onBreakRef = useRef(false);
  // Keep a ref of productiveSeconds so stopTimer always has the latest value
  const productiveSecondsRef = useRef(0);
  const wastedSecondsRef = useRef(0);

  // Handler to set task with optional instanceId
  const handleSetSelectedTask = useCallback((task: Task | null, newInstanceId?: string | null) => {
    setSelectedTask(task);
    // If instanceId is provided, use it; otherwise generate one or use task.id
    if (task) {
      setInstanceId(newInstanceId || task.id);
    } else {
      setInstanceId(null);
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    productiveSecondsRef.current = productiveSeconds;
  }, [productiveSeconds]);
  
  useEffect(() => {
    wastedSecondsRef.current = wastedSeconds;
  }, [wastedSeconds]);

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

    // Start notification updates — the getter reads from REFS for always-fresh values.
    // startUpdates only creates the interval once; subsequent calls just update the getter.
    timerNotificationService.startUpdates(() => {
      const currentProductive = productiveSecondsRef.current;
      const currentWasted = wastedSecondsRef.current;
      const progress = targetSeconds > 0 ? Math.min(100, Math.round((currentProductive / targetSeconds) * 100)) : 0;
      
      return {
        taskTitle: selectedTask.title,
        productiveTime: formatTimeForNotification(currentProductive),
        targetTime: formatTimeForNotification(targetSeconds),
        wastedTime: formatTimeForNotification(currentWasted),
        isPaused: isPaused || (session?.isOnLongBreak ?? false),
        progressPercent: progress,
      };
    });

    return () => {
      // Don't stop updates on cleanup - let app state change handle it
    };
  }, [session, selectedTimeblock, selectedTask, isPaused]);

  // Timer tick effect with auto-stop when target reached
  useEffect(() => {
    if (!session || !selectedTimeblock) return;
    
    // Don't run timer if session is stopped or on long break
    if (session.isStopped || session.isOnLongBreak) return;
    
    const targetSeconds = selectedTimeblock.durationMinutes * 60;
    
    const interval = setInterval(async () => {
      // Check ref immediately - prevents ticking during break transition
      if (onBreakRef.current) return;
      
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

    setIsTargetReached(true);
    const dbId = await saveTimerSession(finalSession);
    setSession({ ...finalSession, id: dbId });
    
    // Update today's plan
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const plan = await getTodayPlan(today);
      
      if (plan) {
        const taskInPlan = plan.tasks.find(t => t.taskId === selectedTask.id);
        if (taskInPlan) {
          // Count how many blocks are now completed for this instance
          const trackingId = taskInPlan.instanceId || taskInPlan.taskId;
          const allSessions = await getTimerSessions();
          const completedBlocksForTask = allSessions.filter(
            s => s.taskId === trackingId && s.completed && s.isStopped
          ).length; // Session we just saved is already in DB
          
          // Auto-mark task as completed if all blocks are done
          const allBlocksDone = completedBlocksForTask >= taskInPlan.timeblockCount;
          
          const updatedTasks = plan.tasks.map(t => {
            if (t.id === taskInPlan.id) {
              return { ...t, completed: allBlocksDone };
            }
            return t;
          });
          
          const updatedPlan = {
            ...plan,
            tasks: updatedTasks,
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
      taskId: instanceId || selectedTask.id, // Use instanceId for unique daily tracking
      timeblockId: selectedTimeblock.id,
      startTimestamp: new Date().toISOString(),
      pausePeriods: [],
      completed: false,
      productiveSeconds: 0,
      wastedSeconds: 0,
      isStopped: false,
      isOnLongBreak: false,
    };

    setElapsedSeconds(0);
    setProductiveSeconds(0);
    setWastedSeconds(0);
    setIsPaused(false);
    setIsTargetReached(false);
    
    // Save and capture the DB-assigned ID
    const dbId = await saveTimerSession(newSession);
    const sessionWithDbId = { ...newSession, id: dbId };
    setSession(sessionWithDbId);
    
    // Load today's plan
    const today = format(new Date(), 'yyyy-MM-dd');
    const plan = await getTodayPlan(today);
    setTodayPlan(plan);
    
    console.log('[Timer] Started:', selectedTask.title, 'Instance:', instanceId, 'DB ID:', dbId);
  }, [selectedTask, selectedTimeblock, instanceId]);

  const pauseTimer = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    const updatedSession = {
      ...session,
      pausePeriods: [
        ...session.pausePeriods,
        { pauseStart: new Date().toISOString() },
      ],
    };

    setIsPaused(true);
    const dbId = await saveTimerSession(updatedSession);
    setSession({ ...updatedSession, id: dbId });
    
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
    setIsPaused(false);
    const dbId = await saveTimerSession(updatedSession);
    setSession({ ...updatedSession, id: dbId });
    
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
    
    // Use ref for the most up-to-date productive/wasted values
    const currentProductive = productiveSecondsRef.current;
    const targetSeconds = selectedTimeblock.durationMinutes * 60;
    
    // Calculate wasted time: remaining unused timeblock time + actual pause time
    const remainingSeconds = Math.max(0, targetSeconds - currentProductive);
    let totalPauseSeconds = 0;
    for (const pause of updatedPausePeriods) {
      if (pause.pauseEnd) {
        const pStart = new Date(pause.pauseStart).getTime();
        const pEnd = new Date(pause.pauseEnd).getTime();
        totalPauseSeconds += Math.floor((pEnd - pStart) / 1000);
      }
    }
    const calculatedWasted = remainingSeconds + totalPauseSeconds;
    
    // Stopping a block = completing it (block is done regardless of how much target was achieved)
    const completed = true;

    const finalSession: TimerSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: currentProductive,
      wastedSeconds: calculatedWasted,
      endTimestamp,
      completed,
      isStopped: true,
      isOnLongBreak: false,
    };

    const dbId = await saveTimerSession(finalSession);
    setSession({ ...finalSession, id: dbId });
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const plan = await getTodayPlan(today);
      
      if (plan) {
        // Find the task in today's plan
        const taskInPlan = plan.tasks.find(t => t.taskId === selectedTask.id);
        if (taskInPlan) {
          // Count how many blocks are now completed for this instance
          const trackingId = taskInPlan.instanceId || taskInPlan.taskId;
          const allSessions = await getTimerSessions();
          const completedBlocksForTask = allSessions.filter(
            s => s.taskId === trackingId && s.completed && s.isStopped
          ).length; // Session we just saved is already in DB
          
          // Auto-mark task as completed if all blocks are done
          const allBlocksDone = completedBlocksForTask >= taskInPlan.timeblockCount;
          
          const updatedTasks = plan.tasks.map(t => {
            if (t.id === taskInPlan.id) {
              return { ...t, completed: allBlocksDone };
            }
            return t;
          });
          
          const updatedPlan = {
            ...plan,
            tasks: updatedTasks,
            completedTimeblocks: plan.completedTimeblocks + 1,
          };
          await saveTodayPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error updating today plan:', error);
    }
    
    timerNotificationService.stopUpdates();
    console.log('[Timer] Stopped - Productive:', currentProductive, 'Wasted:', calculatedWasted);
  }, [session, selectedTimeblock, selectedTask]);

  const takeLongBreak = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    // IMMEDIATELY set ref flag to stop tick interval (synchronous, no React delay)
    onBreakRef.current = true;
    
    // Use refs for the most up-to-date values
    const currentProductive = productiveSecondsRef.current;
    const currentWasted = wastedSecondsRef.current;

    // Close any open pause period
    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    // Save current timer state values (from refs for accuracy)
    const updatedSession: TimerSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: currentProductive,
      wastedSeconds: currentWasted,
      isOnLongBreak: true,
      isStopped: false,
    };

    setIsPaused(true);
    const dbId = await saveTimerSession(updatedSession);
    setSession({ ...updatedSession, id: dbId });
    
    console.log('[Timer] Long break started - Saved productive:', currentProductive, 'wasted:', currentWasted, 'DB ID:', dbId);
  }, [session, selectedTimeblock]);

  const resumeFromLongBreak = useCallback(async () => {
    if (!session || !selectedTimeblock) return;

    console.log('[Timer] Resuming from long break - Restoring productive:', session.productiveSeconds, 'wasted:', session.wastedSeconds);

    // Restore the saved timer state BEFORE updating session (so tick effect uses correct starting values)
    const savedProductive = session.productiveSeconds || 0;
    const savedWasted = session.wastedSeconds || 0;
    
    setProductiveSeconds(savedProductive);
    setWastedSeconds(savedWasted);
    setElapsedSeconds(savedProductive + savedWasted);
    
    // Update refs to match restored values
    productiveSecondsRef.current = savedProductive;
    wastedSecondsRef.current = savedWasted;

    const updatedSession: TimerSession = {
      ...session,
      isOnLongBreak: false,
      isStopped: false,
    };

    setIsPaused(false);
    
    // Clear break flag AFTER state updates so tick effect resumes with correct values
    onBreakRef.current = false;
    
    const dbId = await saveTimerSession(updatedSession);
    setSession({ ...updatedSession, id: dbId });
    
    console.log('[Timer] Resumed from long break - productive:', savedProductive, 'wasted:', savedWasted, 'DB ID:', dbId);
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
    onBreakRef.current = false;
    productiveSecondsRef.current = 0;
    wastedSecondsRef.current = 0;
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
    instanceId,
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
    setSelectedTask: handleSetSelectedTask,
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
