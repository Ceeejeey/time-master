import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Step } from 'react-joyride';
import { getTutorialProgress, saveTutorialProgress, TutorialProgress } from '@/lib/storage';
import { TUTORIAL_STEPS } from '@/lib/tutorial-steps';
import { waitForElement, getAccurateBoundingRect, sleep } from '@/lib/utils';

interface CallBackProps {
  status: string;
  type: string;
  index: number;
  action: string;
  lifecycle?: string;
  controlled?: boolean;
  size?: number;
  step?: Step;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  run: boolean;
  steps: Step[];
  disableNavigation: boolean;
  isTooltipVisible: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  isStepCompleted: (stepIndex: number) => boolean;
  handleJoyrideCallback: (data: CallBackProps) => void;
  handleAction: (action: string) => void;
  triggerStep: (action: string) => Promise<void>;
  toggleTooltip: () => void;
  showTooltip: () => void;
  hideTooltip: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [run, setRun] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Debounce refs to prevent rapid-fire calls
  const lastActionTimeRef = useRef<number>(0);
  const lastActionRef = useRef<string>('');
  const isAdvancingRef = useRef<boolean>(false);
  const [disableNavigation, setDisableNavigation] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);

  // Check if haptics are available
  const isNative = Capacitor.isNativePlatform();

  // Trigger haptic feedback
  const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    if (!isNative) return;
    
    try {
      if (type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Haptics.notification({ type: 'success' as any });
      } else {
        const style = type === 'light' ? ImpactStyle.Light : 
                      type === 'medium' ? ImpactStyle.Medium : 
                      ImpactStyle.Heavy;
        await Haptics.impact({ style });
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }, [isNative]);

  // Load tutorial progress from database
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await getTutorialProgress();
        
        if (progress) {
          if (progress.tutorialCompleted) {
            setIsActive(false);
            setRun(false);
            setDisableNavigation(false);
          } else if (progress.tutorialStarted) {
            // Resume tutorial
            setIsActive(true);
            setCurrentStep(progress.currentStep);
            setCompletedSteps(progress.completedSteps);
            setRun(true);
            setDisableNavigation(true);
            setIsTooltipVisible(true);
          }
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
        setIsLoaded(true);
      }
    };

    loadProgress();
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async (data: Partial<TutorialProgress>) => {
    try {
      const current = await getTutorialProgress();
      const newProgress: TutorialProgress = {
        tutorialStarted: data.tutorialStarted ?? current?.tutorialStarted ?? true,
        tutorialCompleted: data.tutorialCompleted ?? current?.tutorialCompleted ?? false,
        currentStep: data.currentStep ?? current?.currentStep ?? 0,
        completedSteps: data.completedSteps ?? current?.completedSteps ?? [],
        lastUpdatedTimestamp: new Date().toISOString()
      };
      
      await saveTutorialProgress(newProgress);
    } catch (error) {
      console.error('Failed to save tutorial progress:', error);
    }
  }, []);

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setRun(true);
    setDisableNavigation(true);
    setIsTooltipVisible(true);
    triggerHaptic('medium');
    saveProgress({ tutorialStarted: true, tutorialCompleted: false, currentStep: 0, completedSteps: [] });
  }, [saveProgress, triggerHaptic]);

  const nextStep = useCallback(() => {
    // Prevent rapid-fire calls with a lock
    if (isAdvancingRef.current) {
      console.log('[Tutorial] nextStep - BLOCKED (already advancing)');
      return;
    }
    
    isAdvancingRef.current = true;
    
    triggerHaptic('light');
    const nextStepIndex = currentStep + 1;
    
    console.log('[Tutorial] nextStep - advancing from', currentStep, 'to', nextStepIndex);
    
    if (nextStepIndex < TUTORIAL_STEPS.length) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(nextStepIndex);
      setIsTooltipVisible(true); // Always show tooltip on new step
      saveProgress({ 
        currentStep: nextStepIndex, 
        completedSteps: [...completedSteps, currentStep] 
      });
    } else {
      completeTutorial();
    }
    
    // Release lock after a short delay
    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, completedSteps, saveProgress, triggerHaptic]);

  const prevStep = useCallback(() => {
    triggerHaptic('light');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setIsTooltipVisible(true);
      saveProgress({ currentStep: currentStep - 1 });
    }
  }, [currentStep, saveProgress, triggerHaptic]);

  const skipTutorial = useCallback(() => {
    triggerHaptic('medium');
    setIsActive(false);
    setRun(false);
    setDisableNavigation(false);
    saveProgress({ tutorialCompleted: true });
  }, [saveProgress, triggerHaptic]);

  const completeTutorial = useCallback(() => {
    triggerHaptic('success');
    setIsActive(false);
    setRun(false);
    setDisableNavigation(false);
    setCompletedSteps(TUTORIAL_STEPS.map((_, i) => i));
    saveProgress({ 
      tutorialCompleted: true, 
      completedSteps: TUTORIAL_STEPS.map((_, i) => i) 
    });
  }, [saveProgress, triggerHaptic]);

  const resetTutorial = useCallback(async () => {
    try {
      const { resetTutorialProgress } = await import('@/lib/storage');
      await resetTutorialProgress();
      setIsActive(false);
      setCurrentStep(0);
      setCompletedSteps([]);
      setRun(false);
      setDisableNavigation(false);
      setIsTooltipVisible(true);
      triggerHaptic('medium');
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
    }
  }, [triggerHaptic]);

  const isStepCompleted = useCallback((stepIndex: number) => {
    return completedSteps.includes(stepIndex);
  }, [completedSteps]);

  const handleAction = useCallback(async (action: string) => {
    console.log('[Tutorial] handleAction called with:', action, 'isActive:', isActive, 'run:', run, 'currentStep:', currentStep);
    
    if (!isActive || !run) {
      console.log('[Tutorial] handleAction - early return (not active or not running)');
      return;
    }
    
    // Debounce: prevent same action from firing multiple times rapidly
    const now = Date.now();
    if (action === lastActionRef.current && now - lastActionTimeRef.current < 1000) {
      console.log('[Tutorial] handleAction - BLOCKED (same action debounce)');
      return;
    }
    
    // Check if already advancing (another handleAction is in progress)
    if (isAdvancingRef.current) {
      console.log('[Tutorial] handleAction - BLOCKED (already advancing)');
      return;
    }
    
    const currentStepData = TUTORIAL_STEPS[currentStep];
    console.log('[Tutorial] currentStepData:', { target: currentStepData?.target, expectedAction: currentStepData?.data?.action });
    
    // Check if the action matches the required action for the current step
    // Using 'action' property from data object as defined in tutorial-steps.ts
    if (currentStepData.data?.action === action) {
      console.log('[Tutorial] Action MATCHES! Advancing to next step...');
      
      // Record this action to prevent duplicate calls
      lastActionRef.current = action;
      lastActionTimeRef.current = now;
      
      // Set advancing lock to prevent other handleAction calls during async work
      // BUT we'll release it before calling nextStep so nextStep can set its own lock
      isAdvancingRef.current = true;
      
      // Special handling for actions that navigate to form pages
      // These should NOT wait for next element, just advance immediately
      // The form page will hide the tutorial, and when user returns, the element should exist
      const formNavigationActions = ['click-add-task', 'click-set-goal', 'click-add-today-task'];
      
      if (formNavigationActions.includes(action)) {
        console.log('[Tutorial] Form navigation action - advancing without waiting for element');
        
        // For 'click-add-task', skip the "Task Added" step and go directly to "Today Navigation"
        // This provides a better flow - user doesn't need to see the task they just created
        if (action === 'click-add-task') {
          console.log('[Tutorial] Skipping Task Added step, going to Today Navigation');
          // Directly set step 6 (Today Nav) instead of calling nextStep twice
          // Step 4 = Add Task, Step 5 = Task Added (skip), Step 6 = Today Navigation
          const todayNavStep = currentStep + 2; // Skip one step
          const newCompletedSteps = [...completedSteps, currentStep, currentStep + 1];
          
          setCompletedSteps(newCompletedSteps);
          setCurrentStep(todayNavStep);
          setIsTooltipVisible(true);
          saveProgress({ 
            currentStep: todayNavStep, 
            completedSteps: newCompletedSteps 
          });
          
          // Release lock
          setTimeout(() => {
            isAdvancingRef.current = false;
          }, 500);
        } else {
          // Release lock before calling nextStep
          isAdvancingRef.current = false;
          nextStep();
        }
        return;
      }
      
      // Determine the next step's target
      const nextStepIndex = currentStep + 1;
      
      if (nextStepIndex < TUTORIAL_STEPS.length) {
        const nextStepTarget = TUTORIAL_STEPS[nextStepIndex].target;
        console.log('[Tutorial] Next step target:', nextStepTarget);
        
        // If the target is a string selector, wait for it
        if (typeof nextStepTarget === 'string' && nextStepTarget !== 'body') {
          // Wait for the element to appear before advancing
          // This ensures the UI has fully rendered the target element
          console.log('[Tutorial] Waiting for element:', nextStepTarget);
          await waitForElement(nextStepTarget, 5000);
        } else {
          // Fallback delay if target is body or not a string
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Release lock before calling nextStep
      isAdvancingRef.current = false;
      nextStep();
    } else {
      console.log('[Tutorial] Action does NOT match. Expected:', currentStepData?.data?.action, 'Got:', action);
    }
  }, [isActive, run, currentStep, nextStep]);

  const triggerStep = useCallback(async (action: string) => {
    if (!isActive || !run) return;

    if (action === 'goto-today') {
      // Special flow for "Go to Today"
      // 1. Wait for navigation to complete (we assume caller handles navigation or we wait for element)
      // 2. Find the step index for "Today Navigation" (target: #today-nav)
      const todayStepIndex = TUTORIAL_STEPS.findIndex(s => s.target === '#today-nav');
      
      if (todayStepIndex !== -1) {
        // Wait for the element to be available and stable
        console.log('[TUTORIAL] Waiting for #today-nav');
        // Wait a bit for page transition
        await sleep(500);
        
        const rect = await getAccurateBoundingRect('#today-nav', 10, 300);
        
        if (rect) {
          console.log('[TUTORIAL] Found #today-nav, advancing to step', todayStepIndex);
          setCurrentStep(todayStepIndex);
          setIsTooltipVisible(true);
          // Update completed steps up to this point
          const newCompleted = [...completedSteps];
          if (!newCompleted.includes(currentStep)) newCompleted.push(currentStep);
          
          saveProgress({ currentStep: todayStepIndex, completedSteps: newCompleted });
        } else {
          console.warn('[TUTORIAL] #today-nav not found after retries');
        }
      }
    } else {
      // Default behavior: delegate to handleAction
      handleAction(action);
    }
  }, [isActive, run, currentStep, completedSteps, saveProgress, handleAction]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, step } = data;
    
    // Handle different Joyride events
    if (type === 'step:after' || action === 'next') {
      // Only advance if no required action or if it's a manual next click (which we might want to disable for action-required steps)
      if (!step.data?.action) {
        nextStep();
      }
    } else if (action === 'skip' || action === 'close') {
      skipTutorial();
    } else if (action === 'prev') {
      prevStep();
    } else if (status === 'finished') {
      completeTutorial();
    }
  }, [nextStep, prevStep, skipTutorial, completeTutorial]);

  const toggleTooltip = useCallback(() => {
    setIsTooltipVisible(prev => !prev);
  }, []);

  const showTooltip = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        completedSteps,
        run,
        steps: TUTORIAL_STEPS,
        disableNavigation,
        isTooltipVisible,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        completeTutorial,
        resetTutorial,
        isStepCompleted,
        handleJoyrideCallback,
        handleAction,
        triggerStep,
        toggleTooltip,
        showTooltip,
        hideTooltip
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
