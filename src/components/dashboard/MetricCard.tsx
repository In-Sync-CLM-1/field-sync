import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export function MetricCard({ title, value, change, icon: Icon, trend, subtitle }: MetricCardProps) {
  return (
    <Card className="p-3 relative overflow-hidden group animate-fade-in">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
      
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className="relative">
            <Icon className="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:scale-110" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-primary animate-count-up">
        {value}
      </div>
      {change && (
        <p className={cn(
          "text-[10px]",
          trend === 'up' ? 'text-accent' :
          trend === 'down' ? 'text-destructive' :
          'text-muted-foreground'
        )}>
          {change}
        </p>
      )}
      {subtitle && (
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </Card>
  );
}