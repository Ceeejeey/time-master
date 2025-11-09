import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from './appwrite.js';
import { 
  User, Workplan, Task, Timeblock, TimerSession, 
  TodayPlan 
} from './types';

// User
export const getUser = async (): Promise<User | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER,
      [Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        id: doc.$id,
        name: doc.name,
        isPremium: doc.isPremium,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const existing = await getUser();
    
    if (existing) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER,
        existing.id,
        {
          name: user.name,
          isPremium: user.isPremium,
        }
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER,
        user.id || ID.unique(),
        {
          name: user.name,
          isPremium: user.isPremium,
        }
      );
    }
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Workplans
export const getWorkplans = async (): Promise<Workplan[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.WORKPLANS
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      scope: doc.scope,
      startDate: doc.startDate,
      endDate: doc.endDate,
      tasks: Array.isArray(doc.tasks) ? doc.tasks : [],
    }));
  } catch (error) {
    console.error('Error getting workplans:', error);
    return [];
  }
};

export const saveWorkplan = async (workplan: Workplan): Promise<void> => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.WORKPLANS,
      [Query.equal('$id', workplan.id)]
    );
    
    const data = {
      title: workplan.title,
      scope: workplan.scope,
      startDate: workplan.startDate,
      endDate: workplan.endDate,
      tasks: workplan.tasks || [],
    };
    
    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.WORKPLANS,
        workplan.id,
        data
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.WORKPLANS,
        workplan.id,
        data
      );
    }
  } catch (error) {
    console.error('Error saving workplan:', error);
    throw error;
  }
};

export const deleteWorkplan = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.WORKPLANS,
      id
    );
  } catch (error) {
    console.error('Error deleting workplan:', error);
    throw error;
  }
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TASKS
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      priorityQuadrant: doc.priorityQuadrant,
      assignedTimeblocks: Array.isArray(doc.assignedTimeblocks) 
        ? doc.assignedTimeblocks 
        : [],
      estimatedTotalTimeMinutes: doc.estimatedTotalTimeMinutes || 0,
      metadata: typeof doc.metadata === 'string' 
        ? JSON.parse(doc.metadata) 
        : (doc.metadata || {}),
    }));
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      id
    );
    
    return {
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      priorityQuadrant: doc.priorityQuadrant,
      assignedTimeblocks: Array.isArray(doc.assignedTimeblocks) 
        ? doc.assignedTimeblocks 
        : [],
      estimatedTotalTimeMinutes: doc.estimatedTotalTimeMinutes || 0,
      metadata: typeof doc.metadata === 'string' 
        ? JSON.parse(doc.metadata) 
        : (doc.metadata || {}),
    };
  } catch (error) {
    console.error('Error getting task:', error);
    return null;
  }
};

export const saveTask = async (task: Task): Promise<void> => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      [Query.equal('$id', task.id)]
    );
    
    const data = {
      title: task.title,
      description: task.description,
      priorityQuadrant: task.priorityQuadrant,
      assignedTimeblocks: task.assignedTimeblocks || [],
      estimatedTotalTimeMinutes: task.estimatedTotalTimeMinutes || 0,
      metadata: JSON.stringify(task.metadata || {}),
    };
    
    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        task.id,
        data
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TASKS,
        task.id,
        data
      );
    }
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.TASKS,
      id
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Timeblocks
export const getTimeblocks = async (): Promise<Timeblock[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TIMEBLOCKS
    );
    
    if (response.documents.length > 0) {
      return response.documents.map(doc => ({
        id: doc.$id,
        durationMinutes: doc.durationMinutes,
        label: doc.label,
      }));
    }
    
    return getDefaultTimeblocks();
  } catch (error) {
    console.error('Error getting timeblocks:', error);
    return getDefaultTimeblocks();
  }
};

export const getDefaultTimeblocks = (): Timeblock[] => [
  { id: 'tb-15', durationMinutes: 15, label: '15 min' },
  { id: 'tb-30', durationMinutes: 30, label: '30 min' },
  { id: 'tb-45', durationMinutes: 45, label: '45 min' },
  { id: 'tb-60', durationMinutes: 60, label: '60 min' },
];

export const saveTimeblock = async (timeblock: Timeblock): Promise<void> => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TIMEBLOCKS,
      [Query.equal('$id', timeblock.id)]
    );
    
    const data = {
      durationMinutes: timeblock.durationMinutes,
      label: timeblock.label,
    };
    
    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TIMEBLOCKS,
        timeblock.id,
        data
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TIMEBLOCKS,
        timeblock.id,
        data
      );
    }
  } catch (error) {
    console.error('Error saving timeblock:', error);
    throw error;
  }
};

// Timer Sessions
export const getTimerSessions = async (): Promise<TimerSession[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SESSIONS,
      [Query.orderDesc('$createdAt')]
    );
    
    return response.documents.map(doc => {
      // Deserialize each JSON string back to PausePeriod object
      const pausePeriods = Array.isArray(doc.pausePeriods)
        ? doc.pausePeriods.map((periodStr: string) => {
            try {
              return typeof periodStr === 'string' ? JSON.parse(periodStr) : periodStr;
            } catch {
              return periodStr;
            }
          })
        : [];
      
      return {
        id: doc.$id,
        taskId: doc.taskId,
        timeblockId: doc.timeblockId,
        startTimestamp: doc.startTimestamp,
        endTimestamp: doc.endTimestamp,
        productiveSeconds: doc.productiveSeconds || 0,
        wastedSeconds: doc.wastedSeconds || 0,
        pausePeriods,
        completed: doc.completed || false,
        isStopped: doc.isStopped || false,
        isOnLongBreak: doc.isOnLongBreak || false,
        notes: doc.notes,
      };
    });
  } catch (error) {
    console.error('Error getting timer sessions:', error);
    return [];
  }
};

export const saveTimerSession = async (session: TimerSession): Promise<void> => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SESSIONS,
      [Query.equal('$id', session.id)]
    );
    
    // Build data object, excluding undefined fields
    const data: Record<string, unknown> = {
      taskId: session.taskId,
      timeblockId: session.timeblockId,
      startTimestamp: session.startTimestamp,
      productiveSeconds: session.productiveSeconds || 0,
      wastedSeconds: session.wastedSeconds || 0,
      // Serialize each PausePeriod object to JSON string for the array
      pausePeriods: (session.pausePeriods || []).map(period => JSON.stringify(period)),
      completed: session.completed || false,
      isStopped: session.isStopped || false,
      isOnLongBreak: session.isOnLongBreak || false,
      notes: session.notes || '',
    };
    
    // Only include endTimestamp if it exists
    if (session.endTimestamp) {
      data.endTimestamp = session.endTimestamp;
    }
    
    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        session.id,
        data
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        session.id,
        data
      );
    }
  } catch (error) {
    console.error('Error saving timer session:', error);
    throw error;
  }
};

// Today Plan
export const getTodayPlan = async (date: string): Promise<TodayPlan | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TODAY_PLANS,
      [Query.equal('date', date)]
    );
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      // Deserialize each JSON string back to TodayTask object
      const tasks = Array.isArray(doc.tasks) 
        ? doc.tasks.map((taskStr: string) => {
            try {
              return typeof taskStr === 'string' ? JSON.parse(taskStr) : taskStr;
            } catch {
              return taskStr;
            }
          })
        : [];
      
      return {
        id: doc.$id,
        date: doc.date,
        targetTimeblocks: doc.targetTimeblocks || 0,
        timeblockDuration: doc.timeblockDuration || 30,
        tasks,
        completedTimeblocks: doc.completedTimeblocks || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting today plan:', error);
    return null;
  }
};

export const saveTodayPlan = async (plan: TodayPlan): Promise<void> => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TODAY_PLANS,
      [Query.equal('date', plan.date)]
    );
    
    const data = {
      date: plan.date,
      targetTimeblocks: plan.targetTimeblocks || 0,
      timeblockDuration: plan.timeblockDuration || 30,
      // Serialize each TodayTask object as JSON string for the array
      tasks: (plan.tasks || []).map(task => JSON.stringify(task)),
      completedTimeblocks: plan.completedTimeblocks || 0,
    };
    
    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.TODAY_PLANS,
        existing.documents[0].$id,
        data
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TODAY_PLANS,
        plan.id || ID.unique(),
        data
      );
    }
  } catch (error) {
    console.error('Error saving today plan:', error);
    throw error;
  }
};

export const deleteTodayPlan = async (date: string): Promise<void> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TODAY_PLANS,
      [Query.equal('date', date)]
    );
    
    if (response.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.TODAY_PLANS,
        response.documents[0].$id
      );
    }
  } catch (error) {
    console.error('Error deleting today plan:', error);
    throw error;
  }
};

// Clear all today's data (plan and sessions)
export const clearAllTodayData = async (date: string): Promise<void> => {
  try {
    // Delete today's plan
    const planResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TODAY_PLANS,
      [Query.equal('date', date)]
    );
    
    if (planResponse.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.TODAY_PLANS,
        planResponse.documents[0].$id
      );
    }

    // Delete all timer sessions for today
    // Sessions don't have a date field, so we need to get all sessions
    // and filter by startTimestamp
    const todayStart = new Date(date + 'T00:00:00').toISOString();
    const todayEnd = new Date(date + 'T23:59:59').toISOString();
    
    const sessionsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SESSIONS,
      [
        Query.greaterThanEqual('startTimestamp', todayStart),
        Query.lessThanEqual('startTimestamp', todayEnd),
        Query.limit(100)
      ]
    );
    
    for (const session of sessionsResponse.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        session.$id
      );
    }
  } catch (error) {
    console.error('Error clearing all today data:', error);
    throw error;
  }
};

// Initialize default data
export const initializeDefaultData = async (): Promise<void> => {
  try {
    const user = await getUser();
    if (!user) {
      await saveUser({
        id: 'user-1',
        name: 'User',
        isPremium: false,
      });
    }

    const timeblocks = await getTimeblocks();
    if (timeblocks.length === 0 || timeblocks === getDefaultTimeblocks()) {
      for (const block of getDefaultTimeblocks()) {
        await saveTimeblock(block);
      }
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};
