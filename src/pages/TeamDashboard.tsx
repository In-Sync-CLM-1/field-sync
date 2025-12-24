import { useTeamStats } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function TeamDashboard() {
  const { data: teamStats } = useTeamStats();

  if (!teamStats) {
    return (
      <div className="p-4 space-y-3">
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Team Overview</h1>
        <p className="text-xs text-muted-foreground">Team performance & activity</p>
      </div>

      {/* Show permission error if no access */}
      {!teamStats && (
        <Card>
          <CardContent className="py-4">
            <p className="text-center text-sm text-muted-foreground">
              No team data available. Managers and admins only.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show stats if user has access */}
      {teamStats && (
        <>
          {/* Team Stats Grid - Compact 2x2 on mobile */}
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Visits Today"
              value={teamStats.totalVisitsToday}
              icon={MapPin}
              subtitle="Team total"
            />
            <MetricCard
              title="Active Agents"
              value={teamStats.activeAgents}
              icon={Users}
              subtitle="Working"
            />
            <MetricCard
              title="Completion"
              value={`${teamStats.completionRate}%`}
              icon={CheckCircle}
              subtitle="All time"
            />
            <MetricCard
              title="Last 30 Days"
              value={teamStats.visitsLast30Days}
              icon={TrendingUp}
              subtitle="Total"
            />
          </div>

          {/* Agent Activity - Compact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                {teamStats.agentActivity.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-[10px] font-semibold text-primary">
                          {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(agent.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
                        {agent.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{agent.visitsToday}</p>
                        <p className="text-[10px] text-muted-foreground">today</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}