import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VisitsTimePoint } from '@/hooks/usePlatformDashboard';

interface Props {
  data: VisitsTimePoint[];
}

export function PlatformVisitsChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Visits — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[3px] h-[200px]">
          {data.map((point, i) => {
            const height = Math.max((point.count / max) * 100, 2);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                <div
                  className="w-full rounded-t-sm bg-indigo-500 hover:bg-indigo-600 transition-colors min-h-[2px]"
                  style={{ height: `${height}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {point.date}: {point.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}
