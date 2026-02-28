import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export type DashboardPeriod = 'today' | 'week' | 'month';

interface DashboardViewControlProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

export function DashboardViewControl({ period, onPeriodChange }: DashboardViewControlProps) {
  const now = new Date();

  const periodLabel = (() => {
    switch (period) {
      case 'today':
        return format(now, 'EEEE, dd MMM yyyy');
      case 'week':
        return `${format(startOfWeek(now), 'dd MMM')} – ${format(endOfWeek(now), 'dd MMM yyyy')}`;
      case 'month':
        return format(now, 'MMMM yyyy');
    }
  })();

  const options: { value: DashboardPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-xs text-muted-foreground font-medium">{periodLabel}</p>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none px-3 text-xs font-medium transition-colors ${
              period === opt.value
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onPeriodChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
