import { Phone, MessageSquare, MapPin, FileText, ArrowRightLeft, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { LeadActivity } from '@/hooks/useLeadActivities';
import { getStatusLabel } from '@/components/LeadStatusPipeline';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  whatsapp: MessageSquare,
  visit: MapPin,
  note: FileText,
  status_change: ArrowRightLeft,
  follow_up: CalendarClock,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  whatsapp: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  visit: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  status_change: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  follow_up: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

interface LeadActivityTimelineProps {
  activities: LeadActivity[];
  isLoading?: boolean;
}

export function LeadActivityTimeline({ activities, isLoading }: LeadActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity recorded yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activity_type] || FileText;
        const colorClass = activityColors[activity.activity_type] || activityColors.note;
        const metadata = activity.metadata as Record<string, string> | null;

        let displayText = activity.description;
        if (activity.activity_type === 'status_change' && metadata) {
          displayText = `Status changed from "${getStatusLabel(metadata.old_status || '')}" to "${getStatusLabel(metadata.new_status || '')}"`;
          if (activity.description) displayText += ` — ${activity.description}`;
        }

        return (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{displayText || activity.activity_type}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{activity.user_name}</span>
                <span>·</span>
                <span>{format(new Date(activity.created_at), 'dd MMM, HH:mm')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
