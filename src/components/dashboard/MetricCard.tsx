import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'primary' | 'info' | 'warning' | 'accent' | 'success' | 'destructive';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  accentColor?: AccentColor;
}

const accentStyles: Record<AccentColor, { card: string; icon: string; value: string }> = {
  primary: {
    card: 'metric-card-primary',
    icon: 'icon-circle-primary',
    value: 'text-primary',
  },
  info: {
    card: 'metric-card-info',
    icon: 'icon-circle-info',
    value: 'text-info',
  },
  warning: {
    card: 'metric-card-warning',
    icon: 'icon-circle-warning',
    value: 'text-warning',
  },
  accent: {
    card: 'metric-card-accent',
    icon: 'icon-circle-accent',
    value: 'text-accent',
  },
  success: {
    card: 'metric-card-primary',
    icon: 'icon-circle-success',
    value: 'text-success',
  },
  destructive: {
    card: 'metric-card-primary',
    icon: 'icon-circle-destructive',
    value: 'text-destructive',
  },
};

export function MetricCard({ title, value, change, icon: Icon, trend, subtitle, accentColor = 'primary' }: MetricCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <Card className={cn("p-3 relative overflow-hidden group animate-fade-in card-hover", styles.card)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        {Icon && (
          <div className={cn("icon-circle h-8 w-8 transition-transform duration-200 group-hover:scale-110", styles.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold animate-count-up", styles.value)}>
        {value}
      </div>
      {change && (
        <p className={cn(
          "text-xs mt-1 font-medium",
          trend === 'up' ? 'text-success' :
          trend === 'down' ? 'text-destructive' :
          'text-muted-foreground'
        )}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {change}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </Card>
  );
}