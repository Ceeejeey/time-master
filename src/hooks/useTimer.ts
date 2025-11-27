import { useState, useEffect, useCallback } from 'react';
import { TimerSession, Task, Timeblock } from '@/lib/types';
import { saveTimerSession, getTodayPlan, saveTodayPlan, getCurrentUserId } from '@/lib/storage';
import { calculateSessionStats, isSessionPaused, getTotalPauseTimeSeconds, isSessionRunning } from '@/lib/timer';
import { toast } from '@/hooks/use-toast';
import { formatTimeHMS } from '@/lib/utils';
import { format } from 'date-fns';

export const useTimer = (task: Task | null, timeblock: Timeblock | null) => {
  const [session, setSession] = useState<TimerSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [productiveSeconds, setProductiveSeconds] = useState(0);
  const [wastedSeconds, setWastedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer tick effect
  useEffect(() => {
    if (!session || !timeblock) return;
    
    // Don't run timer if session is stopped or on long break
    if (session.isStopped || session.isOnLongBreak) return;
    
    const interval = setInterval(() => {
      if (!isSessionPaused(session) && !session.endTimestamp) {
        // Timer is running - increment both elapsed and productive time
        setElapsedSeconds(prev => prev + 1);
        setProductiveSeconds(prev => prev + 1);
      } else if (isSessionPaused(session) && !session.endTimestamp) {
        // Timer is paused - only increment elapsed time, update wasted time
        setElapsedSeconds(prev => prev + 1);
        setWastedSeconds(getTotalPauseTimeSeconds(session));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, timeblock]);

  const startTimer = useCallback(async () => {
    if (!task || !timeblock) return;

    const userId = getCurrentUserId();
    const newSession: TimerSession = {
      id: `session-${Date.now()}`,
      userId,
      taskId: task.id,
      timeblockId: timeblock.id,
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
    await saveTimerSession(newSession);
    
    toast({
      title: 'Timer Started',
      description: `Working on: ${task.title}`,
    });
  }, [task, timeblock]);

  const pauseTimer = useCallback(async () => {
    if (!session || !timeblock) return;

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
    
    toast({
      title: 'Timer Paused',
      description: 'Wasting time tracking started...',
    });
  }, [session, timeblock]);

  const resumeTimer = useCallback(async () => {
    if (!session || !timeblock) return;

    const pausePeriods = [...session.pausePeriods];
    const lastPause = pausePeriods[pausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    const updatedSession = {
      ...session,
      pausePeriods,
    };

    // Update wasted seconds with the final pause time
    setWastedSeconds(getTotalPauseTimeSeconds(updatedSession));
    setSession(updatedSession);
    setIsPaused(false);
    await saveTimerSession(updatedSession);
    
    toast({
      title: 'Timer Resumed',
      description: 'Back to work!',
    });
  }, [session, timeblock]);

  const stopTimer = useCallback(async () => {
    if (!session || !timeblock || !task) return;

    // If currently paused, close the pause period first
    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    const endTimestamp = new Date().toISOString();
    
    // Create session with the live tracked productive seconds
    const updatedSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      productiveSeconds: productiveSeconds, // Use live tracked productive time
      endTimestamp,
    };
    
    // Calculate stats (which will use the productive seconds we just set)
    const stats = calculateSessionStats(
      updatedSession,
      timeblock.durationMinutes
    );

    // Mark session as completed when stopped
    // A timeblock is considered completed if it's stopped, regardless of whether
    // it reached the full duration or not
    const finalSession: TimerSession = {
      ...updatedSession,
      ...stats,
      completed: true, // Always mark as completed when stopped
      isStopped: true, // Mark as permanently stopped
      isOnLongBreak: false,
    };

    setSession(finalSession);
    await saveTimerSession(finalSession);
    
    // Update today's plan to increment completed timeblocks
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayPlan = await getTodayPlan(today);
      
      if (todayPlan) {
        // Find the task in today's plan
        const taskInPlan = todayPlan.tasks.find(t => t.taskId === task.id);
        
        if (taskInPlan) {
          // Count how many completed sessions exist for this task
          // This will be used to check if all allocated timeblocks are completed
          // Note: We're marking this session as completed, so the count will be
          // updated when the page refreshes via DataContext
          
          // Just update the completedTimeblocks count
          const updatedPlan = {
            ...todayPlan,
            completedTimeblocks: todayPlan.completedTimeblocks + 1,
          };
          
          await saveTodayPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error updating today plan:', error);
    }
    
    toast({
      title: 'Timeblock Completed!',
      description: `Productive: ${formatTimeHMS(stats.productiveSeconds)} | Wasted: ${formatTimeHMS(stats.wastedSeconds)}`,
    });
  }, [session, timeblock, task, productiveSeconds]);

  const takeLongBreak = useCallback(async () => {
    if (!session || !timeblock) return;

    // Close any active pause period
    const updatedPausePeriods = [...session.pausePeriods];
    const lastPause = updatedPausePeriods[updatedPausePeriods.length - 1];
    if (lastPause && !lastPause.pauseEnd) {
      lastPause.pauseEnd = new Date().toISOString();
    }

    // Calculate current stats to save progress
    const stats = calculateSessionStats(
      { ...session, pausePeriods: updatedPausePeriods },
      timeblock.durationMinutes
    );

    const updatedSession: TimerSession = {
      ...session,
      pausePeriods: updatedPausePeriods,
      ...stats,
      isOnLongBreak: true,
      isStopped: false,
    };

    setSession(updatedSession);
    setIsPaused(true);
    await saveTimerSession(updatedSession);
    
    toast({
      title: 'Long Break Started',
      description: `Progress saved: ${formatTimeHMS(stats.productiveSeconds)} productive, ${formatTimeHMS(stats.wastedSeconds)} wasted`,
    });
  }, [session, timeblock]);

  const resumeFromLongBreak = useCallback(async () => {
    if (!session || !timeblock) return;

    const updatedSession: TimerSession = {
      ...session,
      isOnLongBreak: false,
      startTimestamp: session.startTimestamp, // Keep original start time
      // Add a new pause period for the long break
      pausePeriods: [
        ...session.pausePeriods,
        { 
          pauseStart: new Date().toISOString(),
          pauseEnd: new Date().toISOString() // Immediately close it
        }
      ],
    };

    setSession(updatedSession);
    setIsPaused(false);
    
    // Restore the productive and wasted seconds from saved state
    setProductiveSeconds(session.productiveSeconds);
    setWastedSeconds(session.wastedSeconds);
    
    await saveTimerSession(updatedSession);
    
    toast({
      title: 'Resumed from Long Break',
      description: 'Back to work!',
    });
  }, [session, timeblock]);

  const getProgress = useCallback(() => {
    if (!timeblock) return 0;
    const targetSeconds = timeblock.durationMinutes * 60;
    return Math.min(100, (productiveSeconds / targetSeconds) * 100);
  }, [productiveSeconds, timeblock]);

  return {
    session,
    elapsedSeconds,
    productiveSeconds,
    wastedSeconds,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    takeLongBreak,
    resumeFromLongBreak,
    getProgress,
    isRunning: session ? isSessionRunning(session) : false,
    isStopped: session?.isStopped || false,
    isOnLongBreak: session?.isOnLongBreak || false,
  };
};
