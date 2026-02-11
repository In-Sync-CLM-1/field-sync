import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-slate-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
  { value: 'quote_given', label: 'Quote Given', color: 'bg-amber-500' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
] as const;

export type LeadStatusValue = typeof LEAD_STATUSES[number]['value'];

export function getStatusLabel(status: string): string {
  return LEAD_STATUSES.find(s => s.value === status)?.label || status;
}

export function getStatusColor(status: string): string {
  return LEAD_STATUSES.find(s => s.value === status)?.color || 'bg-muted';
}

interface LeadStatusPipelineProps {
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  readonly?: boolean;
}

export function LeadStatusPipeline({ currentStatus, onStatusChange, readonly }: LeadStatusPipelineProps) {
  const currentIndex = LEAD_STATUSES.findIndex(s => s.value === currentStatus);
  // For pipeline display, exclude 'lost' from the linear flow
  const pipelineStatuses = LEAD_STATUSES.filter(s => s.value !== 'lost');
  const isLost = currentStatus === 'lost';

  return (
    <div className="space-y-3">
      {/* Pipeline steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {pipelineStatuses.map((status, index) => {
          const isPast = !isLost && currentIndex > index;
          const isCurrent = status.value === currentStatus;
          const isClickable = !readonly && onStatusChange;

          return (
            <button
              key={status.value}
              onClick={() => isClickable && onStatusChange(status.value)}
              disabled={readonly || !onStatusChange}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all',
                isCurrent && `${status.color} text-white shadow-sm`,
                isPast && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                !isCurrent && !isPast && 'bg-muted text-muted-foreground',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default',
              )}
            >
              {isPast && <Check className="h-3 w-3" />}
              {status.label}
            </button>
          );
        })}
      </div>

      {/* Lost button - separate */}
      {!readonly && onStatusChange && (
        <button
          onClick={() => onStatusChange('lost')}
          className={cn(
            'px-2 py-1 rounded-full text-[10px] font-medium transition-all',
            isLost
              ? 'bg-red-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400',
          )}
        >
          Mark as Lost
        </button>
      )}
    </div>
  );
}
