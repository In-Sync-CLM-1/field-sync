import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'primary' | 'info' | 'warning' | 'accent' | 'success' | 'destructive';
type StatusColor = 'success' | 'warning' | 'danger' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  accentColor?: AccentColor;
  // New enhanced props
  progress?: number;
  primaryText?: string;
  secondaryText?: string;
  status?: StatusColor;
  onClick?: () => void;
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

const statusBorderStyles: Record<StatusColor, string> = {
  success: 'ring-2 ring-success/30 border-success/50',
  warning: 'ring-2 ring-warning/30 border-warning/50',
  danger: 'ring-2 ring-destructive/30 border-destructive/50',
  neutral: '',
};

const statusProgressStyles: Record<StatusColor, string> = {
  success: '[&>div]:bg-success',
  warning: '[&>div]:bg-warning',
  danger: '[&>div]:bg-destructive',
  neutral: '[&>div]:bg-primary',
};

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  subtitle, 
  accentColor = 'primary',
  progress,
  primaryText,
  secondaryText,
  status = 'neutral',
  onClick,
}: MetricCardProps) {
  const styles = accentStyles[accentColor];
  const statusBorder = statusBorderStyles[status];
  const progressStyle = statusProgressStyles[status];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        "p-3 relative overflow-hidden group animate-fade-in card-hover",
        styles.card,
        statusBorder,
        onClick && "cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        {Icon && (
          <div className={cn("icon-circle h-8 w-8 transition-transform duration-200 group-hover:scale-110", styles.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {/* Primary display - either value or primaryText */}
      <div className={cn("text-2xl font-bold animate-count-up", styles.value)}>
        {primaryText || value}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-2">
          <Progress 
            value={Math.min(progress, 100)} 
            className={cn("h-1.5 bg-muted/50", progressStyle)} 
          />
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {Math.round(progress)}% complete
          </span>
        </div>
      )}

      {/* Trend with change text */}
      {change && (
        <p className={cn(
          "text-xs mt-1 font-medium flex items-center gap-1",
          trend === 'up' ? 'text-success' :
          trend === 'down' ? 'text-destructive' :
          'text-muted-foreground'
        )}>
          {trend && <TrendIcon className="h-3 w-3" />}
          {change}
        </p>
      )}

      {/* Secondary text */}
      {secondaryText && (
        <p className="text-xs text-muted-foreground mt-0.5">{secondaryText}</p>
      )}

      {/* Subtitle (legacy support) */}
      {subtitle && !secondaryText && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}

      {/* Clickable indicator */}
      {onClick && (
        <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground">Click for details →</span>
        </div>
      )}
    </Card>
  );
}
