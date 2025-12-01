import { Task } from '@/lib/types';
import { getPriorityColor, getPriorityLabel } from '@/lib/priority';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Play, Edit2, Trash2 } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const EisenhowerMatrix = ({ tasks, onEditTask, onDeleteTask }: EisenhowerMatrixProps) => {
  const getTasksByQuadrant = (quadrant: string) => {
    return tasks.filter(task => task.priorityQuadrant === quadrant);
  };

  const essentialImmediateTasks = getTasksByQuadrant('essential_immediate');
  const essentialNotImmediateTasks = getTasksByQuadrant('essential_not_immediate');
  const notEssentialImmediateTasks = getTasksByQuadrant('not_essential_immediate');
  const notEssentialNotImmediateTasks = getTasksByQuadrant('not_essential_not_immediate');

  const QuadrantCard = ({ 
    title, 
    subtitle, 
    tasks, 
    quadrant, 
    bgColor, 
    textColor 
  }: { 
    title: string; 
    subtitle: string; 
    tasks: Task[]; 
    quadrant: string;
    bgColor: string;
    textColor: string;
  }) => (
    <div 
      className="rounded-xl border-2 p-4 min-h-[250px] sm:min-h-[300px] transition-all hover:shadow-lg shadow-sm backdrop-blur-sm"
      style={{ 
        borderColor: bgColor,
        backgroundColor: `${bgColor}15`
      }}
    >
      <div className="mb-3 sm:mb-4">
        <h3 
          className="text-base sm:text-lg font-bold mb-1"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-2 flex items-center gap-2">
          <div 
            className="h-1 w-full rounded-full"
            style={{ backgroundColor: `${bgColor}30` }}
          />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <div
            key={task.id}
            className="group relative rounded-xl bg-card/50 dark:bg-card/30 border-2 border-zinc-200 dark:border-zinc-700 p-2.5 shadow-sm transition-all hover:shadow-md hover:border-primary/60 dark:hover:border-primary/70 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                style={{ backgroundColor: bgColor }}
              />
              <div className="flex-1 min-w-0 pr-20 sm:pr-0">
                <p className="font-semibold text-xs sm:text-sm leading-tight mb-1 text-foreground">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shadow-sm border"
                    style={{
                      backgroundColor: bgColor + '25',
                      color: textColor,
                      borderColor: bgColor + '40'
                    }}
                  >
                    ⏱ {task.estimatedTotalTimeMinutes}m
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons - always visible on mobile, hover on desktop */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Link to={`/timer?taskId=${task.id}`}>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 touch-target"
                  title="Start timer"
                >
                  <Play className="w-3 h-3" />
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 touch-target"
                onClick={() => onEditTask(task)}
                title="Edit task"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0 text-destructive hover:text-destructive touch-target"
                onClick={() => onDeleteTask(task.id)}
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
            No tasks in this quadrant
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Eisenhower Matrix</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Prioritize your tasks based on urgency and importance
        </p>
      </div>

      {/* Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Quadrant 1: Essential & Immediate (DO FIRST) */}
        <QuadrantCard
          key="essential_immediate"
          title="🔥 Do First"
          subtitle="Essential & Urgent"
          tasks={essentialImmediateTasks}
          quadrant="essential_immediate"
          bgColor="#EF4444"
          textColor="#DC2626"
        />

        {/* Quadrant 2: Essential & Not Immediate (SCHEDULE) */}
        <QuadrantCard
          key="essential_not_immediate"
          title="📅 Schedule"
          subtitle="Essential & Not Urgent"
          tasks={essentialNotImmediateTasks}
          quadrant="essential_not_immediate"
          bgColor="#F59E0B"
          textColor="#D97706"
        />

        {/* Quadrant 3: Not Essential & Immediate (DELEGATE) */}
        <QuadrantCard
          key="not_essential_immediate"
          title="👥 Delegate"
          subtitle="Not Essential & Urgent"
          tasks={notEssentialImmediateTasks}
          quadrant="not_essential_immediate"
          bgColor="#06B6D4"
          textColor="#0891B2"
        />

        {/* Quadrant 4: Not Essential & Not Immediate (ELIMINATE) */}
        <QuadrantCard
          key="not_essential_not_immediate"
          title="🗑️ Eliminate"
          subtitle="Not Essential & Not Urgent"
          tasks={notEssentialNotImmediateTasks}
          quadrant="not_essential_not_immediate"
          bgColor="#6B7280"
          textColor="#4B5563"
        />
      </div>
    </div>
  );
};
