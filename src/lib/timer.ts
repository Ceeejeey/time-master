import { TimerSession, PausePeriod } from './types';
import { differenceInSeconds, parseISO } from 'date-fns';

/**
 * Calculate session statistics
 * 
 * Logic:
 * - Productive time = Time actually tracked while working (from session.productiveSeconds)
 * - Wasted time = (Target duration - Productive time) + Pause time
 *   This includes BOTH:
 *   1. Remaining unused time from the timeblock
 *   2. Time spent manually paused
 * 
 * Example:
 * - 30min timeblock (1800s total)
 * - Work 2m (120s), pause for 1m 1s (61s), then stop
 * - Productive: 120s
 * - Remaining: 1800s - 120s = 1680s
 * - Pause time: 61s
 * - Wasted: 1680s + 61s = 1741s (29m 1s total)
 */
export const calculateSessionStats = (session: TimerSession, targetDurationMinutes: number): {
  productiveSeconds: number;
  wastedSeconds: number;
  completed: boolean;
} => {
  // Use the live-tracked productive seconds from the session
  // This is set by the timer during stopTimer() and is more accurate
  const productiveSeconds = session.productiveSeconds || 0;
  
  // Calculate total pause time in seconds
  let totalPauseSeconds = 0;
  for (const pause of session.pausePeriods) {
    if (pause.pauseEnd) {
      const pauseStart = parseISO(pause.pauseStart);
      const pauseEnd = parseISO(pause.pauseEnd);
      totalPauseSeconds += differenceInSeconds(pauseEnd, pauseStart);
    } else {
      // Currently paused - calculate pause time up to now
      const pauseStart = parseISO(pause.pauseStart);
      totalPauseSeconds += differenceInSeconds(new Date(), pauseStart);
    }
  }
  
  // Calculate wasted time = (Target duration - Productive time) + Pause time
  // This includes both unused timeblock duration AND manually paused time
  const targetDurationSeconds = targetDurationMinutes * 60;
  const remainingSeconds = Math.max(0, targetDurationSeconds - productiveSeconds);
  const wastedSeconds = remainingSeconds + totalPauseSeconds;
  
  // Completed if productive time reached at least 90% of target duration
  const completed = productiveSeconds >= targetDurationSeconds * 0.9;
  
  return {
    productiveSeconds,
    wastedSeconds,
    completed,
  };
};

export const getCurrentPausePeriod = (session: TimerSession): PausePeriod | null => {
  const lastPause = session.pausePeriods[session.pausePeriods.length - 1];
  if (lastPause && !lastPause.pauseEnd) {
    return lastPause;
  }
  return null;
};

export const isSessionPaused = (session: TimerSession): boolean => {
  return getCurrentPausePeriod(session) !== null;
};

export const isSessionRunning = (session: TimerSession): boolean => {
  return !session.endTimestamp && !session.isStopped;
};

export const getTotalPauseTimeSeconds = (session: TimerSession): number => {
  let total = 0;
  for (const pause of session.pausePeriods) {
    if (pause.pauseEnd) {
      const pauseStart = parseISO(pause.pauseStart);
      const pauseEnd = parseISO(pause.pauseEnd);
      total += differenceInSeconds(pauseEnd, pauseStart);
    } else {
      // Include current pause in the calculation
      const pauseStart = parseISO(pause.pauseStart);
      total += differenceInSeconds(new Date(), pauseStart);
    }
  }
  return total;
};

// Get productive time in seconds (time actually spent working)
export const getProductiveTimeSeconds = (session: TimerSession): number => {
  const startTime = parseISO(session.startTimestamp);
  const endTime = session.endTimestamp ? parseISO(session.endTimestamp) : new Date();
  const totalElapsedSeconds = differenceInSeconds(endTime, startTime);
  const totalPauseSeconds = getTotalPauseTimeSeconds(session);
  return Math.max(0, totalElapsedSeconds - totalPauseSeconds);
};
