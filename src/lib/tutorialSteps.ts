// Tutorial step definitions
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target: string;
  action?: 'click' | 'input' | 'navigate' | 'wait' | 'auto';
  highlightElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitTime?: number; // seconds to wait before auto-advancing
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Create Your First Workplan',
    description: 'Let us start by creating a workplan. Click the "New Workplan" button.',
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
    action: 'auto',
    highlightElement: '[data-tutorial="add-task-btn"]',
    position: 'bottom',
    waitTime: 3
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
    description: 'Now let us plan your day. Click on the "Today" tab at the bottom.',
    target: '/today',
    action: 'navigate',
    highlightElement: '[data-tutorial="today-nav"]',
    position: 'top'
  },
  {
    id: 5,
    title: 'Set Your Daily Goal',
    description: 'Set how many timeblocks you want to complete today.',
    target: '/today',
    action: 'auto',
    highlightElement: '[data-tutorial="set-goal-btn"]',
    position: 'bottom',
    waitTime: 3
  },
  {
    id: 6,
    title: 'Add a Task for Today',
    description: 'Add a task from your workplan to today schedule.',
    target: '/today',
    action: 'auto',
    highlightElement: '[data-tutorial="add-today-task-btn"]',
    position: 'bottom',
    waitTime: 3
  },
  {
    id: 7,
    title: 'Start Your Timer',
    description: 'Click the "Start" button on your task to begin tracking time.',
    target: '/timer',
    action: 'navigate',
    highlightElement: '[data-tutorial="start-timer-btn"]',
    position: 'bottom'
  },
  {
    id: 8,
    title: 'Timer is Running',
    description: 'Great! Work on your task. The timer tracks your productive time.',
    target: '/timer',
    action: 'auto',
    position: 'center',
    waitTime: 30
  },
  {
    id: 9,
    title: 'Pause When Distracted',
    description: 'Click pause to simulate a distraction (wasted time).',
    target: '/timer',
    action: 'auto',
    highlightElement: '[data-tutorial="pause-timer-btn"]',
    position: 'bottom',
    waitTime: 3
  },
  {
    id: 10,
    title: 'Wasted Time Tracking',
    description: 'Wait a moment. Wasted time is being tracked while paused.',
    target: '/timer',
    action: 'auto',
    position: 'center',
    waitTime: 30
  },
  {
    id: 11,
    title: 'Stop the Timer',
    description: 'Now stop the timer to complete your timeblock session.',
    target: '/timer',
    action: 'auto',
    highlightElement: '[data-tutorial="stop-timer-btn"]',
    position: 'bottom',
    waitTime: 3
  },
  {
    id: 12,
    title: 'View Your Reports',
    description: 'Excellent! Now let us see your productivity report. Go to Reports.',
    target: '/reports',
    action: 'navigate',
    highlightElement: '[data-tutorial="reports-nav"]',
    position: 'top'
  }
];
