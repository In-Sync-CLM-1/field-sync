import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { useAppTour } from '@/hooks/useAppTour';

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

function computePosition(target: Element, preferredPosition: string): TooltipPosition {
  const rect = target.getBoundingClientRect();
  const tooltipWidth = 340;
  const tooltipHeight = 220;
  const padding = 16;
  const arrowOffset = 12;

  let top = 0;
  let left = 0;
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  switch (preferredPosition) {
    case 'bottom':
      top = rect.bottom + arrowOffset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowPosition = 'top';
      break;
    case 'top':
      top = rect.top - tooltipHeight - arrowOffset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      arrowPosition = 'bottom';
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + arrowOffset;
      arrowPosition = 'left';
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - arrowOffset;
      arrowPosition = 'right';
      break;
  }

  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

  return { top, left, arrowPosition };
}

export function AppTour() {
  const {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    isNavigating,
    pageInfo,
    nextStep,
    prevStep,
    skipTour,
  } = useAppTour();

  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const updatePositionForTarget = useCallback((target: Element) => {
    if (!currentStepData) return;
    requestAnimationFrame(() => {
      setPosition(computePosition(target, currentStepData.position));
      setTargetFound(true);
      // Highlight
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
      target.classList.add('tour-highlight');
    });
  }, [currentStepData]);

  // MutationObserver-based positioning
  useEffect(() => {
    if (!isActive || !currentStepData || isNavigating) {
      setPosition(null);
      setTargetFound(false);
      return;
    }

    // Cleanup previous observers
    observerRef.current?.disconnect();
    resizeObserverRef.current?.disconnect();

    const selector = currentStepData.target;

    // Try to find immediately
    const existing = document.querySelector(selector);
    if (existing) {
      updatePositionForTarget(existing);
      // Watch for resize
      resizeObserverRef.current = new ResizeObserver(() => {
        const el = document.querySelector(selector);
        if (el) updatePositionForTarget(el);
      });
      resizeObserverRef.current.observe(existing);
    } else {
      setTargetFound(false);
    }

    // MutationObserver to detect when element appears or changes
    const mo = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        updatePositionForTarget(el);
        // Start watching resize once found
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = new ResizeObserver(() => {
          const t = document.querySelector(selector);
          if (t) updatePositionForTarget(t);
        });
        resizeObserverRef.current.observe(el);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    observerRef.current = mo;

    // Fallback timeout — 3s max wait
    const fallbackTimer = setTimeout(() => {
      if (!document.querySelector(selector)) {
        setTargetFound(false);
      }
    }, 3000);

    // Reposition on scroll/resize
    const handleReposition = () => {
      const el = document.querySelector(selector);
      if (el) updatePositionForTarget(el);
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition);

    return () => {
      clearTimeout(fallbackTimer);
      mo.disconnect();
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    };
  }, [isActive, currentStep, currentStepData, isNavigating, updatePositionForTarget]);

  // Navigating state
  if (isActive && isNavigating) {
    return createPortal(
      <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <Card className="shadow-xl border-primary/20">
          <CardContent className="py-8 px-12 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Navigating to next section...</p>
          </CardContent>
        </Card>
      </div>,
      document.body
    );
  }

  if (!isActive || !currentStepData || !position || !targetFound) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={skipTour}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[100] w-[340px] animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ top: position.top, left: position.left, willChange: 'transform' }}
      >
        <Card className="shadow-2xl border-primary/30 overflow-hidden">
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-card border-primary/30 transform rotate-45 ${
              position.arrowPosition === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t' :
              position.arrowPosition === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b' :
              position.arrowPosition === 'left' ? 'top-1/2 -left-1.5 -translate-y-1/2 border-l border-b' :
              'top-1/2 -right-1.5 -translate-y-1/2 border-r border-t'
            }`}
          />

          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs mb-1">
                  {pageInfo.pageName}
                </Badge>
                <h3 className="text-base font-semibold text-foreground">
                  {currentStepData.title}
                </h3>
              </div>
              <button
                onClick={skipTour}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-center gap-1 pt-1">
                {['Dashboard', 'Users', 'Planning', 'Prospects'].map((page, idx) => (
                  <div
                    key={page}
                    className={`h-1 rounded-full transition-all ${
                      idx === pageInfo.pageIndex
                        ? 'w-6 bg-primary'
                        : idx < pageInfo.pageIndex
                          ? 'w-2 bg-primary/50'
                          : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Finish Tour
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>,
    document.body
  );
}

// Tour trigger button for restarting the tour
export function TourTriggerButton() {
  const { hasCompletedTour, startTour } = useAppTour();

  if (!hasCompletedTour) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTour}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Lightbulb className="h-4 w-4" />
      <span className="hidden sm:inline">Take Tour</span>
    </Button>
  );
}
