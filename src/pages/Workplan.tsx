import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getTasks, getWorkplans, saveTask, saveWorkplan, deleteTask } from '@/lib/storage';
import { Task, WorkplanScope, PriorityQuadrant } from '@/lib/types';
import type { Workplan } from '@/lib/types';
import { format } from 'date-fns';
import { getPriorityLabel, getPriorityColor, PRIORITY_QUADRANTS } from '@/lib/priority';
import { toast } from '@/hooks/use-toast';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';

const Workplan = () => {
  const [workplans, setWorkplans] = useState<Workplan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedWorkplan, setSelectedWorkplan] = useState<Workplan | null>(null);
  const [isWorkplanDialogOpen, setIsWorkplanDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('matrix');

  const [workplanForm, setWorkplanForm] = useState({
    title: '',
    scope: 'day' as WorkplanScope,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priorityQuadrant: 'essential_not_immediate' as PriorityQuadrant,
    estimatedTotalTimeMinutes: 30,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [workplansData, tasksData] = await Promise.all([
      getWorkplans(),
      getTasks(),
    ]);
    setWorkplans(workplansData);
    setTasks(tasksData);
  };

  const handleCreateWorkplan = async () => {
    const newWorkplan: Workplan = {
      id: `workplan-${Date.now()}`,
      title: workplanForm.title,
      scope: workplanForm.scope,
      startDate: workplanForm.startDate,
      endDate: workplanForm.startDate, // Simplified for now
      tasks: [],
    };

    await saveWorkplan(newWorkplan);
    await loadData();
    setIsWorkplanDialogOpen(false);
    setWorkplanForm({ title: '', scope: 'day', startDate: format(new Date(), 'yyyy-MM-dd') });
    toast({ title: 'Workplan created successfully' });
  };

  const handleCreateTask = async () => {
    const newTask: Task = {
      id: editingTask?.id || `task-${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      priorityQuadrant: taskForm.priorityQuadrant,
      estimatedTotalTimeMinutes: taskForm.estimatedTotalTimeMinutes,
      assignedTimeblocks: [],
      metadata: {},
    };

    await saveTask(newTask);

    if (selectedWorkplan && !editingTask) {
      const updatedWorkplan = {
        ...selectedWorkplan,
        tasks: [...selectedWorkplan.tasks, newTask.id],
      };
      await saveWorkplan(updatedWorkplan);
    }

    await loadData();
    setIsTaskDialogOpen(false);
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      priorityQuadrant: 'essential_not_immediate',
      estimatedTotalTimeMinutes: 30,
    });
    toast({ title: editingTask ? 'Task updated' : 'Task created successfully' });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priorityQuadrant: task.priorityQuadrant,
      estimatedTotalTimeMinutes: task.estimatedTotalTimeMinutes,
    });
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedWorkplan) {
      const updatedWorkplan = {
        ...selectedWorkplan,
        tasks: selectedWorkplan.tasks.filter(id => id !== taskId),
      };
      await saveWorkplan(updatedWorkplan);
    }
    await loadData();
    toast({ title: 'Task deleted' });
  };

  const workplanTasks = selectedWorkplan
    ? tasks.filter(t => selectedWorkplan.tasks.includes(t.id))
    : tasks; // Show ALL tasks when no workplan is selected

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Workplans
            </h1>
            <p className="text-muted-foreground">Organize your tasks and schedule</p>
          </div>
          <Dialog open={isWorkplanDialogOpen} onOpenChange={setIsWorkplanDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Plus className="w-4 h-4" />
                New Workplan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workplan</DialogTitle>
                <DialogDescription>Plan your day, week, or month</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={workplanForm.title}
                    onChange={e => setWorkplanForm({ ...workplanForm, title: e.target.value })}
                    placeholder="e.g., Monday Sprint"
                  />
                </div>
                <div>
                  <Label>Scope</Label>
                  <Select
                    value={workplanForm.scope}
                    onValueChange={(value: WorkplanScope) =>
                      setWorkplanForm({ ...workplanForm, scope: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={workplanForm.startDate}
                    onChange={e => setWorkplanForm({ ...workplanForm, startDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateWorkplan}>Create Workplan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workplans List */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Your Workplans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workplans.map((plan, index) => (
                <button
                  key={plan.id || `workplan-${index}`}
                  onClick={() => setSelectedWorkplan(plan)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedWorkplan?.id === plan.id
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'bg-muted hover:bg-muted/80 hover:shadow'
                  }`}
                >
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-sm opacity-80">
                    {plan.scope} • {format(new Date(plan.startDate), 'MMM d')}
                  </p>
                </button>
              ))}
              {workplans.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workplans yet. Create one to get started!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {selectedWorkplan ? selectedWorkplan.title : 'Select a Workplan'}
                    </CardTitle>
                    <CardDescription>
                      {selectedWorkplan ? `${workplanTasks.length} tasks` : 'Choose a workplan to view tasks'}
                    </CardDescription>
                  </div>
                  {selectedWorkplan && (
                    <div className="flex items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        <Button
                          size="sm"
                          variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                          className="gap-2 h-8"
                          onClick={() => setViewMode('matrix')}
                        >
                          <Grid3x3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Matrix</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          className="gap-2 h-8"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                          <span className="hidden sm:inline">List</span>
                        </Button>
                      </div>

                      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2 shadow-md">
                            <Plus className="w-4 h-4" />
                            Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={taskForm.title}
                                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                placeholder="Task name"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={taskForm.description}
                                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                placeholder="Task details"
                              />
                            </div>
                            <div>
                              <Label>Priority Quadrant</Label>
                              <Select
                                value={taskForm.priorityQuadrant}
                                onValueChange={(value: PriorityQuadrant) =>
                                  setTaskForm({ ...taskForm, priorityQuadrant: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRIORITY_QUADRANTS.map(q => (
                                    <SelectItem key={q} value={q}>
                                      {getPriorityLabel(q)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Estimated Time (minutes)</Label>
                              <Input
                                type="number"
                                value={taskForm.estimatedTotalTimeMinutes}
                                onChange={e =>
                                  setTaskForm({ ...taskForm, estimatedTotalTimeMinutes: parseInt(e.target.value) || 0 })
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateTask}>
                              {editingTask ? 'Update' : 'Create'} Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedWorkplan ? (
                  viewMode === 'matrix' ? (
                    <EisenhowerMatrix
                      tasks={workplanTasks}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ) : (
                    <div className="space-y-3">
                      {workplanTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getPriorityColor(task.priorityQuadrant) }}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-2 mt-1">
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
                                  {task.estimatedTotalTimeMinutes} min
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {workplanTasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No tasks yet. Add your first task!
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a workplan to view and manage tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workplan;
