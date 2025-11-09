import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getTasks, getTimerSessions, getTodayPlan } from '@/lib/storage';
import { Task, TimerSession, TodayPlan } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setTasks([]);
      setSessions([]);
      return;
    }
    
    try {
      const [tasksData, sessionsData] = await Promise.all([
        getTasks(),
        getTimerSessions(),
      ]);
      setTasks(tasksData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Reset data on error
      setTasks([]);
      setSessions([]);
    }
  }, [user]);

  const refreshTodayPlan = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!user) {
      setTodayPlan(null);
      return;
    }
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const planData = await getTodayPlan(today);
      setTodayPlan(planData);
    } catch (error) {
      console.error('Error refreshing today plan:', error);
      setTodayPlan(null);
    }
  }, [user]);

  const loadAllData = useCallback(async () => {
    // Don't load if user is not authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      await Promise.all([refreshData(), refreshTodayPlan()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData, refreshTodayPlan, user]);

  useEffect(() => {
    // Wait for auth to complete before loading data
    if (authLoading) {
      console.log('DataContext: Waiting for authentication to complete...');
      return;
    }

    // Only load data if user is authenticated
    if (user) {
      console.log('DataContext: User authenticated, loading data...', user.email);
      loadAllData();

      // Auto-refresh every 3 seconds for real-time updates
      const interval = setInterval(() => {
        loadAllData();
      }, 3000);

      return () => clearInterval(interval);
    } else {
      // Not authenticated, reset data
      console.log('DataContext: No user authenticated, clearing data');
      setTasks([]);
      setSessions([]);
      setTodayPlan(null);
      setIsLoading(false);
    }
  }, [authLoading, user, loadAllData]);

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
