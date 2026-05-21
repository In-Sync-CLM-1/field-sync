import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'primary' | 'success' | 'warning' | 'destructive' | 'info';

interface StatusKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeTrend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  accent?: AccentColor;
  onClick?: () => void;
}

const accentStyles: Record<AccentColor, { border: string; iconBg: string; iconColor: string }> = {
  primary: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  success: { border: 'border-l-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
  warning: { border: 'border-l-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
  destructive: { border: 'border-l-destructive', iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
  info: { border: 'border-l-info', iconBg: 'bg-info/10', iconColor: 'text-info' },
};

export function StatusKPICard({
  title,
  value,
  subtitle,
  badge,
  badgeTrend,
  icon: Icon,
  accent = 'primary',
  onClick,
}: StatusKPICardProps) {
  const styles = accentStyles[accent];

  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${styles.border} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-0.5 leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
          {badge && (
            <Badge
              variant="secondary"
              className={`mt-1.5 text-[10px] h-4 px-1.5 ${
                badgeTrend === 'up'
                  ? 'bg-success/15 text-success border-success/20'
                  : badgeTrend === 'down'
                  ? 'bg-destructive/15 text-destructive border-destructive/20'
                  : ''
              }`}
            >
              {badgeTrend === 'up' ? '↑ ' : badgeTrend === 'down' ? '↓ ' : ''}
              {badge}
            </Badge>
          )}
        </div>
        <div className={`flex-shrink-0 p-2 rounded-lg ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
