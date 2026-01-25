import Joyride, { CallBackProps, TooltipRenderProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import Lottie from 'lottie-react';
import { Sparkles, GripHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Floating mascot animation (simple bounce effect)
const mascotAnimation = {
  "v": "5.9.0",
  "fr": 30,
  "ip": 0,
  "op": 90,
  "w": 120,
  "h": 120,
  "nm": "Mascot",
  "ddd": 0,
  "assets": [],
  "layers": [{
    "ddd": 0,
    "ind": 1,
    "ty": 4,
    "nm": "Star",
    "sr": 1,
    "ks": {
      "o": { "a": 0, "k": 100 },
      "r": { 
        "a": 1,
        "k": [
          { "t": 0, "s": [0] },
          { "t": 90, "s": [360] }
        ]
      },
      "p": { 
        "a": 1,
        "k": [
          { "t": 0, "s": [60, 70, 0], "e": [60, 50, 0] },
          { "t": 45, "s": [60, 50, 0], "e": [60, 70, 0] },
          { "t": 90, "s": [60, 70, 0] }
        ]
      },
      "a": { "a": 0, "k": [0, 0, 0] },
      "s": { 
        "a": 1,
        "k": [
          { "t": 0, "s": [80, 80, 100], "e": [100, 100, 100] },
          { "t": 45, "s": [100, 100, 100], "e": [80, 80, 100] },
          { "t": 90, "s": [80, 80, 100] }
        ]
      }
    },
    "ao": 0,
    "shapes": [{
      "ty": "gr",
      "it": [
        {
          "ty": "sr",
          "sy": 1,
          "d": 1,
          "pt": { "a": 0, "k": 5 },
          "p": { "a": 0, "k": [0, 0] },
          "r": { "a": 0, "k": 0 },
          "ir": { "a": 0, "k": 10 },
          "is": { "a": 0, "k": 0 },
          "or": { "a": 0, "k": 25 },
          "os": { "a": 0, "k": 0 }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.99, 0.8, 0.2, 1] },
          "o": { "a": 0, "k": 100 }
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }],
    "ip": 0,
    "op": 90,
    "st": 0
  }],
  "markers": []
};

const CustomTooltip = ({
  step,
  tooltipProps,
  skipProps,
  primaryProps,
  index,
  size,
  isLastStep,
}: TooltipRenderProps & { isSpotlightVisible?: boolean }) => {
  const { hideTooltip } = useTutorial();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentTranslateRef = useRef({ x: 0, y: 0 });
  const initialTranslateRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); // Prevent touch scrolling
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialTranslateRef.current = { ...currentTranslateRef.current };
    
    // Disable transition during drag for instant response
    if (tooltipRef.current) {
        tooltipRef.current.style.transition = 'none';
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      
      currentTranslateRef.current = {
        x: initialTranslateRef.current.x + dx,
        y: initialTranslateRef.current.y + dy
      };
      
      if (tooltipRef.current) {
        // We preserve the Joyride transform and append ours
        // Note: Joyride uses 'transform' in tooltipProps.style. 
        // We need to respect it BUT we wrap the tooltip in a relative container or just assume Joyride's transform is static during the step.
        // Actually, Joyride's transform is usually something like 'translate3d(100px, 200px, 0)'.
        // If we want to ADD to it, we can just append another translate.
        const baseTransform = (tooltipProps as any).style?.transform || '';
        tooltipRef.current.style.transform = `${baseTransform} translate(${currentTranslateRef.current.x}px, ${currentTranslateRef.current.y}px)`;
      }
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      // Re-enable transition (optional, maybe not needed for position)
      if (tooltipRef.current) {
          tooltipRef.current.style.transition = '';
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      ref={tooltipRef}
      {...tooltipProps}
      style={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((tooltipProps as any).style || {}),
        // Apply initial/persisted offset on render
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: `${(tooltipProps as any).style?.transform || ''} translate(${currentTranslateRef.current.x}px, ${currentTranslateRef.current.y}px)`,
        cursor: 'default',
        touchAction: 'none' // Critical for touch devices
      }}
      className="bg-card/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl shadow-2xl p-0 max-w-[calc(100vw-32px)] w-[420px] relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
    >
       {/* Drag Handle Area */}
       <div 
         className="h-12 bg-muted/40 flex justify-center items-center cursor-grab active:cursor-grabbing border-b border-border/50 hover:bg-muted/60 transition-colors touch-none"
         onPointerDown={handlePointerDown}
       >
         <GripHorizontal className="w-12 h-6 text-muted-foreground/60" />
       </div>

       {/* Content Area */}
       <div 
         className="p-5 cursor-pointer active:scale-[0.99] transition-transform"
         onClick={() => {
            const dragDist = Math.hypot(
                currentTranslateRef.current.x - initialTranslateRef.current.x,
                currentTranslateRef.current.y - initialTranslateRef.current.y
            );
            if (dragDist < 5) hideTooltip();
         }}
       >
         {/* ... content ... */}
         {step.title && (
           <h4 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
             {step.title}
           </h4>
         )}
         <div className="text-foreground/90 leading-relaxed text-base">
           {step.content}
         </div>
         <p className="text-xs text-muted-foreground mt-4 italic opacity-70">
           Tap this card to hide it temporarily
         </p>
       </div>

       {/* Footer */}
       <div className="px-5 py-4 bg-muted/20 border-t border-border/50 flex justify-between items-center gap-4">
          {/* ... footer content same ... */}
          <div className="flex items-center gap-3">
            <button 
              {...skipProps} 
              className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-md hover:bg-destructive/10"
            >
              Skip Tutorial
            </button>
            <div className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {index + 1} / {size}
            </div>
          </div>
          
          {(index === 0 || isLastStep) && (
            <Button 
              size="sm" 
              {...primaryProps}
              className="ml-auto shadow-sm"
            >
              {index === 0 ? "Let's Start" : "Finish"}
            </Button>
          )}
       </div>
    </div>
  );
};

// ... exports ...

export const TutorialOverlay = () => {
  // ... hooks ...
  const { run, steps, currentStep, completedSteps, handleJoyrideCallback, isTooltipVisible, showTooltip } = useTutorial();
  const location = useLocation();

  // EARLY EXIT: Don't render anything on form pages - prevents ALL interference with scrolling
  const isFormPage = location.pathname.includes('/new') || location.pathname.includes('/edit') || location.pathname.includes('/goal');
  
  // Debug logging
  console.log('[TutorialOverlay] pathname:', location.pathname, 'isFormPage:', isFormPage, 'run:', run);
  
  // Also early exit if tutorial isn't running
  if (isFormPage || !run) {
    console.log('[TutorialOverlay] EARLY EXIT - returning null. isFormPage:', isFormPage, 'run:', run);
    return null;
  }

  console.log('[TutorialOverlay] Rendering TutorialOverlayContent');
  return <TutorialOverlayContent />;
};

// Separate component to avoid hooks running when we return null
const TutorialOverlayContent = () => {
  const { run, steps, currentStep, completedSteps, handleJoyrideCallback, isTooltipVisible, showTooltip, hideTooltip } = useTutorial();
  const location = useLocation();

  const [manualSpotlight, setManualSpotlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  
  const [isSpotlightVisible, setIsSpotlightVisible] = useState(false);
  
  // Auto-minimize timer ref
  const autoMinimizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-minimize effect: Hide tooltip after 5 seconds of inactivity
  // EXCEPT for the welcome step (step 0) which should stay visible
  useEffect(() => {
    // Clear any existing timer
    if (autoMinimizeTimerRef.current) {
      clearTimeout(autoMinimizeTimerRef.current);
      autoMinimizeTimerRef.current = null;
    }
    
    // Don't auto-minimize the welcome step (step 0) or if already hidden
    if (currentStep === 0 || !isTooltipVisible) {
      return;
    }
    
    // Set timer to auto-minimize after 8 seconds
    autoMinimizeTimerRef.current = setTimeout(() => {
      console.log('[TutorialOverlay] Auto-minimizing tooltip after 8 seconds');
      hideTooltip();
    }, 8000);
    
    return () => {
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
        autoMinimizeTimerRef.current = null;
      }
    };
  }, [currentStep, isTooltipVisible, hideTooltip]);

  // Ref for debouncing spotlight disappearance
  const consecutiveFailuresRef = useRef(0);

  // NEW: Robust polling for "Jumpy" elements
  // We want to track the element position continuously while the step is active,
  // NOT just on scroll/resize. This handles layout shifts (images loading, accordion expanding).
  useEffect(() => {
    // Only poll when tooltip is visible (user is actively viewing the step)
    if (!isTooltipVisible) return;
    
    const step = steps[currentStep];
    if (!step || typeof step.target !== 'string' || step.target === 'body') return;

    // Reset failures on step change
    consecutiveFailuresRef.current = 0;

    // Check if target element exists on current page - if not, don't spam errors
    // This handles the case where tutorial step expects element on a different page
    const targetSelector = step.target as string;
    
    // Map selectors to expected pages
    const selectorPageMap: Record<string, string[]> = {
      '#today-nav': ['/workplan', '/today', '/timer', '/reports', '/'], // Bottom nav visible on all pages
      '#nav-workplan-tab': ['/workplan', '/today', '/timer', '/reports', '/'],
      '#nav-reports': ['/workplan', '/today', '/timer', '/reports', '/'],
      '[data-tutorial="today-goal-card"]': ['/today'],
      '[data-tutorial="add-today-task"]': ['/today'],
      '[data-tutorial="start-task-button"]': ['/today'],
      '[data-tutorial="create-workplan-btn"]': ['/workplan'],
      '[data-tutorial="workplan-list-item"]': ['/workplan'],
      '[data-tutorial="add-workplan-task"]': ['/workplan'],
      '[data-tutorial="workplan-item"]': ['/workplan'],
      '[data-tutorial="start-timer-btn"]': ['/timer'],
      '[data-tutorial="timer-pause-button"]': ['/timer'],
      '[data-tutorial="timer-stop-button"]': ['/timer'],
    };
    
    const expectedPages = selectorPageMap[targetSelector];
    // Fix: Handle root path '/' correctly - don't append '/' to it
    if (expectedPages && !expectedPages.some(p => {
      if (p === '/') return location.pathname === '/';
      return location.pathname === p || location.pathname.startsWith(p + '/');
    })) {
      // Element not expected on this page, don't track - just show dimmer
      console.log('[Tutorial] Element not expected on this page:', targetSelector, 'current:', location.pathname);
      setManualSpotlight(null);
      return;
    }

    const trackElement = () => {
        const el = document.querySelector(step.target as string);
        
        if (el) {
            const rect = el.getBoundingClientRect();
             
             // Check if element is effectively hidden or 0-size
             if (rect.width === 0 || rect.height === 0) {
                 consecutiveFailuresRef.current++;
                 if (consecutiveFailuresRef.current > 10) {
                    setManualSpotlight(null);
                    // Silent log only - no spam toast
                    console.log('[Tutorial] Target found but size is 0:', step.target);
                 }
                 return;
             }

             // Element found and valid! Reset failures.
             consecutiveFailuresRef.current = 0;

             // Only update if it actually changed significantly to avoid react render loops
            setManualSpotlight(prev => {
                // If we are recovering from a null state, update immediately
                if (!prev) {
                    return {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    };
                }
                
                if (Math.abs(prev.top - rect.top) < 1 &&
                    Math.abs(prev.left - rect.left) < 1 &&
                    Math.abs(prev.width - rect.width) < 1 &&
                    Math.abs(prev.height - rect.height) < 1
                ) {
                    return prev;
                }
                return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                };
            });
        } else {
            // Element missing - only log, no toast spam
            consecutiveFailuresRef.current++;
            if (consecutiveFailuresRef.current > 10) {
                 setManualSpotlight(null);
                 // Silent log only
                 console.log('[Tutorial] Element missing:', step.target);
            }
        }
    };

    // Slower poll (200ms) - fast enough for smooth updates but not excessive
    const interval = setInterval(trackElement, 200);
    return () => clearInterval(interval);
  }, [currentStep, steps, isTooltipVisible, location.pathname]); // Run when tooltip is visible/trying to be visible

  useEffect(() => {
    // 1. Reset/Hide with fade out immediately
    setIsSpotlightVisible(false);

    const step = steps[currentStep];
    if (!step || typeof step.target !== 'string' || step.target === 'body') {
      setManualSpotlight(null);
      // Only fade in body dimmer if NOT on form page (already checked above, but good for safety)
      setTimeout(() => setIsSpotlightVisible(true), 300);
      return;
    }

    let scrollTimer: NodeJS.Timeout;
    let retryTimer: NodeJS.Timeout;
    let cancelled = false; // Flag to stop retries when effect is cleaned up
    
    // Retry logic for finding element
    let retryCount = 0;
    const maxRetries = 20; // 2 seconds approx

    const performFocus = () => {
      // Check if effect was cleaned up
      if (cancelled) return;
      
      const el = document.querySelector(step.target as string);
      
      if (el) {
        // Found it!
        // A. Scroll into view (ONLY if not already visible)
        const rect = el.getBoundingClientRect();
        const isInViewport = (
             rect.top >= 0 &&
             rect.left >= 0 &&
             rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
             rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isInViewport) {
             el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }

        // B. Wait for scroll to settle
        scrollTimer = setTimeout(() => {
             if (cancelled) return;
             const updatedRect = el.getBoundingClientRect();
             if (updatedRect.width > 0) {
                 setManualSpotlight({
                    top: updatedRect.top, left: updatedRect.left, width: updatedRect.width, height: updatedRect.height
                 });
             } else {
                 setManualSpotlight(null);
                 console.log('[Tutorial] Target exists but has 0 size:', step.target);
             }
             // C. Fade In
             setIsSpotlightVisible(true);
        }, 700);
      } else {
          // Not found yet... retry?
          if (retryCount < maxRetries && !cancelled) {
              retryCount++;
              retryTimer = setTimeout(performFocus, 100);
          } else if (!cancelled) {
              // Give up, show full dimmer
              setManualSpotlight(null);
              setIsSpotlightVisible(true);
              console.log('[Tutorial] Element not found after retries:', step.target);
          }
      }

    };
    
    // Start sequence
    retryTimer = setTimeout(performFocus, 100);

    return () => {
      cancelled = true;
      clearTimeout(scrollTimer);
      clearTimeout(retryTimer);
    };
  }, [currentStep, steps, location.pathname]);
  
  // Simplified: isFormPage check no longer needed here (handled by early return in parent)
  // Only run if tooltip is visible
  const shouldRun = isTooltipVisible;

  const progress = ((completedSteps.length / steps.length) * 100).toFixed(0);

  return (
    <>
      {/* Animated Progress Bar at Top */}
      {shouldRun && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-zinc-200 dark:bg-zinc-800">
          <div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* GLOBAL CUSTOM SPOTLIGHT & DIMMER */}
      {shouldRun && manualSpotlight && (
        <div
          style={{
            position: 'fixed',
            top: manualSpotlight.top,
            left: manualSpotlight.left,
            width: manualSpotlight.width,
            height: manualSpotlight.height,
            borderRadius: '12px',
            // Box shadow creates the dimming effect around the spotlight
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 4px hsl(var(--primary))', // Visible dimming
            zIndex: 99, // Above navbar (z-50) but below tooltip
            pointerEvents: 'none',
            transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isSpotlightVisible ? 1 : 0, 
          }}
        />
      )}
      
      {shouldRun && !manualSpotlight && isSpotlightVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Visible dimming for body steps
            zIndex: 99, // Above navbar (z-50) to create proper dim effect
            transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 1,
            pointerEvents: 'none', // Allow clicks through
          }}
        />
      )}

      {/* Step Counter Button (Fixed Bottom) - REMOVED, replaced by FAB */}
      
      {/* Minimized Tutorial FAB (Fixed Bottom Right) - Shows when tooltip is hidden */}
      {!isTooltipVisible && (
        <button
          onClick={showTooltip}
          className={`
            fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] right-4 z-[9999]
            w-14 h-14 rounded-full
            bg-gradient-to-br from-primary to-primary/80
            shadow-lg shadow-primary/30
            flex items-center justify-center
            transition-all duration-300 ease-out
            active:scale-95
            animate-in fade-in zoom-in-75 duration-300
          `}
          style={{
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <Sparkles className="w-6 h-6 text-primary-foreground" />
          {/* Step badge */}
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background">
            {currentStep + 1}
          </span>
        </button>
      )}

      {/* React Joyride - isFormPage check handled by parent component early return */}
      <Joyride
        steps={steps}
        run={shouldRun} // Hide Joyride when tooltip is hidden
        continuous={true}
        showSkipButton={true}
        showProgress={false}
        callback={handleJoyrideCallback}
        stepIndex={currentStep}
        disableOverlayClose={true}
        disableCloseOnEsc={true}
        spotlightPadding={8}
        scrollToFirstStep={true}
        scrollOffset={100}
        disableScrolling={false}
        spotlightClicks={true}
        disableScrollParentFix={true}
        tooltipComponent={CustomTooltip}
        floaterProps={{
          disableAnimation: true,
          styles: {
              arrow: {
                display: 'none'
              },
              floater: {
                filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))',
                transition: 'transform 0.2s ease-out',
                // We rely on Joyride to position the tooltip (floater) which usually works fine.
                // If floater positioning is also wrong, we'd need to manual that too, but usually it's just the spotlight.
              }
            },
            offset: 20
          }}
          styles={{
            options: {
              arrowColor: 'transparent',
              backgroundColor: 'transparent',
              overlayColor: 'transparent', // HIDE DEFAULT OVERLAY
              primaryColor: 'hsl(var(--primary))',
              textColor: 'hsl(var(--foreground))',
              width: undefined,
              zIndex: 9998, // Ensure tooltip is above our custom overlay (99) and everything else
            },
            spotlight: {
              // HIDE DEFAULT SPOTLIGHT COMPLETELY
              opacity: 0,
              pointerEvents: 'none',
              display: 'none'
            },
            overlay: {
               // HIDE DEFAULT OVERLAY
              display: 'none'
            },
            overlayLegacy: {
               display: 'none'
            }
          }}
        />

      {/* Custom CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(var(--primary), 0.4), 0 0 0 0 rgba(var(--primary), 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 6px 20px rgba(var(--primary), 0.6), 0 0 0 8px rgba(var(--primary), 0);
            transform: scale(1.05);
          }
        }

        /* Material You inspired transitions */
        [data-tutorial] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        [data-tutorial]:focus-visible {
          outline: 3px solid hsl(var(--primary) / 0.5);
          outline-offset: 2px;
        }

        /* Auto-scroll smooth behavior */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  );
};

