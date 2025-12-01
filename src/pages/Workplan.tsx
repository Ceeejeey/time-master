import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Grid3x3,
  List,
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
  getTasks,
  getWorkplans,
  saveWorkplan,
  deleteTask,
  getCurrentUserId,
} from "@/lib/storage";
import { Task, Workplan as WorkplanType } from "@/lib/types";
import { format } from "date-fns";
import { getPriorityLabel, getPriorityColor } from "@/lib/priority";
import { toast } from "@/hooks/use-toast";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";

const Workplan = () => {
  const navigate = useNavigate();
  const [workplans, setWorkplans] = useState<WorkplanType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedWorkplan, setSelectedWorkplan] = useState<WorkplanType | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"list" | "matrix">("matrix");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log("[Workplan] Loading workplans and tasks...");
    const [workplansData, tasksData] = await Promise.all([
      getWorkplans(),
      getTasks(),
    ]);
    console.log(
      "[Workplan] Loaded",
      workplansData.length,
      "workplans and",
      tasksData.length,
      "tasks"
    );
    setWorkplans(workplansData);
    setTasks(tasksData);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
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

  const handleEditTask = (task: Task) => {
    navigate(
      `/workplan/task/edit?taskId=${task.id}&workplanId=${
        selectedWorkplan?.id || ""
      }`
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedWorkplan) {
      const updatedWorkplan = {
        ...selectedWorkplan,
        tasks: selectedWorkplan.tasks.filter((id) => id !== taskId),
      };
      await saveWorkplan(updatedWorkplan);
    }
    await loadData();
    toast({ title: "Task deleted" });
  };

  const workplanTasks = selectedWorkplan
    ? tasks.filter((t) => {
        const isIncluded = selectedWorkplan.tasks.includes(t.id);
        console.log(
          "[Workplan] Task",
          t.id,
          t.title,
          "included in workplan?",
          isIncluded
        );
        return isIncluded;
      })
    : tasks; // Show ALL tasks when no workplan is selected

  console.log(
    "[Workplan] Selected workplan:",
    selectedWorkplan?.title,
    "Task IDs:",
    selectedWorkplan?.tasks
  );
  console.log(
    "[Workplan] All tasks:",
    tasks.map((t) => ({ id: t.id, title: t.title }))
  );
  console.log(
    "[Workplan] Filtered workplan tasks:",
    workplanTasks.map((t) => ({ id: t.id, title: t.title }))
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-3 sm:p-4 md:p-6"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Workplans
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Organize your tasks and schedule
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/workplan/new")}
            className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto touch-manipulation"
            data-tutorial="create-workplan-btn"
          >
            <Plus className="w-4 h-4" />
            New Workplan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Workplans List */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Your Workplans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 sm:p-6">
              {workplans.map((plan, index) => (
                <button
                  key={plan.id || `workplan-${index}`}
                  onClick={() => setSelectedWorkplan(plan)}
                  className={`w-full text-left p-3 rounded-xl transition-all touch-manipulation ${
                    selectedWorkplan?.id === plan.id
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02] border-2 border-primary-foreground/20 ring-2 ring-primary/50"
                      : "bg-card/50 dark:bg-card/30 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md hover:border-primary/50 dark:hover:border-primary/60 hover:-translate-y-0.5"
                  }`}
                >
                  <p className="font-semibold text-sm sm:text-base mb-1">
                    {plan.title}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      selectedWorkplan?.id === plan.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.scope.toUpperCase()} •{" "}
                    {format(new Date(plan.startDate), "MMM d, yyyy")}
                  </p>
                </button>
              ))}
              {workplans.length === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                  No workplans yet. Create one to get started!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl truncate">
                      {selectedWorkplan
                        ? selectedWorkplan.title
                        : "Select a Workplan"}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {selectedWorkplan
                        ? `${workplanTasks.length} tasks`
                        : "Choose a workplan to view tasks"}
                    </CardDescription>
                  </div>
                  {selectedWorkplan && (
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg flex-1 sm:flex-none">
                        <Button
                          size="sm"
                          variant={viewMode === "matrix" ? "default" : "ghost"}
                          className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation"
                          onClick={() => setViewMode("matrix")}
                        >
                          <Grid3x3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Matrix</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === "list" ? "default" : "ghost"}
                          className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="w-4 h-4" />
                          <span className="hidden sm:inline">List</span>
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/workplan/task/new?workplanId=${selectedWorkplan.id}`
                          )
                        }
                        className="gap-2 shadow-md flex-1 sm:flex-none touch-manipulation"
                        data-tutorial="add-task-btn"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="sm:inline">Add Task</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {selectedWorkplan ? (
                  viewMode === "matrix" ? (
                    <EisenhowerMatrix
                      tasks={workplanTasks}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ) : (
                    <div className="space-y-2">
                      {workplanTasks.map((task) => (
                        <div
                          key={task.id}
                          className="
    flex flex-col gap-4 p-4 rounded-2xl border
    bg-card/60 dark:bg-card/30
    border-zinc-200 dark:border-zinc-700
    shadow-sm hover:shadow-md
    active:scale-[0.99] transition-all
  "
                        >
                          {/* Top Row: Priority + Title + Chips */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Priority Color Indicator */}
                            <span
                              className="w-3 h-3 rounded-full mt-1 ring-2 ring-white dark:ring-zinc-900"
                              style={{
                                backgroundColor: getPriorityColor(
                                  task.priorityQuadrant
                                ),
                              }}
                            />

                            {/* Main Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {/* Title */}
                                <p className="font-semibold text-base text-foreground min-w-0">
                                  {task.title}
                                </p>

                                {/* Priority Chip */}
                                <span
                                  className="px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide border shadow-sm"
                                  style={{
                                    backgroundColor:
                                      getPriorityColor(task.priorityQuadrant) +
                                      "25",
                                    color: getPriorityColor(
                                      task.priorityQuadrant
                                    ),
                                    borderColor:
                                      getPriorityColor(task.priorityQuadrant) +
                                      "40",
                                  }}
                                >
                                  {getPriorityLabel(task.priorityQuadrant)}
                                </span>

                                {/* Estimated Time Chip */}
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/30 shadow-sm">
                                  ⏱ {task.estimatedTotalTimeMinutes} min
                                </span>
                              </div>

                              {/* Description */}
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Action Buttons */}
                          <div className="flex justify-end gap-3">
                            {/* Edit Button */}
                            <Button
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="
        rounded-lg px-3 py-2 text-xs font-semibold
        bg-blue-600 text-white
        hover:bg-blue-700 active:scale-95 shadow-sm
      "
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="
        rounded-lg px-3 py-2 text-xs font-semibold
        bg-red-600 text-white
        hover:bg-red-700 active:scale-95 shadow-sm
      "
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                      {workplanTasks.length === 0 && (
                        <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                          No tasks yet. Add your first task!
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">
                      Select a workplan to view and manage tasks
                    </p>
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
