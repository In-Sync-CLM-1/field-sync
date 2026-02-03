import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'insync_dashboard_tour_completed';

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'metrics',
    target: '[data-tour="metrics"]',
    title: '📊 Your Performance at a Glance',
    description: 'Track your daily visits, prospects, and follow-ups. Click any card to see details!',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    target: '[data-tour="quick-actions"]',
    title: '⚡ Quick Actions',
    description: 'Start visits, plan your day, and access key features instantly. The primary action changes based on time of day!',
    position: 'bottom',
  },
  {
    id: 'recent-visits',
    target: '[data-tour="recent-visits"]',
    title: '📋 Recent Activity',
    description: 'See your scheduled visits and recent activity. Filter by today, this week, or status.',
    position: 'top',
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: '🧭 Navigate Your Workspace',
    description: 'Access Daily Planning, Team Management, Analytics, and more from the sidebar menu.',
    position: 'right',
  },
];

export function useDashboardTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  useEffect(() => {
    // Check if user has completed the tour
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    currentStepData: tourSteps[currentStep],
    steps: tourSteps,
    hasCompletedTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
