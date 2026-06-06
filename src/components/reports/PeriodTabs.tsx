import { ReportPeriod } from '@/hooks/useReportData';

const OPTS: { key: ReportPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export function PeriodTabs({ value, onChange }: { value: ReportPeriod; onChange: (p: ReportPeriod) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {OPTS.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === o.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
