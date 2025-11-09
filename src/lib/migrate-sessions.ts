import { getTimerSessions, saveTimerSession } from './storage';
import { TimerSession } from './types';

interface OldTimerSession {
  id: string;
  taskId: string;
  timeblockId: string;
  startTimestamp: string;
  pausePeriods: Array<{ pauseStart: string; pauseEnd?: string }>;
  endTimestamp?: string;
  completed: boolean;
  productiveMinutes: number;
  wastedMinutes: number;
  notes?: string;
}

/**
 * Migrate old timer sessions from minutes to seconds
 * This should be run once to update existing data
 */
export const migrateSessionsToSeconds = async (): Promise<void> => {
  const sessions = await getTimerSessions();
  
  for (const session of sessions) {
    // Check if session is already migrated (has productiveSeconds field)
    if ('productiveSeconds' in session) {
      continue;
    }
    
    const oldSession = session as unknown as OldTimerSession;
    
    // Migrate from old format
    const migratedSession: TimerSession = {
      id: oldSession.id,
      taskId: oldSession.taskId,
      timeblockId: oldSession.timeblockId,
      startTimestamp: oldSession.startTimestamp,
      pausePeriods: oldSession.pausePeriods,
      endTimestamp: oldSession.endTimestamp,
      completed: oldSession.completed,
      notes: oldSession.notes,
      // Convert minutes to seconds
      productiveSeconds: (oldSession.productiveMinutes || 0) * 60,
      wastedSeconds: (oldSession.wastedMinutes || 0) * 60,
      // Add new fields
      isStopped: oldSession.endTimestamp ? true : false,
      isOnLongBreak: false,
    };
    
    await saveTimerSession(migratedSession);
  }
  
  console.log(`Migrated ${sessions.length} sessions to seconds format`);
};
