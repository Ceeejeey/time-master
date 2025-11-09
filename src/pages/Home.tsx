import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Calendar, BarChart3, Clock, TrendingUp, Zap, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayReport } from '@/lib/reports';
import { format } from 'date-fns';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority';
import { formatTimeHMS } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';

const Home = () => {
  const { tasks, sessions, todayPlan } = useData();
  const [report, setReport] = useState({
    totalWorkTime: 0,
    totalWastedTime: 0,
    blocksCompleted: 0,
    completionRatePercent: 0,
  });

  useEffect(() => {
    // Generate today's report from live data
    const todayReport = getTodayReport(sessions, tasks);
    setReport(todayReport);
  }, [sessions, tasks]);

  // Get today's tasks from today plan
  const todayTasks = todayPlan?.tasks
    .map(tt => tasks.find(t => t.id === tt.taskId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    || [];

  const priorityTasks = todayTasks.filter(
    t => t.priorityQuadrant === 'essential_immediate'
  );

  // Calculate efficiency
  const totalTime = report.totalWorkTime + report.totalWastedTime;
  const efficiency = totalTime > 0 
    ? Math.round((report.totalWorkTime / totalTime) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Welcome Back 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • Let's crush your goals!
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/today">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Target className="w-4 h-4" />
                Today's Plan
              </Button>
            </Link>
            <Link to="/timer">
              <Button size="lg" variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all">
                <Play className="w-4 h-4" />
                Start Timer
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                PRODUCTIVE TIME
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatTimeHMS(report.totalWorkTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Time well spent</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3 text-destructive" />
                WASTED TIME
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatTimeHMS(report.totalWastedTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Room to improve</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-3 h-3 text-secondary" />
                BLOCKS COMPLETED
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {report.blocksCompleted}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayPlan ? `of ${todayPlan.targetTimeblocks} planned` : 'Keep going!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-accent" />
                COMPLETION RATE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {report.completionRatePercent}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Success rate</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-3 h-3 text-orange-500" />
                EFFICIENCY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {efficiency}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {efficiency >= 70 ? 'Excellent!' : efficiency >= 50 ? 'Good job!' : 'You got this!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <Card className="shadow-xl border-2 border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    Today's Focus
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} on your plate • {todayPlan?.targetTimeblocks || 0} blocks planned
                  </CardDescription>
                </div>
                <Link to="/today">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Manage Plan
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {todayTasks.slice(0, 4).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-card to-card/50 hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: getPriorityColor(task.priorityQuadrant),
                          boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${getPriorityColor(task.priorityQuadrant)}`,
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-base">{task.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span 
                            className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: getPriorityColor(task.priorityQuadrant) + '20',
                              color: getPriorityColor(task.priorityQuadrant),
                            }}
                          >
                            {getPriorityLabel(task.priorityQuadrant)}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">
                            ⏱ {task.estimatedTotalTimeMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/timer?taskId=${task.id}`}>
                      <Button 
                        size="sm" 
                        className="gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </Button>
                    </Link>
                  </div>
                ))}
                {todayTasks.length > 4 && (
                  <Link to="/today">
                    <Button variant="ghost" className="w-full hover:bg-primary/10">
                      View all {todayTasks.length} tasks →
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/timer" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer bg-gradient-to-br from-primary via-primary to-secondary text-white border-0 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Play className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl">Start Working</CardTitle>
                <CardDescription className="text-white/80 text-base mt-2">
                  Begin a new focus session and track your time
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/reports" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background to-primary/5">
              <CardHeader>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Analytics</CardTitle>
                <CardDescription className="text-base mt-2">
                  Track your productivity patterns and insights
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/workplan" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-secondary/20 hover:border-secondary/40 bg-gradient-to-br from-background to-secondary/5">
              <CardHeader>
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-secondary" />
                </div>
                <CardTitle className="text-2xl">Plan Ahead</CardTitle>
                <CardDescription className="text-base mt-2">
                  Create and manage your workplans strategically
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Priority Tasks or Empty State */}
        {priorityTasks.length > 0 ? (
          <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-destructive" />
                High Priority
              </CardTitle>
              <CardDescription className="text-base">
                🔥 Essential and urgent tasks that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorityTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border-2 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-2 h-12 bg-destructive rounded-full" />
                    <div className="flex-1">
                      <p className="font-semibold text-base">{task.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ⏱ {task.estimatedTotalTimeMinutes} min • {getPriorityLabel(task.priorityQuadrant)}
                      </p>
                    </div>
                  </div>
                  <Link to={`/timer?taskId=${task.id}`}>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Start Now
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : todayTasks.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to be productive?</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start by creating your first workplan or adding tasks to today's schedule
              </p>
              <div className="flex gap-3">
                <Link to="/today">
                  <Button size="lg" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Plan Today
                  </Button>
                </Link>
                <Link to="/workplan">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Workplan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default Home;
