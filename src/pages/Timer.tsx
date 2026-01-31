import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Clock, Coffee, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getTimeblocks, getTodayPlan } from '@/lib/storage';
import { Timeblock, TodayPlan } from '@/lib/types';
import { useGlobalTimer } from '@/contexts/TimerContext';
import { useBreak } from '@/contexts/BreakContext';
import { getPriorityColor, getPriorityLabel } from '@/lib/priority';
import { format } from 'date-fns';
import { formatTimeHMS } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { useTutorial } from '@/contexts/TutorialContext';

const Timer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tasks } = useData();
  const { handleAction } = useTutorial();
  const { openBreakDialog } = useBreak();
  const [timeblocks, setTimeblocks] = useState<Timeblock[]>([]);
  const [localTodayPlan, setLocalTodayPlan] = useState<TodayPlan | null>(null);
  const [isFromToday, setIsFromToday] = useState(false);

  const {
    session,
    selectedTask,
    selectedTimeblock,
    productiveSeconds,
    wastedSeconds,
    isPaused,
    isRunning,
    isStopped,
    isOnLongBreak,
    isTargetReached,
    remainingBlocks,
    setSelectedTask,
    setSelectedTimeblock,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resumeFromLongBreak,
    getProgress,
    startNextBlock,
    dismissTargetReached,
    resetTimer,
  } = useGlobalTimer();

  // Tutorial triggers for timer
  useEffect(() => {
    if (productiveSeconds >= 30) {
      handleAction('timer-focus-complete');
    }
    if (wastedSeconds >= 30) {
      handleAction('timer-waste-complete');
    }
  }, [productiveSeconds, wastedSeconds, handleAction]);

  useEffect(() => {
    const loadData = async () => {
      const timeblocksData = await getTimeblocks();
      setTimeblocks(timeblocksData);

      // Only pre-select task if timer is not already running
      if (!isRunning && !isOnLongBreak) {
        const taskId = searchParams.get('taskId');
        if (taskId) {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            setSelectedTask(task);
            
            // Check if this task is from today's plan
            const today = format(new Date(), 'yyyy-MM-dd');
            const todayPlanData = await getTodayPlan(today);
            if (todayPlanData && todayPlanData.tasks.some(t => t.taskId === taskId)) {
              setLocalTodayPlan(todayPlanData);
              setIsFromToday(true);
              
              // Create a virtual timeblock with today's duration
              const virtualTimeblock: Timeblock = {
                id: `today-${todayPlanData.timeblockDuration}`,
                label: `${todayPlanData.timeblockDuration} min`,
                durationMinutes: todayPlanData.timeblockDuration,
              };
              setSelectedTimeblock(virtualTimeblock);
            } else {
              // Default timeblock for non-today tasks
              if (timeblocksData.length > 0) {
                setSelectedTimeblock(timeblocksData[1]); // 30 min default
              }
            }
          }
        } else {
          // Default timeblock when no task selected
          if (timeblocksData.length > 0 && !selectedTimeblock) {
            setSelectedTimeblock(timeblocksData[1]); // 30 min default
          }
        }
      }
    };
    loadData();
  }, [searchParams, tasks, isRunning, isOnLongBreak]);

  const formatTime = (seconds: number) => {
    return formatTimeHMS(seconds);
  };

  const targetSeconds = selectedTimeblock ? selectedTimeblock.durationMinutes * 60 : 0;
  const progress = getProgress();

  const handleStartNextBlock = () => {
    startNextBlock();
  };

  const handleFinishTask = () => {
    dismissTargetReached();
    resetTimer();
    navigate('/today');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-2 sm:p-4">
      {/* Target Reached Dialog */}
      <AlertDialog open={isTargetReached} onOpenChange={(open) => !open && dismissTargetReached()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              🎉 Timeblock Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p>
                Great job! You've completed a <strong>{selectedTimeblock?.durationMinutes} minute</strong> focus session on <strong>"{selectedTask?.title}"</strong>.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Productive</p>
                  <p className="text-lg font-bold text-primary">{formatTime(productiveSeconds)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Wasted</p>
                  <p className="text-lg font-bold text-destructive">{formatTime(wastedSeconds)}</p>
                </div>
              </div>

              {remainingBlocks > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    📋 {remainingBlocks} more block{remainingBlocks > 1 ? 's' : ''} remaining for this task
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleFinishTask} className="w-full sm:w-auto">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Done for now
            </AlertDialogCancel>
            {remainingBlocks > 0 && (
              <AlertDialogAction onClick={handleStartNextBlock} className="w-full sm:w-auto">
                <ChevronRight className="w-4 h-4 mr-2" />
                Start Next Block
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Focus Timer</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Stay focused and track your productivity</p>
        </div>

        {!isRunning && !isOnLongBreak && !isStopped ? (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Setup Timer</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {isFromToday 
                  ? `Ready to work on "${selectedTask?.title}" for ${localTodayPlan?.timeblockDuration} minutes`
                  : "Select a task and timeblock to begin"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Task</label>
                <Select
                  value={selectedTask?.id}
                  onValueChange={async (id) => {
                    const task = tasks.find(t => t.id === id);
                    setSelectedTask(task || null);
                    
                    if (task) {
                      // Check if this task is from today's plan
                      const today = format(new Date(), 'yyyy-MM-dd');
                      const todayPlanData = await getTodayPlan(today);
                      if (todayPlanData && todayPlanData.tasks.some(t => t.taskId === id)) {
                        setLocalTodayPlan(todayPlanData);
                        setIsFromToday(true);
                        
                        // Create a virtual timeblock with today's duration
                        const virtualTimeblock: Timeblock = {
                          id: `today-${todayPlanData.timeblockDuration}`,
                          label: `${todayPlanData.timeblockDuration} min`,
                          durationMinutes: todayPlanData.timeblockDuration,
                        };
                        setSelectedTimeblock(virtualTimeblock);
                      } else {
                        setIsFromToday(false);
                        setLocalTodayPlan(null);
                        // Set default timeblock for non-today tasks
                        if (timeblocks.length > 0) {
                          setSelectedTimeblock(timeblocks[1]); // 30 min default
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="touch-manipulation h-11">
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(task => (
                      <SelectItem key={task.id} value={task.id} className="py-3 touch-manipulation">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                          />
                          <span className="truncate text-sm sm:text-base">{task.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isFromToday && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Timeblock</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {timeblocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedTimeblock(block)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                          selectedTimeblock?.id === block.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-medium">{block.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFromToday && localTodayPlan && (
                <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="font-medium text-sm sm:text-base">Today's Timeblock Duration</span>
                  </div>
                  <p className="text-center text-xl sm:text-2xl font-bold text-primary">
                    {localTodayPlan.timeblockDuration} minutes
                  </p>
                  <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
                    Set in your daily plan
                  </p>
                </div>
              )}

              <Button
                onClick={() => {
                  handleAction('click-start-timer-setup');
                  startTimer();
                }}
                disabled={!selectedTask || !selectedTimeblock}
                className="w-full gap-2"
                size="lg"
                data-tutorial="start-timer-btn"
              >
                <Play className="w-5 h-5" />
                Start Timer
              </Button>
            </CardContent>
          </Card>
        ) : isOnLongBreak ? (
          <Card className="border-2 border-orange-500/30 dark:border-orange-500/50 dark:bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-500" />
                Long Break in Progress
              </CardTitle>
              <CardDescription>
                Your progress has been saved. Resume when you're ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTask && (
                <div className="text-center p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2">{selectedTask.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-muted-foreground">Productive Time</p>
                      <p className="font-medium text-primary text-lg">
                        {formatTime(productiveSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wasted Time</p>
                      <p className="font-medium text-destructive text-lg">
                        {formatTime(wastedSeconds)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                onClick={resumeFromLongBreak}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="w-5 h-5" />
                Resume from Long Break
              </Button>
            </CardContent>
          </Card>
        ) : isRunning ? (
          <div className="space-y-6">
            {/* Timer Display */}
            <Card 
              className="border-2 border-primary/30 dark:border-primary/50 dark:bg-card/50"
              data-tutorial={!isPaused ? "timer-running-section" : "timer-wasting-section"}
            >
              <CardContent className="pt-6 sm:pt-8">
                {selectedTask && (
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                        style={{ backgroundColor: getPriorityColor(selectedTask.priorityQuadrant) }}
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {getPriorityLabel(selectedTask.priorityQuadrant)}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold truncate px-2">{selectedTask.title}</h2>
                  </div>
                )}

                {/* Circular Timer & Stats Layout */}
                <div className="flex flex-col items-center">
                  {/* Timer Circle */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={100 - progress}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl sm:text-5xl font-bold mb-1 sm:mb-2 tabular-nums">
                        {formatTime(productiveSeconds)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Target: {formatTime(targetSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Dual Stat Display - Productive vs Wasted */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                    <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Productive</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                        {formatTime(productiveSeconds)}
                      </p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border transition-colors ${
                      isPaused 
                        ? 'bg-destructive/10 border-destructive/20 animate-pulse' 
                        : 'bg-muted/30 border-transparent'
                    }`}>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        {isPaused ? 'Wasting...' : 'Wasted'}
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${isPaused ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatTime(wastedSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-sm mb-6">
                   <Progress value={progress} className="h-2" />
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2 sm:gap-3 justify-center flex-wrap w-full">
                    {!isPaused ? (
                      <Button onClick={() => {
                        handleAction('click-pause-timer');
                        pauseTimer();
                      }} variant="outline" size="lg" className="flex-1 min-w-[100px] gap-2" data-tutorial="timer-pause-button">
                        <Pause className="w-5 h-5" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer} size="lg" className="flex-1 min-w-[100px] gap-2">
                        <Play className="w-5 h-5" />
                        Resume
                      </Button>
                    )}
                    <Button
                      onClick={openBreakDialog}
                      variant="outline"
                      size="lg"
                      className="flex-1 min-w-[100px] gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <Coffee className="w-5 h-5" />
                      Break
                    </Button>
                    <Button
                      onClick={() => {
                        handleAction('click-stop-timer');
                        stopTimer();
                      }}
                      variant="destructive"
                      size="lg"
                      className="flex-1 min-w-[100px] gap-2"
                      data-tutorial="timer-stop-button"
                    >
                      <Square className="w-5 h-5" />
                      Stop
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            {session && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Target Duration</p>
                    <p className="font-medium">
                      {formatTimeHMS((selectedTimeblock?.durationMinutes || 0) * 60)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Productive Time</p>
                    <p className="font-medium text-primary">
                      {formatTime(productiveSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Wasted Time</p>
                    <p className="font-medium text-destructive">
                      {formatTime(wastedSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Pauses</p>
                    <p className="font-medium">{session.pausePeriods.length}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Timer stopped state - show setup again
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Setup Timer</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Select a task and timeblock to begin a new session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Task</label>
                <Select
                  value={selectedTask?.id}
                  onValueChange={async (id) => {
                    const task = tasks.find(t => t.id === id);
                    setSelectedTask(task || null);
                    
                    if (task) {
                      const today = format(new Date(), 'yyyy-MM-dd');
                      const todayPlanData = await getTodayPlan(today);
                      if (todayPlanData && todayPlanData.tasks.some(t => t.taskId === id)) {
                        setLocalTodayPlan(todayPlanData);
                        setIsFromToday(true);
                        const virtualTimeblock: Timeblock = {
                          id: `today-${todayPlanData.timeblockDuration}`,
                          label: `${todayPlanData.timeblockDuration} min`,
                          durationMinutes: todayPlanData.timeblockDuration,
                        };
                        setSelectedTimeblock(virtualTimeblock);
                      } else {
                        setIsFromToday(false);
                        setLocalTodayPlan(null);
                        if (timeblocks.length > 0) {
                          setSelectedTimeblock(timeblocks[1]);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="touch-manipulation h-11">
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(task => (
                      <SelectItem key={task.id} value={task.id} className="py-3 touch-manipulation">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                          />
                          <span className="truncate text-sm sm:text-base">{task.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isFromToday && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Timeblock</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {timeblocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedTimeblock(block)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                          selectedTimeblock?.id === block.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-medium">{block.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  handleAction('click-start-timer-setup');
                  resetTimer();
                  startTimer();
                }}
                disabled={!selectedTask || !selectedTimeblock}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="w-5 h-5" />
                Start New Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Timer;
