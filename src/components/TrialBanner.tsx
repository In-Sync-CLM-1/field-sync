import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import insyncLogo from '@/assets/in-sync-logo.png';

interface TrialBannerProps {
  onUpgrade?: () => void;
}

export function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const { currentOrganization } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if no organization or not on trial
  if (!currentOrganization) return null;
  
  const { subscription_status, trial_ends_at } = currentOrganization;
  
  // Only show for trial or expired status
  if (subscription_status !== 'trial' && subscription_status !== 'expired') return null;
  if (dismissed) return null;

  // Calculate days remaining
  let daysRemaining = 0;
  let isExpired = subscription_status === 'expired';
  
  if (trial_ends_at) {
    const trialEnd = parseISO(trial_ends_at);
    const diffTime = trialEnd.getTime() - new Date().getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;
    isExpired = isExpired || daysRemaining <= 0;
  }

  const isUrgent = daysRemaining <= 3 && !isExpired;

  // Determine banner style based on urgency
  const bannerStyles = isExpired
    ? 'bg-destructive/10 border-destructive/30 text-destructive'
    : isUrgent
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
    : 'bg-primary/5 border-primary/20 text-foreground';

  const iconStyles = isExpired
    ? 'text-destructive'
    : isUrgent
    ? 'text-amber-500'
    : 'text-primary';

  const Icon = isExpired ? AlertTriangle : isUrgent ? Clock : Sparkles;

  return (
    <div className={cn(
      'relative px-4 py-2.5 border-b flex items-center justify-between gap-4',
      bannerStyles
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={cn('h-4 w-4 shrink-0', iconStyles)} />
        <p className="text-sm font-medium truncate">
          {isExpired ? (
            <>Your trial has expired. Upgrade now to continue using <img src={insyncLogo} alt="In-Sync" className="h-4 w-4 inline align-text-bottom" />.</>
          ) : daysRemaining === 0 ? (
            <>Your trial expires today! Upgrade to keep your data.</>
          ) : daysRemaining === 1 ? (
            <>Your trial expires tomorrow. Don't lose your progress!</>
          ) : (
            <><span className="font-semibold">{daysRemaining} days</span> left in your free trial</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant={isExpired || isUrgent ? 'default' : 'outline'}
          onClick={onUpgrade}
          className={cn(
            'h-7 text-xs',
            isExpired && 'bg-destructive hover:bg-destructive/90',
            isUrgent && !isExpired && 'bg-amber-500 hover:bg-amber-600 text-white border-0'
          )}
        >
          <CreditCard className="h-3 w-3 mr-1.5" />
          {isExpired ? 'Upgrade Now' : 'Upgrade'}
        </Button>
        
        {!isExpired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0 hover:bg-background/50"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );
}
