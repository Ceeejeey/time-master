import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getTasks, getTimerSessions, getTodayPlan } from '@/lib/storage';
import { Task, TimerSession, TodayPlan } from '@/lib/types';
import { format } from 'date-fns';

interface DataContextType {
  tasks: Task[];
  sessions: TimerSession[];
  todayPlan: TodayPlan | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  refreshTodayPlan: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [tasksData, sessionsData] = await Promise.all([
        getTasks(),
        getTimerSessions(),
      ]);
      setTasks(tasksData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  const refreshTodayPlan = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const planData = await getTodayPlan(today);
      setTodayPlan(planData);
    } catch (error) {
      console.error('Error refreshing today plan:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshData(), refreshTodayPlan()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData, refreshTodayPlan]);

  useEffect(() => {
    loadAllData();

    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(() => {
      loadAllData();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <DataContext.Provider
      value={{
        tasks,
        sessions,
        todayPlan,
        isLoading,
        refreshData,
        refreshTodayPlan,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
