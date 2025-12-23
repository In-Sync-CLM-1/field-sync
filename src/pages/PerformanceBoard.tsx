import { usePerformanceData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function PerformanceBoard() {
  const { data: performanceData } = usePerformanceData();

  if (!performanceData) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const topPerformers = performanceData.slice(0, 10);

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Board</h1>
        <p className="text-muted-foreground">Leaderboard and performance rankings</p>
      </div>

      {/* Top 3 Podium */}
      {topPerformers.length >= 3 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 0, 2].map((index) => {
            const performer = topPerformers[index];
            const rank = index === 0 ? 1 : index === 1 ? 2 : 3;
            const heights = ['md:h-64', 'md:h-72', 'md:h-56'];
            const variants = ['secondary', 'default', 'secondary'] as const;

            return (
              <Card key={performer.id} className={`${heights[index]} flex flex-col justify-end`}>
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto mb-2">
                    <Trophy className={`h-8 w-8 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                  </div>
                  <CardTitle className="text-lg">#{rank}</CardTitle>
                  <CardDescription className="font-semibold text-foreground">
                    {performer.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold">{performer.totalVisits}</div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <Badge variant={variants[index]}>
                    {performer.completionRate.toFixed(0)}% completion
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
          <CardDescription>All team members sorted by performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.completedVisits} completed • {agent.visitsThisMonth} this month
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">{agent.totalVisits}</p>
                        <p className="text-xs text-muted-foreground">visits</p>
                      </div>
                      {index < performanceData.length - 1 && (
                        agent.totalVisits > performanceData[index + 1].totalVisits ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Completion Rate</span>
                      <span className="font-medium">{agent.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={agent.completionRate} />
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
