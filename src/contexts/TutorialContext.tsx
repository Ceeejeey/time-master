import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target: string; // CSS selector or page route
  action?: 'click' | 'input' | 'navigate' | 'wait';
  validation?: () => boolean;
  highlightElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Create Your First Workplan',
    description: 'Let us start by creating a workplan. Click the "Create Workplan" button.',
    target: '/workplan',
    action: 'navigate',
    highlightElement: '[data-tutorial="create-workplan-btn"]',
    position: 'bottom'
  },
  {
    id: 2,
    title: 'Add a Task to Your Workplan',
    description: 'Great! Now add your first task to see it in the Eisenhower Matrix.',
    target: '/workplan',
    action: 'click',
    highlightElement: '[data-tutorial="add-task-btn"]',
    position: 'bottom'
  },
  {
    id: 3,
    title: 'View Your Task in the Matrix',
    description: 'Awesome! Your task is now visible in the Eisenhower Matrix based on its priority.',
    target: '/workplan',
    action: 'wait',
    position: 'center'
  },
  {
    id: 4,
    title: 'Navigate to Today Section',
    description: 'Now let us plan your day. Click on the "Today" tab.',
    target: '/today',
    action: 'navigate',
    highlightElement: '[data-tutorial="today-nav"]',
    position: 'top'
  },
  {
    id: 5,
    title: 'Set Your Daily Goal',
    description: 'Set how many timeblocks you want to complete today and the duration for each.',
    target: '/today',
    action: 'click',
    highlightElement: '[data-tutorial="set-goal-btn"]',
    position: 'bottom'
  },
  {
    id: 6,
    title: 'Add a Task for Today',
    description: 'Add a task from your workplan to today schedule.',
    target: '/today',
    action: 'click',
    highlightElement: '[data-tutorial="add-today-task-btn"]',
    position: 'bottom'
  },
  {
    id: 7,
    title: 'Start Your First Timer Session',
    description: 'Click the "Start" button on your task to begin tracking time.',
    target: '/timer',
    action: 'navigate',
    highlightElement: '[data-tutorial="start-timer-btn"]',
    position: 'bottom'
  },
  {
    id: 8,
    title: 'Focus on Your Task',
    description: 'Great! The timer is running. Work on your task for about 30 seconds (productive time).',
    target: '/timer',
    action: 'wait',
    position: 'center'
  },
  {
    id: 9,
    title: 'Pause When Distracted',
    description: 'Now pause the timer by clicking the pause button. This simulates a distraction.',
    target: '/timer',
    action: 'click',
    highlightElement: '[data-tutorial="pause-timer-btn"]',
    position: 'bottom'
  },
  {
    id: 10,
    title: 'Track Wasted Time',
    description: 'Wait for about 30 seconds. This time will be tracked as wasted time.',
    target: '/timer',
    action: 'wait',
    position: 'center'
  },
  {
    id: 11,
    title: 'Stop the Session',
    description: 'Now stop the timer to complete your first timeblock session.',
    target: '/timer',
    action: 'click',
    highlightElement: '[data-tutorial="stop-timer-btn"]',
    position: 'bottom'
  },
  {
    id: 12,
    title: 'View Your Progress',
    description: 'Excellent! Now let\'s see your productivity report. Go to the Reports section.',
    target: '/reports',
    action: 'navigate',
    highlightElement: '[data-tutorial="reports-nav"]',
    position: 'top'
  }
];

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  startTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  isStepCompleted: (stepId: number) => boolean;
  getCurrentStep: () => TutorialStep | null;
  markStepComplete: (stepId: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = 'timemaster_tutorial_completed';

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Check if tutorial has been completed
    const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!tutorialCompleted) {
      // Auto-start tutorial for first-time users after a brief delay
      const timer = setTimeout(() => {
        const hasUser = localStorage.getItem('timemaster_has_user');
        if (hasUser === 'true') {
          startTutorial();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setIsActive(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setIsActive(false);
    setCompletedSteps(TUTORIAL_STEPS.map(s => s.id));
  };

  const isStepCompleted = (stepId: number) => {
    return completedSteps.includes(stepId);
  };

  const getCurrentStep = (): TutorialStep | null => {
    return TUTORIAL_STEPS.find(step => step.id === currentStep) || null;
  };

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        completedSteps,
        startTutorial,
        nextStep,
        skipTutorial,
        completeTutorial,
        isStepCompleted,
        getCurrentStep,
        markStepComplete
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
