import { PriorityQuadrant } from './types';

export const getPriorityLabel = (quadrant: PriorityQuadrant): string => {
  switch (quadrant) {
    case 'essential_immediate':
      return 'Do First';
    case 'essential_not_immediate':
      return 'Schedule';
    case 'not_essential_immediate':
      return 'Delegate';
    case 'not_essential_not_immediate':
      return 'Eliminate';
  }
};

export const getPriorityColor = (quadrant: PriorityQuadrant): string => {
  switch (quadrant) {
    case 'essential_immediate':
      return 'hsl(var(--priority-essential-immediate))';
    case 'essential_not_immediate':
      return 'hsl(var(--priority-essential-not-immediate))';
    case 'not_essential_immediate':
      return 'hsl(var(--priority-not-essential-immediate))';
    case 'not_essential_not_immediate':
      return 'hsl(var(--priority-not-essential-not-immediate))';
  }
};

export const getPriorityDescription = (quadrant: PriorityQuadrant): string => {
  switch (quadrant) {
    case 'essential_immediate':
      return 'Essential and urgent - do these immediately';
    case 'essential_not_immediate':
      return 'Essential but not urgent - schedule these';
    case 'not_essential_immediate':
      return 'Urgent but not essential - delegate if possible';
    case 'not_essential_not_immediate':
      return 'Neither urgent nor essential - eliminate or minimize';
  }
};

export const PRIORITY_QUADRANTS: PriorityQuadrant[] = [
  'essential_immediate',
  'essential_not_immediate',
  'not_essential_immediate',
  'not_essential_not_immediate',
];
