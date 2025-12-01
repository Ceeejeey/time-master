import { db } from '../database';
import { User, Task, Workplan, Timeblock, TimerSession, TodayPlan, PriorityQuadrant } from './types';

// User Profile
export const getUser = async (): Promise<User | null> => {
  try {
    const result = await db.query('SELECT * FROM user_profile LIMIT 1');
    if (result.values && result.values.length > 0) {
      const row = result.values[0];
      return {
        id: row.id.toString(),
        name: row.username,
        email: '',
        isPremium: false
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
    console.log('[Storage] saveUser called for:', user.name);
    
    const existing = await getUser();
    console.log('[Storage] Existing user check:', existing ? 'Found' : 'None');
    
    if (existing) {
      console.log('[Storage] Updating existing user...');
      const result = await db.run(
        'UPDATE user_profile SET username = ? WHERE id = ?',
        [user.name, existing.id]
      );
      console.log('[Storage] Update result:', result);
    } else {
      console.log('[Storage] Inserting new user...');
      const result = await db.run(
        'INSERT INTO user_profile (username, profilePic) VALUES (?, ?)',
        [user.name, '']
      );
      console.log('[Storage] Insert result:', result);
    }
    
    console.log('[Storage] ✓ User saved successfully');
  } catch (error) {
    console.error('[Storage] ✗ Error saving user:', error);
    throw error;
  }
};

export const saveProfilePicture = async (picturePath: string): Promise<void> => {
  try {
    await db.run('UPDATE user_profile SET profilePic = ? WHERE id = 1', [picturePath]);
  } catch (error) {
    console.error('Error saving profile picture:', error);
    throw error;
  }
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY createdAt DESC');
    if (!result.values) return [];
    
    return result.values.map((row: Record<string, unknown>) => ({
      id: row.id.toString(),
      userId: '1',
      title: row.title as string,
      description: row.description as string || '',
      priorityQuadrant: row.priorityQuadrant as string || 'not_essential_not_immediate',
      assignedTimeblocks: [],
      estimatedTotalTimeMinutes: row.estimatedTotalTimeMinutes as number || 0,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {}
    }));
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const result = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!result.values || result.values.length === 0) return null;
    
    const row = result.values[0];
    return {
      id: row.id.toString(),
      userId: '1',
      title: row.title as string,
      description: row.description as string || '',
      priorityQuadrant: (row.priorityQuadrant as string || 'not_essential_not_immediate') as PriorityQuadrant,
      assignedTimeblocks: [],
      estimatedTotalTimeMinutes: row.estimatedTotalTimeMinutes as number || 0,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {}
    };
  } catch (error) {
    console.error('Error getting task:', error);
    return null;
  }
};

export const saveTask = async (task: Task): Promise<string> => {
  try {
    const metadata = JSON.stringify(task.metadata || {});
    
    // Check if task exists by querying the database
    const existing = task.id ? await db.query('SELECT id FROM tasks WHERE id = ?', [task.id]) : null;
    const taskExists = existing?.values && existing.values.length > 0;
    
    if (taskExists) {
      // Update existing task
      console.log('[Storage] Updating existing task:', task.id);
      await db.run(
        `UPDATE tasks SET 
          title = ?, description = ?, priorityQuadrant = ?, 
          estimatedTotalTimeMinutes = ?, metadata = ?
        WHERE id = ?`,
        [task.title, task.description, task.priorityQuadrant, 
         task.estimatedTotalTimeMinutes, metadata, task.id]
      );
      console.log('[Storage] ✓ Task updated:', task.id);
      return task.id;
    } else {
      // Insert new task
      console.log('[Storage] Inserting new task:', task.title);
      const result = await db.run(
        `INSERT INTO tasks (title, description, priorityQuadrant, estimatedTotalTimeMinutes, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [task.title, task.description, task.priorityQuadrant, 
         task.estimatedTotalTimeMinutes, metadata]
      );
      
      // Get the last inserted ID
      const lastId = result.changes?.lastId;
      console.log('[Storage] ✓ Task inserted with ID:', lastId);
      
      if (!lastId) {
        // Fallback: query for the most recent task
        const recent = await db.query(
          'SELECT id FROM tasks ORDER BY id DESC LIMIT 1'
        );
        const newId = recent.values?.[0]?.id?.toString();
        console.log('[Storage] ✓ Retrieved task ID from query:', newId);
        return newId || task.id;
      }
      
      return lastId.toString();
    }
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Workplans
export const getWorkplans = async (): Promise<Workplan[]> => {
  try {
    const result = await db.query('SELECT * FROM workplans ORDER BY createdAt DESC');
    if (!result.values) return [];
    
    const workplans = result.values.map((row: Record<string, unknown>) => {
      const tasks = row.tasks ? JSON.parse(row.tasks as string) : [];
      // Ensure all task IDs are strings
      const taskIds = tasks.map((id: string | number) => String(id));
      console.log('[Storage] Workplan:', row.title, 'has tasks:', taskIds);
      return {
        id: row.id.toString(),
        userId: '1',
        title: row.title as string,
        scope: row.scope as 'day' | 'week' | 'month',
        startDate: row.startDate as string,
        endDate: row.endDate as string,
        tasks: taskIds
      };
    });
    
    console.log('[Storage] ✓ Loaded', workplans.length, 'workplans');
    return workplans;
  } catch (error) {
    console.error('[Storage] Error getting workplans:', error);
    return [];
  }
};

export const saveWorkplan = async (workplan: Workplan): Promise<void> => {
  try {
    const tasks = JSON.stringify(workplan.tasks || []);
    console.log('[Storage] Saving workplan:', workplan.title, 'with tasks:', workplan.tasks);
    
    // Check if workplan exists by querying the database
    const existing = workplan.id ? await db.query('SELECT id FROM workplans WHERE id = ?', [workplan.id]) : null;
    const workplanExists = existing?.values && existing.values.length > 0;
    
    if (workplanExists) {
      // Update existing workplan
      console.log('[Storage] Updating existing workplan:', workplan.id);
      await db.run(
        `UPDATE workplans SET 
          title = ?, scope = ?, startDate = ?, endDate = ?, tasks = ?
        WHERE id = ?`,
        [workplan.title, workplan.scope, workplan.startDate, workplan.endDate, tasks, workplan.id]
      );
      console.log('[Storage] ✓ Workplan updated');
    } else {
      // Insert new workplan
      console.log('[Storage] Inserting new workplan');
      await db.run(
        `INSERT INTO workplans (title, scope, startDate, endDate, tasks)
         VALUES (?, ?, ?, ?, ?)`,
        [workplan.title, workplan.scope, workplan.startDate, workplan.endDate, tasks]
      );
      console.log('[Storage] ✓ Workplan inserted');
    }
  } catch (error) {
    console.error('Error saving workplan:', error);
    throw error;
  }
};

export const deleteWorkplan = async (id: string): Promise<void> => {
  try {
    await db.run('DELETE FROM workplans WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting workplan:', error);
    throw error;
  }
};

// Timeblocks
export const getTimeblocks = async (): Promise<Timeblock[]> => {
  try {
    const result = await db.query('SELECT * FROM timeblocks ORDER BY createdAt DESC');
    if (!result.values) return [];
    
    return result.values.map((row: Record<string, unknown>) => ({
      id: row.id.toString(),
      durationMinutes: row.durationMinutes as number,
      label: row.label as string
    }));
  } catch (error) {
    console.error('Error getting timeblocks:', error);
    return [];
  }
};

export const saveTimeblock = async (timeblock: Timeblock): Promise<void> => {
  try {
    // Check if timeblock exists by querying the database
    const existing = timeblock.id ? await db.query('SELECT id FROM timeblocks WHERE id = ?', [timeblock.id]) : null;
    const timeblockExists = existing?.values && existing.values.length > 0;
    
    if (timeblockExists) {
      await db.run(
        'UPDATE timeblocks SET durationMinutes = ?, label = ? WHERE id = ?',
        [timeblock.durationMinutes, timeblock.label, timeblock.id]
      );
    } else {
      await db.run(
        'INSERT INTO timeblocks (durationMinutes, label) VALUES (?, ?)',
        [timeblock.durationMinutes, timeblock.label]
      );
    }
  } catch (error) {
    console.error('Error saving timeblock:', error);
    throw error;
  }
};

export const deleteTimeblock = async (id: string): Promise<void> => {
  try {
    await db.run('DELETE FROM timeblocks WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting timeblock:', error);
    throw error;
  }
};

// Timer Sessions
export const getTimerSessions = async (): Promise<TimerSession[]> => {
  try {
    const result = await db.query('SELECT * FROM sessions ORDER BY createdAt DESC');
    if (!result.values) return [];
    
    return result.values.map((row: Record<string, unknown>) => ({
      id: row.id.toString(),
      userId: '1',
      taskId: row.taskId as string,
      timeblockId: row.timeblockId as string,
      startTimestamp: row.startTimestamp as string,
      endTimestamp: row.endTimestamp as string | undefined,
      pausePeriods: row.pausePeriods ? JSON.parse(row.pausePeriods as string) : [],
      completed: row.completed === 1,
      productiveSeconds: row.productiveSeconds as number || 0,
      wastedSeconds: row.wastedSeconds as number || 0,
      isStopped: row.isStopped === 1,
      isOnLongBreak: row.isOnLongBreak === 1,
      notes: row.notes as string | undefined
    }));
  } catch (error) {
    console.error('Error getting timer sessions:', error);
    return [];
  }
};

export const saveTimerSession = async (session: TimerSession): Promise<void> => {
  try {
    const pausePeriods = JSON.stringify(session.pausePeriods || []);
    
    const values = [
      session.taskId,
      session.timeblockId,
      session.startTimestamp,
      session.endTimestamp || null,
      session.productiveSeconds || 0,
      session.wastedSeconds || 0,
      pausePeriods,
      session.completed ? 1 : 0,
      session.isStopped ? 1 : 0,
      session.isOnLongBreak ? 1 : 0,
      session.notes || ''
    ];

    if (session.id && session.id.startsWith('session-')) {
      // Check if exists first
      const existing = await db.query('SELECT id FROM sessions WHERE id = ?', [session.id.replace('session-', '')]);
      if (existing.values && existing.values.length > 0) {
        await db.run(
          `UPDATE sessions SET 
            taskId = ?, timeblockId = ?, startTimestamp = ?, endTimestamp = ?,
            productiveSeconds = ?, wastedSeconds = ?, pausePeriods = ?,
            completed = ?, isStopped = ?, isOnLongBreak = ?, notes = ?
          WHERE id = ?`,
          [...values, session.id.replace('session-', '')]
        );
      } else {
        await db.run(
          `INSERT INTO sessions (taskId, timeblockId, startTimestamp, endTimestamp,
            productiveSeconds, wastedSeconds, pausePeriods, completed, isStopped, isOnLongBreak, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values
        );
      }
    } else {
      await db.run(
        `INSERT INTO sessions (taskId, timeblockId, startTimestamp, endTimestamp,
          productiveSeconds, wastedSeconds, pausePeriods, completed, isStopped, isOnLongBreak, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
    }
  } catch (error) {
    console.error('Error saving timer session:', error);
    throw error;
  }
};

export const deleteTimerSession = async (id: string): Promise<void> => {
  try {
    await db.run('DELETE FROM sessions WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting timer session:', error);
    throw error;
  }
};

// Today Plan
export const getTodayPlan = async (date: string): Promise<TodayPlan | null> => {
  try {
    const result = await db.query('SELECT * FROM today_plans WHERE date = ? LIMIT 1', [date]);
    if (result.values && result.values.length > 0) {
      const row = result.values[0];
      return {
        id: row.id.toString(),
        userId: '1',
        date: row.date as string,
        targetTimeblocks: row.targetTimeblocks as number,
        timeblockDuration: row.timeblockDuration as number,
        tasks: row.tasks ? JSON.parse(row.tasks as string) : [],
        completedTimeblocks: row.completedTimeblocks as number
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
    const tasks = JSON.stringify(plan.tasks || []);
    
    const existing = await getTodayPlan(plan.date);
    if (existing) {
      await db.run(
        `UPDATE today_plans SET 
          targetTimeblocks = ?, timeblockDuration = ?, tasks = ?, completedTimeblocks = ?
        WHERE date = ?`,
        [plan.targetTimeblocks, plan.timeblockDuration, tasks, plan.completedTimeblocks, plan.date]
      );
    } else {
      await db.run(
        `INSERT INTO today_plans (date, targetTimeblocks, timeblockDuration, tasks, completedTimeblocks)
         VALUES (?, ?, ?, ?, ?)`,
        [plan.date, plan.targetTimeblocks, plan.timeblockDuration, tasks, plan.completedTimeblocks]
      );
    }
  } catch (error) {
    console.error('Error saving today plan:', error);
    throw error;
  }
};

export const clearAllTodayData = async (date: string): Promise<void> => {
  try {
    await db.run('DELETE FROM today_plans WHERE date = ?', [date]);
  } catch (error) {
    console.error('Error clearing today data:', error);
    throw error;
  }
};

export const deleteTodayPlan = async (id: string): Promise<void> => {
  try {
    await db.run('DELETE FROM today_plans WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting today plan:', error);
    throw error;
  }
};

// Initialize default data
export const initializeDefaultData = async (): Promise<void> => {
  try {
    const user = await getUser();
    if (!user) {
      // User will be created during onboarding
      console.log('No user found - onboarding required');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
};

// Helper for getting current user ID (always returns '1' for local-only app)
export const getCurrentUserId = (): string => '1';
