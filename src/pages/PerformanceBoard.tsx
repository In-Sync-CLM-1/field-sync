import { usePerformanceData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function PerformanceBoard() {
  const { data: performanceData } = usePerformanceData();

  if (!performanceData) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-48" />
      </div>
    );
  }

  const topPerformers = performanceData.slice(0, 10);

  return (
    <div className="p-4 space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Performance Board</h1>
        <p className="text-xs text-muted-foreground">Leaderboard and rankings</p>
      </div>

      {/* Top 3 Podium - Compact */}
      {topPerformers.length >= 3 && (
        <div className="grid gap-2 grid-cols-3">
          {[1, 0, 2].map((index) => {
            const performer = topPerformers[index];
            const rank = index === 0 ? 1 : index === 1 ? 2 : 3;
            const heights = ['h-28', 'h-32', 'h-24'];

            return (
              <Card key={performer.id} className={`${heights[index]} flex flex-col justify-end`}>
                <CardContent className="p-2 text-center">
                  <Trophy className={`h-5 w-5 mx-auto mb-1 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                  <div className="text-xs font-bold">#{rank}</div>
                  <div className="text-xs font-medium truncate">{performer.name}</div>
                  <div className="text-lg font-bold">{performer.totalVisits}</div>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {performer.completionRate.toFixed(0)}%
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-2">
            {performanceData.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {agent.completedVisits} done • {agent.visitsThisMonth} this month
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold">{agent.totalVisits}</p>
                      </div>
                      {index < performanceData.length - 1 && (
                        agent.totalVisits > performanceData[index + 1].totalVisits ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <Progress value={agent.completionRate} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
