import React, { useEffect } from 'react';
import { Coffee, Square, Bell, BellOff } from 'lucide-react';
import { useBreak } from '@/contexts/BreakContext';
import { useGlobalTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export const BreakOverlay: React.FC = () => {
  const {
    isOnBreak,
    showBreakOverlay,
    elapsedBreakSeconds,
    targetBreakMinutes,
    isBreakTimeReached,
    stopBreak,
    getBreakProgress,
  } = useBreak();

  const {
    resumeFromLongBreak,
    session,
    isOnLongBreak,
  } = useGlobalTimer();

  // Don't render if not showing
  if (!showBreakOverlay || !isOnBreak) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetSeconds = targetBreakMinutes * 60;
  const overtime = elapsedBreakSeconds > targetSeconds ? elapsedBreakSeconds - targetSeconds : 0;

  const handleStopBreak = async () => {
    const savedState = await stopBreak();
    
    // If timer was running before break, resume it
    // MUST await to ensure timer state is fully restored before UI updates
    if (savedState?.wasTimerRunning && isOnLongBreak) {
      await resumeFromLongBreak();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-900/95 via-orange-900/95 to-amber-900/95 backdrop-blur-sm">
      <div className="h-full flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={cn(
            "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
            isBreakTimeReached 
              ? "bg-red-500/20 animate-pulse" 
              : "bg-amber-500/20"
          )}>
            <Coffee className={cn(
              "h-10 w-10",
              isBreakTimeReached ? "text-red-400" : "text-amber-400"
            )} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isBreakTimeReached ? "Break Time is Over!" : "Break Time"}
          </h1>
          <p className="text-amber-200/80">
            {isBreakTimeReached 
              ? "Your break has ended. Ready to get back to work?" 
              : "Relax and recharge. You deserve it!"}
          </p>
        </div>

        {/* Timer Display */}
        <div className="bg-black/30 rounded-3xl p-8 mb-8 min-w-[280px]">
          <div className="text-center">
            <div className={cn(
              "text-6xl font-mono font-bold mb-2",
              isBreakTimeReached ? "text-red-400" : "text-white"
            )}>
              {formatTime(elapsedBreakSeconds)}
            </div>
            <div className="text-amber-200/60 text-sm">
              Target: {formatTime(targetSeconds)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <Progress 
              value={getBreakProgress()} 
              className={cn(
                "h-3",
                isBreakTimeReached ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"
              )}
            />
          </div>

          {/* Overtime indicator */}
          {overtime > 0 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                <Bell className="h-4 w-4 text-red-400 animate-bounce" />
                <span className="text-red-400 font-medium">
                  +{formatTime(overtime)} overtime
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alarm Status */}
        {isBreakTimeReached && (
          <div className="mb-6 flex items-center gap-2 text-red-400">
            <Bell className="h-5 w-5 animate-bounce" />
            <span className="font-medium">Alarm ringing!</span>
          </div>
        )}

        {/* Stop Break Button */}
        <Button
          size="lg"
          onClick={handleStopBreak}
          className={cn(
            "h-16 px-8 text-lg font-semibold rounded-2xl shadow-lg transition-all",
            isBreakTimeReached
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
              : "bg-white hover:bg-gray-100 text-amber-900 shadow-white/20"
          )}
        >
          <Square className="h-5 w-5 mr-2" />
          {isBreakTimeReached ? "Stop Alarm & Resume" : "End Break Early"}
        </Button>

        {/* Info Text */}
        <p className="mt-6 text-amber-200/50 text-sm text-center max-w-xs">
          {session && !session.isStopped && !session.endTimestamp
            ? "Your timer progress is saved and will resume when you stop the break."
            : "Take your time. The break will continue until you stop it."}
        </p>
      </div>
    </div>
  );
};

export default BreakOverlay;
