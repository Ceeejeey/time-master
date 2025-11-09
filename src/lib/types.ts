export type PriorityQuadrant =
  | 'essential_immediate'
  | 'essential_not_immediate'
  | 'not_essential_immediate'
  | 'not_essential_not_immediate';

export type WorkplanScope = 'day' | 'week' | 'month';

export interface User {
  id: string;
  name: string;
  email?: string;
  isPremium: boolean;
}

export interface Timeblock {
  id: string;
  durationMinutes: number;
  label: string;
}

export interface Task {
  id: string;
  userId: string; // Owner of this task
  title: string;
  description: string;
  priorityQuadrant: PriorityQuadrant;
  assignedTimeblocks: TimeblockAssignment[];
  estimatedTotalTimeMinutes: number;
  metadata: {
    tags?: string[];
    color?: string;
  };
}

export interface TimeblockAssignment {
  id: string;
  taskId: string;
  timeblockId: string;
  scheduledStart?: string; // ISO8601
}

export interface Workplan {
  id: string;
  userId: string; // Owner of this workplan
  title: string;
  scope: WorkplanScope;
  startDate: string; // ISO8601
  endDate: string; // ISO8601
  tasks: string[]; // Task IDs
}

export interface TodayTask {
  id: string;
  taskId: string;
  timeblockCount: number; // Number of timeblocks to allocate
  completed: boolean;
  order: number;
}

export interface TodayPlan {
  id: string;
  userId: string; // Owner of this plan
  date: string;
  targetTimeblocks: number;
  timeblockDuration: number; // Duration in minutes for each timeblock
  tasks: TodayTask[];
  completedTimeblocks: number;
}

export interface PausePeriod {
  pauseStart: string; // ISO8601
  pauseEnd?: string; // ISO8601
}

export interface TimerSession {
  id: string;
  userId: string; // Owner of this session
  taskId: string;
  timeblockId: string;
  startTimestamp: string; // ISO8601
  pausePeriods: PausePeriod[];
  endTimestamp?: string; // ISO8601
  completed: boolean;
  productiveSeconds: number; // Changed from minutes to seconds for precision
  wastedSeconds: number; // Changed from minutes to seconds for precision
  isStopped: boolean; // True if permanently stopped, false if can be resumed
  isOnLongBreak: boolean; // True if on long break, can resume later
  notes?: string;
}

export interface ReportData {
  totalWorkTime: number; // minutes
  totalWastedTime: number; // minutes
  blocksCompleted: number;
  completionRatePercent: number;
  topWastedTasks: Array<{ taskId: string; taskTitle: string; wastedSeconds: number }>;
}
