import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Play,
  Trash2,
  Target,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  getWorkplans,
  saveTodayPlan,
  clearAllTodayData,
  getCurrentUserId,
} from "@/lib/storage";
import { Workplan, TodayPlan, TodayTask } from "@/lib/types";
import { format } from "date-fns";
import { getPriorityLabel, getPriorityColor } from "@/lib/priority";
import { toast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { formatTimeHMS } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";

const Today = () => {
  const navigate = useNavigate();
  const {
    tasks,
    sessions,
    todayPlan: contextTodayPlan,
    refreshTodayPlan,
    refreshData,
  } = useData();
  const [workplans, setWorkplans] = useState<Workplan[]>([]);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [targetTimeblocks, setTargetTimeblocks] = useState<number | null>(null);
  const [timeblockDuration, setTimeblockDuration] = useState<number | null>(
    null
  );
  const hasInitialized = useRef(false); // Track if values have been initialized
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = format(currentDate, "yyyy-MM-dd");

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Sync with context
  useEffect(() => {
    if (contextTodayPlan) {
      setTodayPlan(contextTodayPlan);
      // Always sync values from database on initial load
      if (!hasInitialized.current) {
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
  }, [contextTodayPlan, today, refreshTodayPlan]);

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

  const handleRemoveTask = async (todayTaskId: string) => {
    if (!todayPlan) return;

    const updatedPlan = {
      ...todayPlan,
      tasks: todayPlan.tasks.filter((t) => t.id !== todayTaskId),
    };

    setTodayPlan(updatedPlan);
    await saveTodayPlan(updatedPlan);
    toast({ title: "Task removed" });
  };

  const handleToggleComplete = async (todayTaskId: string) => {
    if (!todayPlan) return;

    const updatedTasks = todayPlan.tasks.map((t) => {
      if (t.id === todayTaskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const completedCount = updatedTasks
      .filter((t) => t.completed)
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
        title: "Today's data cleared!",
        description:
          "All tasks and timer sessions for today have been removed.",
      });
    } catch (error) {
      console.error("Error clearing today data:", error);
      toast({
        title: "Error",
        description: "Failed to clear today's data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get available tasks from workplans
  const availableTasks = tasks.filter((task) => {
    // Check if task is in any workplan
    return workplans.some((wp) => wp.tasks.includes(task.id));
  });

  // Calculate completed timeblocks from sessions
  const getCompletedTimeblocks = (taskId: string) => {
    return sessions.filter(
      (s) => s.taskId === taskId && s.completed && s.isStopped
    ).length;
  };

  // Calculate total productive time for a task
  const getTotalProductiveTime = (taskId: string) => {
    return sessions
      .filter((s) => s.taskId === taskId && s.isStopped)
      .reduce((sum, s) => sum + (s.productiveSeconds || 0), 0);
  };

  const todayTasks = todayPlan?.tasks || [];
  const totalAssignedBlocks = todayTasks.reduce(
    (sum, t) => sum + t.timeblockCount,
    0
  );
  const progress = todayPlan
    ? (todayPlan.completedTimeblocks / todayPlan.targetTimeblocks) * 100
    : 0;
  const remainingBlocks = todayPlan
    ? todayPlan.targetTimeblocks - totalAssignedBlocks
    : 0;

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
            transform: `translateY(${Math.min(pullDistance - 20, 40)}px)`,
          }}
        >
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <RefreshCw
              className={`w-4 h-4 ${pullDistance > 60 ? "animate-spin" : ""}`}
            />
            <span className="text-sm">
              {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
            </span>
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
              {format(currentDate, "EEEE, MMMM d, yyyy")}
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
                    This will permanently delete all tasks and timer sessions
                    for today. This action cannot be undone.
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

            <Button
              size="sm"
              onClick={() => navigate("/today/goal")}
              className="gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none touch-manipulation"
              data-tutorial="set-goal-btn"
            >
              <Target className="w-4 h-4" />
              <span className="sm:inline">Set Goal</span>
            </Button>
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
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {todayPlan?.targetTimeblocks || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  × {timeblockDuration}m
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Assigned
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-secondary">
                  {totalAssignedBlocks}
                </p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-accent">
                  {todayPlan?.completedTimeblocks || 0}
                </p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Remaining
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                  {Math.max(0, remainingBlocks)}
                </p>
                <p className="text-xs text-muted-foreground">blocks</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
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
                  {todayTasks.length}{" "}
                  {todayTasks.length === 1 ? "task" : "tasks"} planned
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/today/task/new")}
                className="gap-2 w-full sm:w-auto touch-manipulation shadow-md"
                data-tutorial="add-today-task-btn"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-base sm:text-lg font-medium mb-2">
                  No tasks planned for today
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Add tasks from your workplans to get started
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate("/today/task/new")}
                  className="gap-2 touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((todayTask) => {
                  const task = tasks.find((t) => t.id === todayTask.taskId);
                  if (!task) return null;

                  const totalMinutes =
                    todayTask.timeblockCount * timeblockDuration;
                  const completedBlocks = getCompletedTimeblocks(task.id);
                  const remainingBlocksForTask =
                    todayTask.timeblockCount - completedBlocks;
                  const isTaskFullyCompleted = remainingBlocksForTask <= 0;
                  const totalProductiveTime = getTotalProductiveTime(task.id);

                  return (
                    <div
                      key={todayTask.id}
                      className={`
    group p-4 rounded-2xl border transition-all shadow-sm
    ${
      isTaskFullyCompleted
        ? "bg-primary/10 border-primary/50 shadow-primary/10"
        : todayTask.completed
        ? "bg-muted/40 border-muted-foreground/30"
        : "bg-card/50 border-zinc-200 dark:border-zinc-700 active:scale-[0.99]"
    }
  `}
                    >
                      {/* Top Area: Check + Title + Priority */}
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(todayTask.id)}
                          className="touch-manipulation mt-1"
                        >
                          {isTaskFullyCompleted || todayTask.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </button>

                        {/* Title + Chips */}
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-2 items-center flex-wrap mb-1">
                            {/* Priority Color Dot */}
                            <span
                              className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-zinc-900"
                              style={{
                                backgroundColor: getPriorityColor(
                                  task.priorityQuadrant
                                ),
                              }}
                            />

                            {/* Task Title */}
                            <h3
                              className={`font-semibold text-base ${
                                isTaskFullyCompleted
                                  ? "line-through text-primary"
                                  : todayTask.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </h3>

                            {/* Priority Chip */}
                            <span
                              className="px-2 py-0.5 rounded-full text-xs tracking-wide font-semibold border shadow-sm"
                              style={{
                                backgroundColor:
                                  getPriorityColor(task.priorityQuadrant) +
                                  "25",
                                color: getPriorityColor(task.priorityQuadrant),
                                borderColor:
                                  getPriorityColor(task.priorityQuadrant) +
                                  "40",
                              }}
                            >
                              {getPriorityLabel(task.priorityQuadrant)}
                            </span>

                            {/* Remaining Blocks */}
                            {remainingBlocksForTask > 0 && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm">
                                {remainingBlocksForTask} left
                              </span>
                            )}

                            {/* Completed Label */}
                            {isTaskFullyCompleted && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full shadow-sm">
                                ✓ COMPLETE
                              </span>
                            )}
                          </div>

                          {/* Time Info */}
                          <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                            <span>
                              {todayTask.timeblockCount} blocks ×{" "}
                              {timeblockDuration ?? 25} min
                            </span>
                            <span className="font-semibold text-primary">
                              = {totalMinutes} min
                            </span>
                          </div>

                          {/* Progress Chips */}
                          <div className="flex gap-2 flex-wrap">
                            {completedBlocks > 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-semibold shadow-sm">
                                ✓ {completedBlocks}/{todayTask.timeblockCount}
                              </span>
                            )}

                            {totalProductiveTime > 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold shadow-sm">
                                🎯 {formatTimeHMS(totalProductiveTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {!todayTask.completed && (
                          <Link
                            to={`/timer?taskId=${task.id}`}
                            className="flex-1"
                          >
                            <Button size="sm" className="w-full gap-2">
                              <Play className="w-4 h-4" />
                              Start
                            </Button>
                          </Link>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTask(todayTask.id)}
                          className="touch-manipulation"
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
