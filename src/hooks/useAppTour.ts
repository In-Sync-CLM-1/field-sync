import { useState, useEffect, useCallback } from 'react';
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
}

const tourSteps: TourStep[] = [
  // Dashboard steps
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

export function useAppTour() {
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
      // Small delay to let Dashboard render
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

  // Handle navigation between pages
  useEffect(() => {
    if (!isActive || !isNavigating) return;
    
    const currentStepData = tourSteps[currentStep];
    if (currentStepData && location.pathname === currentStepData.page) {
      setIsNavigating(false);
    }
  }, [location.pathname, isActive, currentStep, isNavigating]);

  const getCurrentPageSteps = useCallback(() => {
    return tourSteps.filter(step => step.page === location.pathname);
  }, [location.pathname]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setIsNavigating(false);
    // Navigate to dashboard if not already there
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [location.pathname, navigate]);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStep + 1];
      const currentStepData = tourSteps[currentStep];
      
      // Check if we need to navigate to a different page
      if (nextStepData.page !== currentStepData.page) {
        setIsNavigating(true);
        navigate(nextStepData.page);
      }
      
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, navigate]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepData = tourSteps[currentStep - 1];
      const currentStepData = tourSteps[currentStep];
      
      // Check if we need to navigate to a different page
      if (prevStepData.page !== currentStepData.page) {
        setIsNavigating(true);
        navigate(prevStepData.page);
      }
      
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigate]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedTour(true);
    setIsNavigating(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    localStorage.removeItem(TOUR_PROGRESS_KEY);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_PROGRESS_KEY);
    setHasCompletedTour(false);
  }, []);

  // Get page-specific info for progress display
  const getPageInfo = useCallback(() => {
    const pages = ['Dashboard', 'Daily Planning', 'Prospects'];
    const currentStepData = tourSteps[currentStep];
    if (!currentStepData) return { pageName: '', pageIndex: 0 };
    
    if (currentStepData.page === '/dashboard') return { pageName: 'Dashboard', pageIndex: 0 };
    if (currentStepData.page === '/dashboard/planning') return { pageName: 'Daily Planning', pageIndex: 1 };
    if (currentStepData.page === '/dashboard/leads') return { pageName: 'Prospects', pageIndex: 2 };
    return { pageName: '', pageIndex: 0 };
  }, [currentStep]);

  return {
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
}
