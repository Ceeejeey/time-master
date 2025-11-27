import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getTodayReport, getWeekReport, getMonthReport } from '@/lib/reports';
import { ReportData } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatTimeHMS } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';

const Reports = () => {
  const { tasks, sessions, refreshData } = useData();
  const [todayReport, setTodayReport] = useState<ReportData | null>(null);
  const [weekReport, setWeekReport] = useState<ReportData | null>(null);
  const [monthReport, setMonthReport] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReports = () => {
    setTodayReport(getTodayReport(sessions, tasks));
    setWeekReport(getWeekReport(sessions, tasks));
    setMonthReport(getMonthReport(sessions, tasks));
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, tasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentReport = activeTab === 'today' ? todayReport : activeTab === 'week' ? weekReport : monthReport;

  const pieData = currentReport ? [
    { name: 'Productive', value: currentReport.totalWorkTime, color: 'hsl(var(--primary))' },
    { name: 'Wasted', value: currentReport.totalWastedTime, color: 'hsl(var(--destructive))' },
  ] : [];

  const topWastedData = currentReport?.topWastedTasks.map(task => ({
    name: task.taskTitle.length > 20 ? task.taskTitle.substring(0, 20) + '...' : task.taskTitle,
    seconds: task.wastedSeconds,
  })) || [];

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatTimeHMS(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-sm text-destructive">
            Wasted: {formatTimeHMS(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis labels more compactly
  const formatYAxisTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="w-full max-w-full px-0 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Productivity Reports</h1>
            <p className="text-muted-foreground">Analyze your time management and efficiency</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6 mt-6">
            {currentReport && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Total Productive
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {formatTimeHMS(currentReport.totalWorkTime)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Total Wasted
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-destructive">
                        {formatTimeHMS(currentReport.totalWastedTime)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-secondary" />
                        Blocks Done
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-secondary">
                        {currentReport.blocksCompleted}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-accent">
                        {currentReport.completionRatePercent}
                        <span className="text-lg ml-1">%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {/* Pie Chart */}
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Time Distribution
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">How you spent your time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {pieData.length > 0 && (pieData[0].value > 0 || pieData[1].value > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <defs>
                              <linearGradient id="productiveGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                              </linearGradient>
                              <linearGradient id="wastedGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => 
                                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                              }
                              outerRadius={90}
                              innerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                              animationDuration={1000}
                            >
                              {pieData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 0 ? 'url(#productiveGradient)' : 'url(#wastedGradient)'}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              iconType="circle"
                              formatter={(value) => <span className="text-xs sm:text-sm font-medium">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <Clock className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
                          <p className="text-sm sm:text-base">No time data yet</p>
                          <p className="text-xs">Complete your first timeblock to see distribution</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card className="border-2 border-destructive/20">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                        Top Wasted Time Tasks
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Tasks that need more focus and attention</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {topWastedData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart 
                            data={topWastedData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                          >
                            <defs>
                              <linearGradient id="colorWasted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              tick={{ fontSize: 10 }}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis 
                              tickFormatter={formatYAxisTime}
                              tick={{ fontSize: 10 }}
                              stroke="hsl(var(--muted-foreground))"
                              width={50}
                            />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                            <Bar 
                              dataKey="seconds" 
                              fill="url(#colorWasted)"
                              radius={[6, 6, 0, 0]}
                              animationDuration={1000}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                          <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
                          <p className="text-sm sm:text-base">No wasted time data yet</p>
                          <p className="text-xs">Start completing timeblocks to see insights</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Insights & Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentReport.blocksCompleted > 0 && (
                      <div className="p-4 rounded-lg bg-muted border border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Productive Time</p>
                            <p className="text-lg font-bold text-primary">{formatTimeHMS(currentReport.totalWorkTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Wasted Time</p>
                            <p className="text-lg font-bold text-destructive">{formatTimeHMS(currentReport.totalWastedTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Time</p>
                            <p className="text-lg font-bold">{formatTimeHMS(currentReport.totalWorkTime + currentReport.totalWastedTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
                            <p className="text-lg font-bold text-accent">
                              {currentReport.totalWorkTime + currentReport.totalWastedTime > 0
                                ? Math.round((currentReport.totalWorkTime / (currentReport.totalWorkTime + currentReport.totalWastedTime)) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {currentReport.completionRatePercent >= 80 && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm">
                          <strong className="text-primary">🎉 Excellent!</strong> Your completion rate is {currentReport.completionRatePercent}%. Keep up the great work!
                        </p>
                      </div>
                    )}
                    {currentReport.completionRatePercent < 50 && currentReport.blocksCompleted > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm">
                          <strong className="text-destructive">⚠️ Improvement needed:</strong> Your completion rate is {currentReport.completionRatePercent}%. Try shorter timeblocks or reducing distractions.
                        </p>
                      </div>
                    )}
                    {currentReport.totalWastedTime > currentReport.totalWorkTime && currentReport.blocksCompleted > 0 && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-sm">
                          <strong className="text-accent">💡 Focus tip:</strong> Your wasted time exceeds productive time. Consider reviewing your task priorities and minimizing interruptions.
                        </p>
                      </div>
                    )}
                    {currentReport.blocksCompleted === 0 && (
                      <div className="p-4 rounded-lg bg-muted border border-border text-center">
                        <p className="text-muted-foreground">
                          No completed timeblocks yet. Start a timer to see your productivity insights!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
