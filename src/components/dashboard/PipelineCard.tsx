import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface PipelineStage {
  label: string;
  count: number;
  color: 'blue' | 'amber' | 'green' | 'red' | 'gray';
}

interface PipelineCardProps {
  title: string;
  icon?: LucideIcon;
  stages: PipelineStage[];
}

const colorMap: Record<string, { bg: string; text: string; border: string; subtext: string }> = {
  blue: { bg: 'bg-info', text: 'text-white', border: 'border-info', subtext: 'text-white/80' },
  amber: { bg: 'bg-warning', text: 'text-white', border: 'border-warning', subtext: 'text-white/80' },
  green: { bg: 'bg-success', text: 'text-white', border: 'border-success', subtext: 'text-white/80' },
  red: { bg: 'bg-destructive', text: 'text-white', border: 'border-destructive', subtext: 'text-white/80' },
  gray: { bg: 'bg-muted-foreground', text: 'text-white', border: 'border-muted-foreground', subtext: 'text-white/80' },
};

export function PipelineCard({ title, icon: Icon, stages }: PipelineCardProps) {
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stages.map((stage) => {
            const c = colorMap[stage.color];
            return (
              <div
                key={stage.label}
                className={`rounded-lg border ${c.border} ${c.bg} p-2.5 text-center`}
              >
                <p className={`text-lg font-bold ${c.text}`}>{stage.count}</p>
                <p className={`text-[10px] font-medium ${c.subtext} uppercase tracking-wide mt-0.5`}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
        {total > 0 && (
          <div className="flex mt-2 h-1.5 rounded-full overflow-hidden bg-muted">
            {stages.map((stage) => {
              const pct = total > 0 ? (stage.count / total) * 100 : 0;
              if (pct === 0) return null;
              const bgClass = {
                blue: 'bg-info',
                amber: 'bg-warning',
                green: 'bg-success',
                red: 'bg-destructive',
                gray: 'bg-muted-foreground',
              }[stage.color];
              return (
                <div
                  key={stage.label}
                  className={`${bgClass} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
