import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'insync_app_tour_completed';
const TOUR_PROGRESS_KEY = 'insync_app_tour_progress';

export interface TourStep {
  id: string;
  page: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  requiresSidebar?: boolean;
}

export const tourSteps: TourStep[] = [
  // Dashboard steps
  {
    id: 'dashboard-setup',
    page: '/dashboard',
    target: '[data-tour="setup-checklist"]',
    title: '🚀 Your Getting Started Guide',
    description: 'Complete these tasks to set up your workspace — add team members and prospects to get rolling!',
    position: 'bottom',
  },
  {
    id: 'dashboard-metrics',
    page: '/dashboard',
    target: '[data-tour="metrics"]',
    title: '📊 Your Performance at a Glance',
    description: 'Track your daily visits, prospects, and follow-ups. Click any card to see details!',
    position: 'bottom',
  },
  {
    id: 'dashboard-quick-actions',
    page: '/dashboard',
    target: '[data-tour="quick-actions"]',
    title: '⚡ Quick Actions',
    description: 'Start visits, plan your day, and access key features. The primary action changes based on time of day!',
    position: 'bottom',
  },
  {
    id: 'dashboard-recent',
    page: '/dashboard',
    target: '[data-tour="recent-visits"]',
    title: '📋 Recent Activity',
    description: 'See your scheduled visits and recent activity. Filter by today, week, or status.',
    position: 'top',
  },
  {
    id: 'sidebar-nav',
    page: '/dashboard',
    target: '[data-tour="sidebar"]',
    title: '🧭 Navigation Menu',
    description: 'Access Daily Planning, Team Management, Analytics, and more from the sidebar.',
    position: 'right',
    requiresSidebar: true,
  },
  // Users page step
  {
    id: 'users-page',
    page: '/dashboard/users',
    target: '[data-tour="add-user-button"]',
    title: '🚀 Build Your Dream Team!',
    description: 'This is where the magic begins! Tap this button to add your first 3 rockstar team members and supercharge your sales force.',
    position: 'bottom',
  },
  // Daily Planning steps
  {
    id: 'planning-date',
    page: '/dashboard/planning',
    target: '[data-tour="planning-date"]',
    title: '📅 Select Your Planning Date',
    description: 'Choose a date to view or create your daily plan. Plans are saved automatically!',
    position: 'bottom',
  },
  {
    id: 'planning-targets',
    page: '/dashboard/planning',
    target: '[data-tour="planning-targets"]',
    title: '🎯 Set Daily Targets',
    description: 'Enter your targets for prospects, quotes, and policies. Track your progress throughout the day!',
    position: 'bottom',
  },
  {
    id: 'planning-incentive',
    page: '/dashboard/planning',
    target: '[data-tour="planning-incentive"]',
    title: '💰 Monthly Incentive Tracker',
    description: 'Set your monthly goal and track earnings. Hit milestones at 7, 15, and 25 policies!',
    position: 'top',
  },
  // Prospects steps
  {
    id: 'prospects-header',
    page: '/dashboard/leads',
    target: '[data-tour="prospects-header"]',
    title: '👥 Manage Your Prospects',
    description: 'View all your prospects here. Use the Add Lead button to create new ones!',
    position: 'bottom',
  },
  {
    id: 'prospects-search',
    page: '/dashboard/leads',
    target: '[data-tour="prospects-search"]',
    title: '🔍 Quick Search',
    description: 'Search by name, proposal number, customer ID, or location to find prospects instantly.',
    position: 'bottom',
  },
  {
    id: 'prospects-list',
    page: '/dashboard/leads',
    target: '[data-tour="prospects-list"]',
    title: '📝 Prospect Cards',
    description: 'Click any prospect to view details, log visits, and track their journey to policy issuance.',
    position: 'top',
  },
];

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | undefined;
  steps: TourStep[];
  hasCompletedTour: boolean;
  isNavigating: boolean;
  pageInfo: { pageName: string; pageIndex: number };
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  getCurrentPageSteps: () => TourStep[];
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(
    () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  );
  const [isNavigating, setIsNavigating] = useState(false);

  // Restore progress if tour was interrupted
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    const savedProgress = localStorage.getItem(TOUR_PROGRESS_KEY);
    if (savedProgress && completed !== 'true') {
      const progress = JSON.parse(savedProgress);
      if (progress.isActive) {
        setCurrentStep(progress.step);
        setIsActive(true);
      }
    }

    // Auto-start tour after onboarding
    const autoStart = localStorage.getItem('insync_start_tour_after_onboarding');
    if (autoStart === 'true') {
      localStorage.removeItem('insync_start_tour_after_onboarding');
      setTimeout(() => {
        setCurrentStep(0);
        setIsActive(true);
      }, 500);
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (isActive) {
      localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify({
        isActive,
        step: currentStep,
      }));
    }
  }, [isActive, currentStep]);

  // Handle navigation — poll for target element instead of fixed timeout
  useEffect(() => {
    if (!isActive || !isNavigating) return;

    const currentStepData = tourSteps[currentStep];
    if (!currentStepData || location.pathname !== currentStepData.page) return;

    // Poll for the target element (every 100ms, max 3s)
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      const target = document.querySelector(currentStepData.target);
      if (target || elapsed >= 3000) {
        clearInterval(interval);
        setIsNavigating(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [location.pathname, isActive, currentStep, isNavigating]);

  const getCurrentPageSteps = useCallback(() => {
    return tourSteps.filter(step => step.page === location.pathname);
  }, [location.pathname]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setIsNavigating(false);
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [location.pathname, navigate]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedTour(true);
    setIsNavigating(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    localStorage.removeItem(TOUR_PROGRESS_KEY);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStep + 1];
      const current = tourSteps[currentStep];

      if (nextStepData.page !== current.page) {
        setIsNavigating(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
        navigate(nextStepData.page);
      }

      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, navigate, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepData = tourSteps[currentStep - 1];
      const current = tourSteps[currentStep];

      if (prevStepData.page !== current.page) {
        setIsNavigating(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
        navigate(prevStepData.page);
      }

      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigate]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_PROGRESS_KEY);
    setHasCompletedTour(false);
  }, []);

  const getPageInfo = useCallback(() => {
    const step = tourSteps[currentStep];
    if (!step) return { pageName: '', pageIndex: 0 };

    if (step.page === '/dashboard') return { pageName: 'Dashboard', pageIndex: 0 };
    if (step.page === '/dashboard/users') return { pageName: 'Users', pageIndex: 1 };
    if (step.page === '/dashboard/planning') return { pageName: 'Daily Planning', pageIndex: 2 };
    if (step.page === '/dashboard/leads') return { pageName: 'Prospects', pageIndex: 3 };
    return { pageName: '', pageIndex: 0 };
  }, [currentStep]);

  const value: TourContextValue = {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    currentStepData: tourSteps[currentStep],
    steps: tourSteps,
    hasCompletedTour,
    isNavigating,
    pageInfo: getPageInfo(),
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
    getCurrentPageSteps,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return ctx;
}
