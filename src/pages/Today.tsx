import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Trash2, Target, CheckCircle2, Circle, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getWorkplans, saveTodayPlan, clearAllTodayData } from '@/lib/storage';
import { Workplan, TodayPlan, TodayTask } from '@/lib/types';
import { format } from 'date-fns';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority';
import { toast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { formatTimeHMS } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Today = () => {
  const { tasks, sessions, todayPlan: contextTodayPlan, refreshTodayPlan } = useData();
  const [workplans, setWorkplans] = useState<Workplan[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [targetTimeblocks, setTargetTimeblocks] = useState<number | null>(null);
  const [timeblockDuration, setTimeblockDuration] = useState<number | null>(null);
  const hasInitialized = useRef(false); // Track if values have been initialized

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timeblockCount, setTimeblockCount] = useState(1);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Sync with context - only update todayPlan, not form inputs while user is editing
  useEffect(() => {
    if (contextTodayPlan) {
      setTodayPlan(contextTodayPlan);
      // Always sync values from database on initial load or when dialog is closed
      if (!hasInitialized.current || !isGoalDialogOpen) {
        setTargetTimeblocks(contextTodayPlan.targetTimeblocks);
        setTimeblockDuration(contextTodayPlan.timeblockDuration);
        hasInitialized.current = true;
      }
    } else {
      // Create new today plan if none exists
      const createNewPlan = async () => {
        const newPlan: TodayPlan = {
          id: `today-${Date.now()}`,
          date: today,
          targetTimeblocks: 8,
          timeblockDuration: 25,
          tasks: [],
          completedTimeblocks: 0,
        };
        setTodayPlan(newPlan);
        setTargetTimeblocks(8);
        setTimeblockDuration(25);
        await saveTodayPlan(newPlan);
        await refreshTodayPlan();
      };
      createNewPlan();
    }
  }, [contextTodayPlan, today, refreshTodayPlan, isGoalDialogOpen]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const workplansData = await getWorkplans();
    setWorkplans(workplansData);
  };

  const handleSetGoal = async () => {
    if (!todayPlan || targetTimeblocks === null || timeblockDuration === null) return;

    const updatedPlan = {
      ...todayPlan,
      targetTimeblocks,
      timeblockDuration,
    };

    setTodayPlan(updatedPlan);
    await saveTodayPlan(updatedPlan);
    await refreshTodayPlan();
    setIsGoalDialogOpen(false);
    toast({ 
      title: 'Daily goal updated!',
      description: `${targetTimeblocks} × ${timeblockDuration} min = ${targetTimeblocks * timeblockDuration} min total`
    });
  };
  
  const handleOpenGoalDialog = () => {
    // Load current values from todayPlan when dialog opens
    if (todayPlan) {
      setTargetTimeblocks(todayPlan.targetTimeblocks);
      setTimeblockDuration(todayPlan.timeblockDuration);
    }
    setIsGoalDialogOpen(true);
  };

  const handleAddTask = async () => {
    if (!todayPlan || !selectedTaskId) return;

    const newTodayTask: TodayTask = {
      id: `today-task-${Date.now()}`,
      taskId: selectedTaskId,
      timeblockCount,
      completed: false,
      order: todayPlan.tasks.length,
    };

    const updatedPlan = {
      ...todayPlan,
      tasks: [...todayPlan.tasks, newTodayTask],
    };

    setTodayPlan(updatedPlan);
    await saveTodayPlan(updatedPlan);
    await refreshTodayPlan();
    setIsAddTaskDialogOpen(false);
    setSelectedTaskId('');
    setTimeblockCount(1);
    
    const task = tasks.find(t => t.id === selectedTaskId);
    toast({ 
      title: 'Task added to today!',
      description: `${task?.title} - ${timeblockCount} × ${timeblockDuration ?? todayPlan.timeblockDuration} min`
    });
  };

  const handleRemoveTask = async (todayTaskId: string) => {
    if (!todayPlan) return;

    const updatedPlan = {
      ...todayPlan,
      tasks: todayPlan.tasks.filter(t => t.id !== todayTaskId),
    };

    setTodayPlan(updatedPlan);
    await saveTodayPlan(updatedPlan);
    toast({ title: 'Task removed' });
  };

  const handleToggleComplete = async (todayTaskId: string) => {
    if (!todayPlan) return;

    const updatedTasks = todayPlan.tasks.map(t => {
      if (t.id === todayTaskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const completedCount = updatedTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.timeblockCount, 0);

    const updatedPlan = {
      ...todayPlan,
      tasks: updatedTasks,
      completedTimeblocks: completedCount,
    };

    setTodayPlan(updatedPlan);
    await saveTodayPlan(updatedPlan);
  };

  const handleClearTodayData = async () => {
    try {
      await clearAllTodayData(today);
      
      // Create a fresh plan
      const newPlan: TodayPlan = {
        id: `today-${Date.now()}`,
        date: today,
        targetTimeblocks: 8,
        timeblockDuration: 25,
        tasks: [],
        completedTimeblocks: 0,
      };
      setTodayPlan(newPlan);
      setTargetTimeblocks(8);
      setTimeblockDuration(25);
      await saveTodayPlan(newPlan);
      await refreshTodayPlan();
      
      toast({ 
        title: 'Today\'s data cleared!',
        description: 'All tasks and timer sessions for today have been removed.',
      });
    } catch (error) {
      console.error('Error clearing today data:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to clear today\'s data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get available tasks from workplans
  const availableTasks = tasks.filter(task => {
    // Check if task is in any workplan
    return workplans.some(wp => wp.tasks.includes(task.id));
  });

  // Calculate completed timeblocks from sessions
  const getCompletedTimeblocks = (taskId: string) => {
    return sessions.filter(s => s.taskId === taskId && s.completed && s.isStopped).length;
  };

  // Calculate total productive time for a task
  const getTotalProductiveTime = (taskId: string) => {
    return sessions
      .filter(s => s.taskId === taskId && s.isStopped)
      .reduce((sum, s) => sum + (s.productiveSeconds || 0), 0);
  };

  const todayTasks = todayPlan?.tasks || [];
  const totalAssignedBlocks = todayTasks.reduce((sum, t) => sum + t.timeblockCount, 0);
  const progress = todayPlan ? (todayPlan.completedTimeblocks / todayPlan.targetTimeblocks) * 100 : 0;
  const remainingBlocks = todayPlan ? todayPlan.targetTimeblocks - totalAssignedBlocks : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Today's Plan
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear Today
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all today's data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all tasks and timer sessions for today. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearTodayData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2 shadow-lg shadow-primary/20"
                  onClick={handleOpenGoalDialog}
                >
                  <Target className="w-4 h-4" />
                  Set Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Daily Goal</DialogTitle>
                  <DialogDescription>
                    Define your timeblock duration and how many you want to complete today
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Timeblock Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={timeblockDuration ?? 25}
                    onChange={e => setTimeblockDuration(parseInt(e.target.value) || 25)}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Popular choices: 25 (Pomodoro), 50, 90 minutes
                  </p>
                </div>
                <div>
                  <Label>Target Timeblocks</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={targetTimeblocks ?? 8}
                    onChange={e => setTargetTimeblocks(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommended: 6-10 timeblocks per day
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium mb-1">Total Time Goal</p>
                  <p className="text-2xl font-bold text-primary">
                    {(targetTimeblocks ?? 8) * (timeblockDuration ?? 25)} minutes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    = {Math.floor(((targetTimeblocks ?? 8) * (timeblockDuration ?? 25)) / 60)}h {((targetTimeblocks ?? 8) * (timeblockDuration ?? 25)) % 60}m
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSetGoal}>Set Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground">Goal</p>
                <p className="text-3xl font-bold text-primary">{todayPlan?.targetTimeblocks || 0}</p>
                <p className="text-xs text-muted-foreground">× {timeblockDuration}m</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-3xl font-bold text-secondary">{totalAssignedBlocks}</p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-accent">{todayPlan?.completedTimeblocks || 0}</p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-3xl font-bold text-muted-foreground">{Math.max(0, remainingBlocks)}</p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Today's To-Do List
                </CardTitle>
                <CardDescription>
                  {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} planned
                </CardDescription>
              </div>
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task to Today</DialogTitle>
                    <DialogDescription>Choose a task from your workplans and assign timeblocks</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Task</Label>
                      <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTasks.map(task => (
                            <SelectItem key={task.id} value={task.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                                />
                                {task.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number of Timeblocks</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={timeblockCount}
                        onChange={e => setTimeblockCount(parseInt(e.target.value) || 1)}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Each timeblock = {timeblockDuration} minutes • Total: {timeblockCount * timeblockDuration} min
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTask} disabled={!selectedTaskId}>
                      Add to Today
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">No tasks planned for today</p>
                <p className="text-muted-foreground mb-4">
                  Add tasks from your workplans to get started
                </p>
                <Button onClick={() => setIsAddTaskDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(todayTask => {
                  const task = tasks.find(t => t.id === todayTask.taskId);
                  if (!task) return null;

                  const totalMinutes = todayTask.timeblockCount * timeblockDuration;
                  const completedBlocks = getCompletedTimeblocks(task.id);
                  const remainingBlocksForTask = todayTask.timeblockCount - completedBlocks;
                  const isTaskFullyCompleted = remainingBlocksForTask <= 0;
                  const totalProductiveTime = getTotalProductiveTime(task.id);

                  return (
                    <div
                      key={todayTask.id}
                      className={`group flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        isTaskFullyCompleted
                          ? 'bg-primary/5 border-primary/50'
                          : todayTask.completed
                          ? 'bg-muted/50 border-muted opacity-75'
                          : 'bg-card border-border hover:shadow-lg hover:border-primary/30'
                      }`}
                    >
                      {/* Complete Button */}
                      <button
                        onClick={() => handleToggleComplete(todayTask.id)}
                        className="flex-shrink-0"
                      >
                        {isTaskFullyCompleted || todayTask.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                          />
                          <h3 className={`font-semibold ${isTaskFullyCompleted ? 'line-through text-primary' : todayTask.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </h3>
                          {isTaskFullyCompleted && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                              ALL DONE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: getPriorityColor(task.priorityQuadrant) + '20',
                              color: getPriorityColor(task.priorityQuadrant),
                            }}
                          >
                            {getPriorityLabel(task.priorityQuadrant)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {todayTask.timeblockCount} blocks × {timeblockDuration ?? 25} min
                          </span>
                          <span className="text-xs font-medium text-primary">
                            = {totalMinutes} min total
                          </span>
                          
                          {/* Timeblock Progress */}
                          <div className="flex items-center gap-2">
                            {completedBlocks > 0 && (
                              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                                ✓ {completedBlocks}/{todayTask.timeblockCount} completed
                              </span>
                            )}
                            {remainingBlocksForTask > 0 && (
                              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                ⏱ {remainingBlocksForTask} remaining
                              </span>
                            )}
                            {remainingBlocksForTask === 0 && completedBlocks === 0 && (
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {todayTask.timeblockCount} blocks to do
                              </span>
                            )}
                          </div>
                          
                          {totalProductiveTime > 0 && (
                            <span className="text-xs text-blue-600 font-medium">
                              📊 {formatTimeHMS(totalProductiveTime)} worked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!todayTask.completed && (
                          <Link to={`/timer?taskId=${task.id}`}>
                            <Button size="sm" className="gap-2">
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTask(todayTask.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Today;
