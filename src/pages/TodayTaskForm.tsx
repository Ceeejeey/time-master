import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWorkplans, getTasks, saveTodayPlan, getCurrentUserId } from '@/lib/storage';
import { Workplan, Task, TodayPlan } from '@/lib/types';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority';
import { toast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';

const TodayTaskForm = () => {
  const navigate = useNavigate();
  const { todayPlan, refreshTodayPlan, refreshData } = useData();
  const [workplans, setWorkplans] = useState<Workplan[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timeblockCount, setTimeblockCount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [workplansData, tasksData] = await Promise.all([
          getWorkplans(),
          getTasks(),
        ]);
        setWorkplans(workplansData);
        setAllTasks(tasksData);
      } catch (error) {
        console.error('[TodayTaskForm] Error loading data:', error);
        toast({ title: 'Failed to load data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTaskId) {
      toast({ title: 'Please select a task', variant: 'destructive' });
      return;
    }

    if (timeblockCount < 1) {
      toast({ title: 'Please specify at least 1 timeblock', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const userId = getCurrentUserId();
      const today = format(new Date(), 'yyyy-MM-dd');

      const updatedPlan: TodayPlan = todayPlan ? {
        ...todayPlan,
        tasks: [
          ...todayPlan.tasks,
          {
            id: `today-task-${Date.now()}`,
            taskId: selectedTaskId,
            timeblockCount: timeblockCount,
            completed: false,
            order: todayPlan.tasks.length,
          },
        ],
      } : {
        id: `today-${Date.now()}`,
        userId,
        date: today,
        targetTimeblocks: 8,
        timeblockDuration: 25,
        tasks: [{
          id: `today-task-${Date.now()}`,
          taskId: selectedTaskId,
          timeblockCount: timeblockCount,
          completed: false,
          order: 0,
        }],
        completedTimeblocks: 0,
      };

      await saveTodayPlan(updatedPlan);
      await refreshTodayPlan();
      await refreshData();
      toast({ title: 'Task added to today\'s plan' });
      
      // Small delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 150));
      navigate('/today', { replace: true });
    } catch (error) {
      console.error('[TodayTaskForm] Error adding task:', error);
      toast({ title: 'Failed to add task', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTask = allTasks.find(t => t.id === selectedTaskId);
  const estimatedMinutes = selectedTask ? selectedTask.estimatedTotalTimeMinutes : 0;
  const timeblockDuration = todayPlan?.timeblockDuration || 25;
  const totalMinutes = timeblockCount * timeblockDuration;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Add Task to Today</h1>
            <p className="text-sm text-muted-foreground">Schedule a task for today's focus</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 sm:px-6 pt-8 pb-4 sm:pb-6 max-w-2xl mx-auto">
        {allTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tasks available</p>
            <Button
              onClick={() => navigate('/workplan/task/new')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Task
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="task" className="text-base font-semibold">
                Select Task <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
              >
                <SelectTrigger id="task" className="h-12 text-base">
                  <SelectValue placeholder="Choose a task from your workplan" />
                </SelectTrigger>
                <SelectContent>
                  {allTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pick a task to focus on today
              </p>
            </div>

            {selectedTask && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Task Details</p>
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: getPriorityColor(selectedTask.priorityQuadrant) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{selectedTask.title}</p>
                    {selectedTask.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {selectedTask.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: getPriorityColor(selectedTask.priorityQuadrant) + '20',
                          color: getPriorityColor(selectedTask.priorityQuadrant),
                        }}
                      >
                        {getPriorityLabel(selectedTask.priorityQuadrant)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Est: {estimatedMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="timeblocks" className="text-base font-semibold">
                Allocate Timeblocks <span className="text-destructive">*</span>
              </Label>
              <Input
                id="timeblocks"
                type="number"
                min="1"
                max="12"
                value={timeblockCount}
                onChange={e => setTimeblockCount(parseInt(e.target.value) || 1)}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                How many {timeblockDuration}-minute blocks to allocate?
              </p>
            </div>

            {selectedTask && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-primary">Time Allocation</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Allocated time:</span>
                    <span className="font-bold">{totalMinutes} minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated time:</span>
                    <span className="font-bold">{estimatedMinutes} minutes</span>
                  </div>
                  {totalMinutes < estimatedMinutes && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      ⚠️ You may need more timeblocks to complete this task
                    </p>
                  )}
                  {totalMinutes > estimatedMinutes * 1.5 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 You've allocated extra time - great for unexpected challenges!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
                className="flex-1 h-12 touch-manipulation"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1 h-12 gap-2 touch-manipulation"
                disabled={isSaving || !selectedTaskId}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Add to Today
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TodayTaskForm;
