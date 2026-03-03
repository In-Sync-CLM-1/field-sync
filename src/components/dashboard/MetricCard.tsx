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
  progress?: number;
  primaryText?: string;
  secondaryText?: string;
  status?: StatusColor;
  onClick?: () => void;
}

// Color styles with border accent colors
const accentStyles: Record<AccentColor, { icon: string; iconBg: string; borderColor: string; gradientColor: string }> = {
  primary: {
    icon: 'text-primary',
    iconBg: 'bg-primary/10',
    borderColor: 'border-l-primary',
    gradientColor: 'from-primary/8',
  },
  info: {
    icon: 'text-info-foreground',
    iconBg: 'bg-info/20',
    borderColor: 'border-l-info',
    gradientColor: 'from-info/8',
  },
  warning: {
    icon: 'text-warning-foreground',
    iconBg: 'bg-warning/20',
    borderColor: 'border-l-warning',
    gradientColor: 'from-warning/8',
  },
  accent: {
    icon: 'text-accent-foreground',
    iconBg: 'bg-accent/20',
    borderColor: 'border-l-accent',
    gradientColor: 'from-accent/8',
  },
  success: {
    icon: 'text-success',
    iconBg: 'bg-success/10',
    borderColor: 'border-l-success',
    gradientColor: 'from-success/8',
  },
  destructive: {
    icon: 'text-destructive',
    iconBg: 'bg-destructive/10',
    borderColor: 'border-l-destructive',
    gradientColor: 'from-destructive/8',
  },
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
  const progressStyle = statusProgressStyles[status];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 bg-card border border-border border-l-3 shadow-md min-h-[100px] flex flex-col transition-all duration-200",
        styles.borderColor,
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      {/* Top gradient strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r to-transparent", styles.gradientColor)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        {Icon && (
          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", styles.iconBg)}>
            <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-lg font-bold text-foreground leading-tight">
          {primaryText || value}
        </div>

        {progress !== undefined && (
          <div className="mt-1">
            <Progress 
              value={Math.min(progress, 100)} 
              className={cn("h-1 bg-muted", progressStyle)} 
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {Math.round(progress)}% complete
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-1">
        {change && (
          <p className={cn(
            "text-xs font-medium flex items-center gap-1",
            trend === 'up' ? 'text-success' :
            trend === 'down' ? 'text-destructive' :
            'text-muted-foreground'
          )}>
            {trend && <TrendIcon className="h-3 w-3" />}
            {change}
          </p>
        )}

        {secondaryText && (
          <p className="text-xs text-muted-foreground leading-tight">{secondaryText}</p>
        )}

        {subtitle && !secondaryText && (
          <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
