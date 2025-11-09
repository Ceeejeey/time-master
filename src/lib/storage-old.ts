import localforage from 'localforage';
import { 
  User, Workplan, Task, Timeblock, TimerSession, 
  TimeblockAssignment, TodayPlan 
} from './types';

// Initialize storage
const storage = localforage.createInstance({
  name: 'TimeMaster',
  storeName: 'timemaster_db',
});

// Storage keys
const KEYS = {
  USER: 'user',
  WORKPLANS: 'workplans',
  TASKS: 'tasks',
  TIMEBLOCKS: 'timeblocks',
  TIMER_SESSIONS: 'timer_sessions',
  TIMEBLOCK_ASSIGNMENTS: 'timeblock_assignments',
  TODAY_PLAN: 'today_plan',
};

// User
export const getUser = async (): Promise<User | null> => {
  return await storage.getItem<User>(KEYS.USER);
};

export const saveUser = async (user: User): Promise<void> => {
  await storage.setItem(KEYS.USER, user);
};

// Workplans
export const getWorkplans = async (): Promise<Workplan[]> => {
  const plans = await storage.getItem<Workplan[]>(KEYS.WORKPLANS);
  return plans || [];
};

export const saveWorkplan = async (workplan: Workplan): Promise<void> => {
  const plans = await getWorkplans();
  const index = plans.findIndex(p => p.id === workplan.id);
  if (index >= 0) {
    plans[index] = workplan;
  } else {
    plans.push(workplan);
  }
  await storage.setItem(KEYS.WORKPLANS, plans);
};

export const deleteWorkplan = async (id: string): Promise<void> => {
  const plans = await getWorkplans();
  const filtered = plans.filter(p => p.id !== id);
  await storage.setItem(KEYS.WORKPLANS, filtered);
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  const tasks = await storage.getItem<Task[]>(KEYS.TASKS);
  return tasks || [];
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const tasks = await getTasks();
  return tasks.find(t => t.id === id) || null;
};

export const saveTask = async (task: Task): Promise<void> => {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  await storage.setItem(KEYS.TASKS, tasks);
};

export const deleteTask = async (id: string): Promise<void> => {
  const tasks = await getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await storage.setItem(KEYS.TASKS, filtered);
};

// Timeblocks
export const getTimeblocks = async (): Promise<Timeblock[]> => {
  const blocks = await storage.getItem<Timeblock[]>(KEYS.TIMEBLOCKS);
  return blocks || getDefaultTimeblocks();
};

export const getDefaultTimeblocks = (): Timeblock[] => [
  { id: 'tb-15', durationMinutes: 15, label: '15 min' },
  { id: 'tb-30', durationMinutes: 30, label: '30 min' },
  { id: 'tb-45', durationMinutes: 45, label: '45 min' },
  { id: 'tb-60', durationMinutes: 60, label: '60 min' },
];

export const saveTimeblock = async (timeblock: Timeblock): Promise<void> => {
  const blocks = await getTimeblocks();
  const index = blocks.findIndex(b => b.id === timeblock.id);
  if (index >= 0) {
    blocks[index] = timeblock;
  } else {
    blocks.push(timeblock);
  }
  await storage.setItem(KEYS.TIMEBLOCKS, blocks);
};

// Timer Sessions
export const getTimerSessions = async (): Promise<TimerSession[]> => {
  const sessions = await storage.getItem<TimerSession[]>(KEYS.TIMER_SESSIONS);
  return sessions || [];
};

export const saveTimerSession = async (session: TimerSession): Promise<void> => {
  const sessions = await getTimerSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  await storage.setItem(KEYS.TIMER_SESSIONS, sessions);
};

// Today Plan
export const getTodayPlan = async (date: string): Promise<TodayPlan | null> => {
  const plans = await storage.getItem<Record<string, TodayPlan>>(KEYS.TODAY_PLAN);
  return plans?.[date] || null;
};

export const saveTodayPlan = async (plan: TodayPlan): Promise<void> => {
  const plans = await storage.getItem<Record<string, TodayPlan>>(KEYS.TODAY_PLAN) || {};
  plans[plan.date] = plan;
  await storage.setItem(KEYS.TODAY_PLAN, plans);
};

export const deleteTodayPlan = async (date: string): Promise<void> => {
  const plans = await storage.getItem<Record<string, TodayPlan>>(KEYS.TODAY_PLAN) || {};
  delete plans[date];
  await storage.setItem(KEYS.TODAY_PLAN, plans);
};

// Initialize default data
export const initializeDefaultData = async (): Promise<void> => {
  const user = await getUser();
  if (!user) {
    await saveUser({
      id: 'user-1',
      name: 'User',
      isPremium: false,
    });
  }

  const timeblocks = await storage.getItem<Timeblock[]>(KEYS.TIMEBLOCKS);
  if (!timeblocks) {
    await storage.setItem(KEYS.TIMEBLOCKS, getDefaultTimeblocks());
  }
};
