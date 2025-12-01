import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveTodayPlan, getCurrentUserId } from '@/lib/storage';
import { TodayPlan } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

const TodayGoalForm = () => {
  const navigate = useNavigate();
  const { todayPlan, refreshTodayPlan } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [targetTimeblocks, setTargetTimeblocks] = useState(8);
  const [timeblockDuration, setTimeblockDuration] = useState(25);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only load values once when component mounts
    if (todayPlan && !isInitialized) {
      setTargetTimeblocks(todayPlan.targetTimeblocks);
      setTimeblockDuration(todayPlan.timeblockDuration);
      setIsInitialized(true);
    }
  }, [todayPlan, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (targetTimeblocks < 1 || targetTimeblocks > 24) {
      toast({ title: 'Target timeblocks must be between 1 and 24', variant: 'destructive' });
      return;
    }

    if (timeblockDuration < 5 || timeblockDuration > 120) {
      toast({ title: 'Timeblock duration must be between 5 and 120 minutes', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const userId = getCurrentUserId();
      const updatedPlan: TodayPlan = todayPlan ? {
        ...todayPlan,
        targetTimeblocks,
        timeblockDuration,
      } : {
        id: `today-${Date.now()}`,
        userId,
        date: today,
        targetTimeblocks,
        timeblockDuration,
        tasks: [],
        completedTimeblocks: 0,
      };

      await saveTodayPlan(updatedPlan);
      await refreshTodayPlan();
      toast({ title: 'Today\'s goal updated successfully' });
      
      // Small delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 150));
      navigate('/today', { replace: true });
    } catch (error) {
      console.error('[TodayGoalForm] Error saving goal:', error);
      toast({ title: 'Failed to save goal', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalMinutes = targetTimeblocks * timeblockDuration;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

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
            <h1 className="text-xl font-bold">Set Today's Goal</h1>
            <p className="text-sm text-muted-foreground">Define your focus for today</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 sm:px-6 pt-8 pb-4 sm:pb-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Today's Date</p>
                <p className="text-lg font-bold text-primary">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeblocks" className="text-base font-semibold">
              Target Timeblocks <span className="text-destructive">*</span>
            </Label>
            <Input
              id="timeblocks"
              type="number"
              min="1"
              max="24"
              value={targetTimeblocks}
              onChange={e => setTargetTimeblocks(parseInt(e.target.value) || 1)}
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              How many focused work blocks do you want to complete today?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-semibold">
              Timeblock Duration (minutes) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="120"
              step="5"
              value={timeblockDuration}
              onChange={e => setTimeblockDuration(parseInt(e.target.value) || 25)}
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Length of each focused work session (recommended: 25-50 minutes)
            </p>
          </div>

          {/* Calculation Card */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Today's Commitment</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total timeblocks:</span>
                <span className="font-bold text-lg text-primary">{targetTimeblocks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Duration per block:</span>
                <span className="font-bold text-lg text-primary">{timeblockDuration} min</span>
              </div>
              <div className="h-px bg-border my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total focused time:</span>
                <span className="font-bold text-xl text-primary">
                  {totalHours > 0 && `${totalHours}h `}
                  {remainingMinutes > 0 && `${remainingMinutes}m`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetTimeblocks(8);
                  setTimeblockDuration(25);
                }}
                className="touch-manipulation"
              >
                Standard (8 × 25min)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetTimeblocks(6);
                  setTimeblockDuration(50);
                }}
                className="touch-manipulation"
              >
                Deep Work (6 × 50min)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetTimeblocks(12);
                  setTimeblockDuration(20);
                }}
                className="touch-manipulation"
              >
                Sprint (12 × 20min)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetTimeblocks(4);
                  setTimeblockDuration(90);
                }}
                className="touch-manipulation"
              >
                Intensive (4 × 90min)
              </Button>
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
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Goal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodayGoalForm;
