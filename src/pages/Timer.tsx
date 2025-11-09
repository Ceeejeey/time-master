import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Pause, Square, Clock, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getTimeblocks, getTodayPlan } from '@/lib/storage';
import { Task, Timeblock, TodayPlan } from '@/lib/types';
import { useTimer } from '@/hooks/useTimer';
import { getPriorityColor, getPriorityLabel } from '@/lib/priority';
import { format } from 'date-fns';
import { formatTimeHMS } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';

const Timer = () => {
  const [searchParams] = useSearchParams();
  const { tasks } = useData();
  const [timeblocks, setTimeblocks] = useState<Timeblock[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTimeblock, setSelectedTimeblock] = useState<Timeblock | null>(null);
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [isFromToday, setIsFromToday] = useState(false);

  const {
    session,
    elapsedSeconds,
    productiveSeconds,
    wastedSeconds,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    takeLongBreak,
    resumeFromLongBreak,
    getProgress,
    isRunning,
    isStopped,
    isOnLongBreak,
  } = useTimer(selectedTask, selectedTimeblock);

  useEffect(() => {
    const loadData = async () => {
      const timeblocksData = await getTimeblocks();
      setTimeblocks(timeblocksData);

      // Pre-select task from URL if provided
      const taskId = searchParams.get('taskId');
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          
          // Check if this task is from today's plan
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayPlanData = await getTodayPlan(today);
          if (todayPlanData && todayPlanData.tasks.some(t => t.taskId === taskId)) {
            setTodayPlan(todayPlanData);
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
        if (timeblocksData.length > 0) {
          setSelectedTimeblock(timeblocksData[1]); // 30 min default
        }
      }
    };
    loadData();
  }, [searchParams, tasks]);

  const formatTime = (seconds: number) => {
    return formatTimeHMS(seconds);
  };

  const targetSeconds = selectedTimeblock ? selectedTimeblock.durationMinutes * 60 : 0;
  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Focus Timer</h1>
          <p className="text-muted-foreground">Stay focused and track your productivity</p>
        </div>

        {!isRunning ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Setup Timer</CardTitle>
              <CardDescription>
                {isFromToday 
                  ? `Ready to work on "${selectedTask?.title}" for ${todayPlan?.timeblockDuration} minutes`
                  : "Select a task and timeblock to begin"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        setTodayPlan(todayPlanData);
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
                        setTodayPlan(null);
                        // Set default timeblock for non-today tasks
                        if (timeblocks.length > 0) {
                          setSelectedTimeblock(timeblocks[1]); // 30 min default
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(task => (
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

              {!isFromToday && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Timeblock</label>
                  <div className="grid grid-cols-4 gap-3">
                    {timeblocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedTimeblock(block)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTimeblock?.id === block.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-sm font-medium">{block.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFromToday && todayPlan && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Today's Timeblock Duration</span>
                  </div>
                  <p className="text-center text-2xl font-bold text-primary">
                    {todayPlan.timeblockDuration} minutes
                  </p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    Set in your daily plan
                  </p>
                </div>
              )}

              <Button
                onClick={startTimer}
                disabled={!selectedTask || !selectedTimeblock}
                className="w-full gap-2"
                size="lg"
              >
                <Play className="w-5 h-5" />
                Start Timer
              </Button>
            </CardContent>
          </Card>
        ) : isOnLongBreak ? (
          <Card className="border-2 border-orange-500/20">
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
        ) : (
          <div className="space-y-6">
            {/* Timer Display */}
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-8">
                {selectedTask && (
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getPriorityColor(selectedTask.priorityQuadrant) }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {getPriorityLabel(selectedTask.priorityQuadrant)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                  </div>
                )}

                {/* Circular Timer */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 120}`}
                      strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold mb-2">{formatTime(productiveSeconds)}</p>
                    <p className="text-sm text-muted-foreground">
                      / {formatTime(targetSeconds)}
                    </p>
                    {isPaused && (
                      <p className="text-sm text-destructive mt-2 font-medium">PAUSED</p>
                    )}
                    {isOnLongBreak && (
                      <p className="text-sm text-orange-500 mt-2 font-medium">LONG BREAK</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress value={progress} className="h-2 mb-6" />

                {/* Controls */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {!isPaused ? (
                    <Button onClick={pauseTimer} variant="outline" size="lg" className="gap-2">
                      <Pause className="w-5 h-5" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeTimer} size="lg" className="gap-2">
                      <Play className="w-5 h-5" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={takeLongBreak}
                    variant="outline"
                    size="lg"
                    className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Coffee className="w-5 h-5" />
                    Long Break
                  </Button>
                  <Button
                    onClick={stopTimer}
                    variant="destructive"
                    size="lg"
                    className="gap-2"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </Button>
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
        )}
      </div>
    </div>
  );
};

export default Timer;
