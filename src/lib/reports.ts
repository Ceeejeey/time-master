import { TimerSession, Task, ReportData } from './types';
import { parseISO, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const generateReport = (
  sessions: TimerSession[],
  tasks: Task[],
  startDate: Date,
  endDate: Date
): ReportData => {
  // Filter sessions within date range
  const filteredSessions = sessions.filter(session => {
    const sessionDate = parseISO(session.startTimestamp);
    return isWithinInterval(sessionDate, { start: startDate, end: endDate });
  });

  // Calculate totals in seconds (not minutes)
  const totalWorkTime = filteredSessions.reduce((sum, s) => sum + (s.productiveSeconds || 0), 0);
  const totalWastedTime = filteredSessions.reduce((sum, s) => sum + (s.wastedSeconds || 0), 0);

  const blocksCompleted = filteredSessions.filter(s => s.completed).length;
  
  const completionRatePercent = filteredSessions.length > 0
    ? Math.round((blocksCompleted / filteredSessions.length) * 100)
    : 0;

  // Calculate top wasted tasks
  const wastedByTask = new Map<string, number>();
  for (const session of filteredSessions) {
    const current = wastedByTask.get(session.taskId) || 0;
    wastedByTask.set(session.taskId, current + (session.wastedSeconds || 0));
  }

  const topWastedTasks = Array.from(wastedByTask.entries())
    .map(([taskId, wastedSeconds]) => {
      const task = tasks.find(t => t.id === taskId);
      return {
        taskId,
        taskTitle: task?.title || 'Unknown Task',
        wastedSeconds,
      };
    })
    .sort((a, b) => b.wastedSeconds - a.wastedSeconds)
    .slice(0, 5);

  return {
    totalWorkTime,
    totalWastedTime,
    blocksCompleted,
    completionRatePercent,
    topWastedTasks,
  };
};

export const getTodayReport = (sessions: TimerSession[], tasks: Task[]): ReportData => {
  const today = new Date();
  return generateReport(sessions, tasks, startOfDay(today), endOfDay(today));
};

export const getWeekReport = (sessions: TimerSession[], tasks: Task[]): ReportData => {
  const today = new Date();
  return generateReport(sessions, tasks, startOfWeek(today), endOfWeek(today));
};

export const getMonthReport = (sessions: TimerSession[], tasks: Task[]): ReportData => {
  const today = new Date();
  return generateReport(sessions, tasks, startOfMonth(today), endOfMonth(today));
};
