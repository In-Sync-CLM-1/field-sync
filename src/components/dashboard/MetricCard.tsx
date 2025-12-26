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
      {/* Gaming accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-neon-pink to-accent" />
      
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className="relative">
            <Icon className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold bg-gradient-to-r from-primary to-neon-pink bg-clip-text text-transparent animate-count-up">
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