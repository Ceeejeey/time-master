import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Calendar, BarChart3, Clock, TrendingUp, Zap, Target, Award, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayReport } from '@/lib/reports';
import { format } from 'date-fns';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority';
import { formatTimeHMS } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';

const Home = () => {
  const { tasks, sessions, todayPlan, refreshData } = useData();
  const [report, setReport] = useState({
    totalWorkTime: 0,
    totalWastedTime: 0,
    blocksCompleted: 0,
    completionRatePercent: 0,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate today's report from live data
    const todayReport = getTodayReport(sessions, tasks);
    setReport(todayReport);
  }, [sessions, tasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      setCurrentDate(new Date()); // Update date on refresh
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
    <div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5"
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
      
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Hero Header - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Welcome Back 👋
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              {format(currentDate, 'EEEE, MMMM d, yyyy')} • Let's crush your goals!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/today" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all touch-manipulation">
                <Target className="w-4 h-4" />
                <span className="text-sm sm:text-base">Today's Plan</span>
              </Button>
            </Link>
            <Link to="/timer" className="flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all touch-manipulation">
                <Play className="w-4 h-4" />
                <span className="text-sm sm:text-base">Start Timer</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate">PRODUCTIVE</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                {formatTimeHMS(report.totalWorkTime)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">Time well spent</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 text-destructive flex-shrink-0" />
                <span className="truncate">WASTED</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive">
                {formatTimeHMS(report.totalWastedTime)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">Room to improve</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                <Award className="w-3 h-3 text-secondary flex-shrink-0" />
                <span className="truncate">BLOCKS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-secondary">
                {report.blocksCompleted}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                {todayPlan ? `of ${todayPlan.targetTimeblocks}` : 'Keep going!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent hover:shadow-lg hover:scale-105 transition-all">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                <TrendingUp className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="truncate">RATE</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-accent">
                {report.completionRatePercent}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">Success rate</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent hover:shadow-lg hover:scale-105 transition-all col-span-2 sm:col-span-1">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                <BarChart3 className="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span className="truncate">EFFICIENCY</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500">
                {efficiency}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {efficiency >= 70 ? 'Excellent!' : efficiency >= 50 ? 'Good job!' : 'You got this!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <Card className="shadow-xl border-2 border-primary/10">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Today's Focus</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base mt-1">
                    {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} • {todayPlan?.targetTimeblocks || 0} blocks
                  </CardDescription>
                </div>
                <Link to="/today">
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto touch-manipulation">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Manage</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-2 sm:gap-3">
                {todayTasks.slice(0, 4).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 bg-gradient-to-r from-card to-card/50 hover:shadow-md hover:border-primary/30 transition-all group touch-manipulation"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getPriorityColor(task.priorityQuadrant),
                          boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${getPriorityColor(task.priorityQuadrant)}`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{task.title}</p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 flex-wrap">
                          <span 
                            className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold uppercase tracking-wide whitespace-nowrap"
                            style={{
                              backgroundColor: getPriorityColor(task.priorityQuadrant) + '20',
                              color: getPriorityColor(task.priorityQuadrant),
                            }}
                          >
                            {getPriorityLabel(task.priorityQuadrant)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                            ⏱ {task.estimatedTotalTimeMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/timer?taskId=${task.id}`} className="flex-shrink-0">
                      <Button 
                        size="sm" 
                        className="gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all touch-manipulation text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Start</span>
                      </Button>
                    </Link>
                  </div>
                ))}
                {todayTasks.length > 4 && (
                  <Link to="/today">
                    <Button variant="ghost" className="w-full hover:bg-primary/10 touch-manipulation text-sm">
                      View all {todayTasks.length} tasks →
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Link to="/timer" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer bg-gradient-to-br from-primary via-primary to-secondary text-white border-0 overflow-hidden relative touch-manipulation">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center mb-3 sm:mb-4">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Start Working</CardTitle>
                <CardDescription className="text-white/80 text-sm sm:text-base mt-1 sm:mt-2">
                  Begin a new focus session
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/reports" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background to-primary/5 touch-manipulation">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Analytics</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                  Track your productivity
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/workplan" className="block group">
            <Card className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-secondary/20 hover:border-secondary/40 bg-gradient-to-br from-background to-secondary/5 touch-manipulation">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Plan Ahead</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                  Manage workplans
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Priority Tasks or Empty State - Mobile optimized */}
        {priorityTasks.length > 0 ? (
          <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0" />
                <span>High Priority</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base">
                🔥 Essential and urgent tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
              {priorityTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-destructive/5 border-2 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all group touch-manipulation"
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="w-1.5 sm:w-2 h-10 sm:h-12 bg-destructive rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{task.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
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
