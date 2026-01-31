import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { useBreak } from '@/contexts/BreakContext';
import { useGlobalTimer } from '@/contexts/TimerContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BREAK_DURATIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
];

export const BreakFAB: React.FC = () => {
  const { 
    openBreakDialog, 
    showBreakDialog, 
    closeBreakDialog, 
    startBreak,
    isOnBreak 
  } = useBreak();
  
  const { 
    isRunning, 
    isPaused, 
    productiveSeconds, 
    wastedSeconds,
    session,
    takeLongBreak,
  } = useGlobalTimer();
  
  const [selectedDuration, setSelectedDuration] = useState(5);

  // Don't show FAB if already on break
  if (isOnBreak) {
    return null;
  }

  const handleStartBreak = () => {
    const wasTimerRunning = isRunning || (session && !session.isStopped && !session.endTimestamp);
    
    // If timer was running, save its state and put it on long break
    if (wasTimerRunning && session) {
      takeLongBreak();
    }
    
    // Start the break with saved timer state
    startBreak(
      selectedDuration,
      productiveSeconds,
      wastedSeconds,
      !!wasTimerRunning
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={openBreakDialog}
        className={cn(
          "fixed bottom-20 right-4 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-amber-500 to-orange-500",
          "shadow-lg shadow-amber-500/30",
          "flex items-center justify-center",
          "text-white",
          "active:scale-95 transition-transform",
          "hover:shadow-xl hover:shadow-amber-500/40"
        )}
        aria-label="Take a break"
      >
        <Coffee className="h-6 w-6" />
      </button>

      {/* Break Duration Selection Dialog */}
      <Dialog open={showBreakDialog} onOpenChange={(open) => !open && closeBreakDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-500" />
              Take a Break
            </DialogTitle>
            <DialogDescription>
              {isRunning || (session && !session.isStopped) ? (
                "Your timer will be paused and saved. Select how long you want to rest."
              ) : (
                "Select how long you want to rest. An alarm will notify you when break time is over."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm font-medium mb-3">Break Duration</p>
            <div className="grid grid-cols-3 gap-2">
              {BREAK_DURATIONS.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={cn(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-all",
                    selectedDuration === duration.value
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {(isRunning || (session && !session.isStopped && !session.endTimestamp)) && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                📊 Your current progress will be saved:
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-green-600 font-medium">
                  Productive: {Math.floor(productiveSeconds / 60)}m {productiveSeconds % 60}s
                </span>
                <span className="text-red-500 font-medium">
                  Wasted: {Math.floor(wastedSeconds / 60)}m {wastedSeconds % 60}s
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeBreakDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartBreak}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Coffee className="h-4 w-4 mr-2" />
              Start {selectedDuration} min Break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BreakFAB;
