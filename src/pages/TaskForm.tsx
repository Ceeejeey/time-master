import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { saveTask, getTask, getWorkplans, saveWorkplan, getCurrentUserId } from '@/lib/storage';
import { Task, PriorityQuadrant } from '@/lib/types';
import { getPriorityLabel, getPriorityColor, PRIORITY_QUADRANTS } from '@/lib/priority';
import { toast } from '@/hooks/use-toast';

const TaskForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const workplanId = searchParams.get('workplanId');
  const mode = taskId ? 'edit' : 'create';

  // Debug: Log mount and check for scroll blockers
  useEffect(() => {
    console.log('[TaskForm] Component mounted');
    console.log('[TaskForm] Document body overflow:', window.getComputedStyle(document.body).overflow);
    console.log('[TaskForm] Document body overflowY:', window.getComputedStyle(document.body).overflowY);
    console.log('[TaskForm] HTML overflow:', window.getComputedStyle(document.documentElement).overflow);
    console.log('[TaskForm] HTML overflowY:', window.getComputedStyle(document.documentElement).overflowY);
    
    // Check for any elements with pointer-events: none or touch-action: none
    const root = document.getElementById('root');
    if (root) {
      console.log('[TaskForm] #root overflow:', window.getComputedStyle(root).overflow);
      console.log('[TaskForm] #root pointerEvents:', window.getComputedStyle(root).pointerEvents);
      console.log('[TaskForm] #root touchAction:', window.getComputedStyle(root).touchAction);
    }
    
    // Check for fixed/absolute positioned overlays
    const allElements = document.querySelectorAll('*');
    let overlaysFound = 0;
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if ((style.position === 'fixed' || style.position === 'absolute') && 
          parseInt(style.zIndex) > 50 && 
          style.display !== 'none') {
        overlaysFound++;
        console.log('[TaskForm] Overlay element found:', el.tagName, el.className, 'z-index:', style.zIndex);
      }
    });
    console.log('[TaskForm] Total overlays with z-index > 50:', overlaysFound);
    
    return () => {
      console.log('[TaskForm] Component unmounting');
    };
  }, []);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priorityQuadrant: 'essential_not_immediate' as PriorityQuadrant,
    estimatedTotalTimeMinutes: 30,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      if (taskId) {
        try {
          const task = await getTask(taskId);
          if (task) {
            setForm({
              title: task.title,
              description: task.description,
              priorityQuadrant: task.priorityQuadrant,
              estimatedTotalTimeMinutes: task.estimatedTotalTimeMinutes,
            });
          }
        } catch (error) {
          console.error('[TaskForm] Error loading task:', error);
          toast({ title: 'Failed to load task', variant: 'destructive' });
        }
      }
      setIsLoading(false);
    };
    loadTask();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[TaskForm] === SUBMIT START ===');
    console.log('[TaskForm] mode:', mode);
    console.log('[TaskForm] taskId:', taskId);
    console.log('[TaskForm] workplanId:', workplanId);
    console.log('[TaskForm] form:', form);
    
    if (!form.title.trim()) {
      toast({ title: 'Please enter a task title', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const userId = getCurrentUserId();
      console.log('[TaskForm] userId:', userId);
      
      const newTask: Task = {
        id: taskId || `task-${Date.now()}`,
        userId,
        title: form.title,
        description: form.description,
        priorityQuadrant: form.priorityQuadrant,
        estimatedTotalTimeMinutes: form.estimatedTotalTimeMinutes,
        assignedTimeblocks: [],
        metadata: {},
      };
      console.log('[TaskForm] newTask:', newTask);

      // Save task and get the actual ID from database
      const actualTaskId = await saveTask(newTask);
      console.log('[TaskForm] Task saved with actualTaskId:', actualTaskId);
      
      // If creating a new task (not editing) and workplanId is provided, add task to workplan
      if (!taskId && workplanId) {
        console.log('[TaskForm] Adding task to workplan...');
        const workplans = await getWorkplans();
        console.log('[TaskForm] All workplans:', workplans.map(w => ({ id: w.id, title: w.title, tasks: w.tasks })));
        
        const workplan = workplans.find(w => w.id === workplanId);
        console.log('[TaskForm] Found workplan:', workplan);
        
        if (workplan) {
          const updatedWorkplan = {
            ...workplan,
            tasks: [...workplan.tasks, actualTaskId],
          };
          console.log('[TaskForm] Updated workplan with tasks:', updatedWorkplan.tasks);
          await saveWorkplan(updatedWorkplan);
          console.log('[TaskForm] ✓ Workplan saved!');
        } else {
          console.log('[TaskForm] ⚠ Workplan NOT FOUND for id:', workplanId);
        }
      } else {
        console.log('[TaskForm] Skipping workplan update. taskId:', taskId, 'workplanId:', workplanId);
      }
      
      toast({ title: mode === 'edit' ? 'Task updated successfully' : 'Task created successfully' });
      
      // Small delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Navigate back with workplanId if provided
      if (workplanId) {
        navigate(`/workplan?selected=${workplanId}`, { replace: true });
      } else {
        navigate('/workplan', { replace: true });
      }

    } catch (error) {
      console.error('[TaskForm] Error saving task:', error);
      toast({ title: 'Failed to save task', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-in fade-in duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task...</p>
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
            <h1 className="text-xl font-bold">
              {mode === 'edit' ? 'Edit Task' : 'Create Task'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'edit' ? 'Update task details' : 'Add a new task to your workplan'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 sm:px-6 pt-8 pb-4 sm:pb-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Write project proposal"
              className="h-12 text-base"
              autoFocus
              maxLength={200}
              data-tutorial="task-title-input"
            />
            <p className="text-xs text-muted-foreground">
              What needs to be done?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add details, notes, or context..."
              className="min-h-32 text-base resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {form.description.length}/1000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-base font-semibold">
              Priority Quadrant
            </Label>
            <Select
              value={form.priorityQuadrant}
              onValueChange={(value: PriorityQuadrant) =>
                setForm({ ...form, priorityQuadrant: value })
              }
            >
              <SelectTrigger id="priority" className="h-12 text-base">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getPriorityColor(form.priorityQuadrant) }}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_QUADRANTS.map(q => (
                  <SelectItem key={q} value={q}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getPriorityColor(q) }}
                      />
                      {getPriorityLabel(q)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Classify task urgency and importance
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-base font-semibold">
              Estimated Time (minutes)
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                id="time"
                type="number"
                min="1"
                max="1440"
                value={form.estimatedTotalTimeMinutes}
                onChange={e =>
                  setForm({ ...form, estimatedTotalTimeMinutes: parseInt(e.target.value) || 0 })
                }
                className="h-12 text-base pl-11"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Approximately {Math.round(form.estimatedTotalTimeMinutes / 60 * 10) / 10} hours
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Preview</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: getPriorityColor(form.priorityQuadrant) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base">
                    {form.title || 'Untitled Task'}
                  </p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {form.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className="px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: getPriorityColor(form.priorityQuadrant) + '20',
                    color: getPriorityColor(form.priorityQuadrant),
                  }}
                >
                  {getPriorityLabel(form.priorityQuadrant)}
                </span>
                <span className="text-muted-foreground">
                  {form.estimatedTotalTimeMinutes} min
                </span>
              </div>
            </div>
          </div>

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
              disabled={isSaving || !form.title.trim()}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {mode === 'edit' ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
