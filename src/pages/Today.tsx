import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Trash2, Target, CheckCircle2, Circle, Calendar as CalendarIcon, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getWorkplans, saveTodayPlan, clearAllTodayData, getCurrentUserId } from '@/lib/storage';
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
  const { tasks, sessions, todayPlan: contextTodayPlan, refreshTodayPlan, refreshData } = useData();
  const [workplans, setWorkplans] = useState<Workplan[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [targetTimeblocks, setTargetTimeblocks] = useState<number | null>(null);
  const [timeblockDuration, setTimeblockDuration] = useState<number | null>(null);
  const hasInitialized = useRef(false); // Track if values have been initialized
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timeblockCount, setTimeblockCount] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = format(currentDate, 'yyyy-MM-dd');

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
        const userId = getCurrentUserId();
        const newPlan: TodayPlan = {
          id: `today-${Date.now()}`,
          userId,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setCurrentDate(new Date()); // Update date on refresh
      await Promise.all([refreshData(), refreshTodayPlan(), loadData()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(currentY - startY, 80));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      await handleRefresh();
    }
    setStartY(0);
    setPullDistance(0);
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
      const userId = getCurrentUserId();
      const newPlan: TodayPlan = {
        id: `today-${Date.now()}`,
        userId,
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
    <div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-14 left-0 right-0 flex justify-center z-50 transition-opacity"
          style={{ 
            opacity: pullDistance / 60,
            transform: `translateY(${Math.min(pullDistance - 20, 40)}px)` 
          }}
        >
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${pullDistance > 60 ? 'animate-spin' : ''}`} />
            <span className="text-sm">{pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>
        </div>
      )}
      
      {isRefreshing && (
        <div className="fixed top-14 left-0 right-0 flex justify-center z-50">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-full px-0 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Today's Plan
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none touch-manipulation"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="sm:inline">Clear Today</span>
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
                  size="sm"
                  className="gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none touch-manipulation"
                  onClick={handleOpenGoalDialog}
                >
                  <Target className="w-4 h-4" />
                  <span className="sm:inline">Set Goal</span>
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
        <Card className="shadow-lg border-2 border-primary/30 dark:border-primary/40 bg-gradient-to-br from-primary/10 dark:from-primary/20 to-secondary/10 dark:to-secondary/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="w-5 h-5 text-primary" />
              Daily Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Goal</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">{todayPlan?.targetTimeblocks || 0}</p>
                <p className="text-xs text-muted-foreground">× {timeblockDuration}m</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl sm:text-3xl font-bold text-secondary">{totalAssignedBlocks}</p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-accent">{todayPlan?.completedTimeblocks || 0}</p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">{Math.max(0, remainingBlocks)}</p>
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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarIcon className="w-5 h-5" />
                  Today's To-Do List
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} planned
                </CardDescription>
              </div>
              <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 w-full sm:w-auto touch-manipulation">
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
          <CardContent className="p-4 sm:p-6">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-base sm:text-lg font-medium mb-2">No tasks planned for today</p>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Add tasks from your workplans to get started
                </p>
                <Button size="sm" onClick={() => setIsAddTaskDialogOpen(true)} className="gap-2 touch-manipulation">
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
                      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        isTaskFullyCompleted
                          ? 'bg-primary/10 dark:bg-primary/20 border-primary/50 dark:border-primary/60'
                          : todayTask.completed
                          ? 'bg-muted/50 dark:bg-muted/30 border-muted/60 dark:border-muted/80 opacity-75'
                          : 'bg-card dark:bg-card/50 border-border/60 dark:border-border hover:shadow-lg hover:border-primary/40 dark:hover:border-primary/60'
                      }`}
                    >
                      {/* Complete Button & Task Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleComplete(todayTask.id)}
                          className="flex-shrink-0 mt-1 touch-target"
                        >
                          {isTaskFullyCompleted || todayTask.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>

                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                            />
                            <h3 className={`font-semibold text-sm sm:text-base ${isTaskFullyCompleted ? 'line-through text-primary' : todayTask.completed ? 'line-through' : ''}`}>
                              {task.title}
                            </h3>
                            {isTaskFullyCompleted && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                                ALL DONE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span
                              className="px-2 py-1 rounded-full font-medium whitespace-nowrap"
                              style={{
                                backgroundColor: getPriorityColor(task.priorityQuadrant) + '20',
                                color: getPriorityColor(task.priorityQuadrant),
                              }}
                            >
                              {getPriorityLabel(task.priorityQuadrant)}
                            </span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {todayTask.timeblockCount} blocks × {timeblockDuration ?? 25} min
                            </span>
                            <span className="font-medium text-primary whitespace-nowrap">
                              = {totalMinutes} min
                            </span>
                          </div>
                          
                          {/* Timeblock Progress */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {completedBlocks > 0 && (
                              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded whitespace-nowrap">
                                ✓ {completedBlocks}/{todayTask.timeblockCount}
                              </span>
                            )}
                            {remainingBlocksForTask > 0 && (
                              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded whitespace-nowrap">
                                ⏱ {remainingBlocksForTask} left
                              </span>
                            )}
                            {remainingBlocksForTask === 0 && completedBlocks === 0 && (
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded whitespace-nowrap">
                                {todayTask.timeblockCount} to do
                              </span>
                            )}
                            {totalProductiveTime > 0 && (
                              <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                                📊 {formatTimeHMS(totalProductiveTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:flex-shrink-0 ml-9 sm:ml-0">
                        {!todayTask.completed && (
                          <Link to={`/timer?taskId=${task.id}`} className="flex-1 sm:flex-none">
                            <Button size="sm" className="gap-2 w-full sm:w-auto touch-manipulation">
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTask(todayTask.id)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
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
