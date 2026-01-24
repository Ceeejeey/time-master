import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, X, Sparkles } from 'lucide-react';

export const TutorialOverlay = () => {
  const { isActive, currentStep, nextStep, skipTutorial, getCurrentStep, completedSteps } = useTutorial();
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const step = getCurrentStep();

  useEffect(() => {
    if (!isActive || !step) {
      setHighlightedElement(null);
      return;
    }

    // Navigate to the target page if needed
    if (step.target && location.pathname !== step.target && step.action === 'navigate') {
      const timer = setTimeout(() => {
        navigate(step.target);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Highlight the target element
    if (step.highlightElement) {
      const timer = setTimeout(() => {
        const element = document.querySelector(step.highlightElement!) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          // Scroll to element
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, step, location.pathname, navigate]);

  useEffect(() => {
    if (highlightedElement) {
      // Add highlight class
      highlightedElement.classList.add('tutorial-highlight');
      
      return () => {
        highlightedElement.classList.remove('tutorial-highlight');
      };
    }
  }, [highlightedElement]);

  if (!isActive || !step) return null;

  const progress = (completedSteps.length / 12) * 100;

  const handleNext = () => {
    nextStep();
  };

  const handleSkip = () => {
    const confirmed = window.confirm('Are you sure you want to skip the tutorial? You can always restart it from Settings.');
    if (confirmed) {
      skipTutorial();
    }
  };

  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const rect = highlightedElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    let top = '';
    let left = '';
    let transform = '';

    switch (step.position) {
      case 'top':
        top = `${rect.top - 180}px`;
        left = `${rect.left + rect.width / 2}px`;
        transform = 'translate(-50%, 0)';
        break;
      case 'bottom':
        top = `${rect.bottom + 20}px`;
        left = `${rect.left + rect.width / 2}px`;
        transform = 'translate(-50%, 0)';
        break;
      case 'left':
        top = `${rect.top + rect.height / 2}px`;
        left = `${rect.left - 320}px`;
        transform = 'translate(0, -50%)';
        break;
      case 'right':
        top = `${rect.top + rect.height / 2}px`;
        left = `${rect.right + 20}px`;
        transform = 'translate(0, -50%)';
        break;
      default:
        top = '50%';
        left = '50%';
        transform = 'translate(-50%, -50%)';
    }

    // Ensure tooltip stays within viewport
    const maxTop = windowHeight - 200;
    const maxLeft = windowWidth - 340;
    
    if (parseInt(top) > maxTop) top = `${maxTop}px`;
    if (parseInt(left) > maxLeft) left = `${maxLeft}px`;
    if (parseInt(left) < 20) left = '20px';

    return { top, left, transform };
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[9998] pointer-events-auto" />
      
      {/* Highlighted Element Spotlight */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(var(--primary), 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Tutorial Card */}
      <Card 
        className="fixed z-[10000] w-[90vw] max-w-md shadow-2xl border-2 border-primary/50 animate-in fade-in zoom-in duration-300"
        style={getTooltipPosition()}
      >
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  Step {currentStep} of 12
                </span>
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-2"
              onClick={handleSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed">
            {step.description}
          </CardDescription>
          
          {step.action === 'wait' && (
            <Button 
              className="w-full gap-2" 
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {step.action !== 'wait' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSkip}
              >
                Skip Tutorial
              </Button>
              {step.action !== 'click' && step.action !== 'navigate' && (
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleNext}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSS for highlight effect */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 9999 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </>
  );
};
