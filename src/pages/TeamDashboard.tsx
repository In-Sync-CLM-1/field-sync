import { useTeamStats } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function TeamDashboard() {
  const { data: teamStats } = useTeamStats();

  if (!teamStats) {
    return (
      <div className="container py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
        <p className="text-muted-foreground">Monitor your team's performance and activity</p>
      </div>


      {/* Show permission error if no access */}
      {!teamStats && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No team data available. This dashboard is for managers and admins only.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show stats if user has access */}
      {teamStats && (
        <>
          {/* Team Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          subtitle="Currently working"
        />
        <MetricCard
          title="Completion Rate"
          value={`${teamStats.completionRate}%`}
          icon={CheckCircle}
          subtitle="All time"
        />
        <MetricCard
          title="Last 30 Days"
          value={teamStats.visitsLast30Days}
          icon={TrendingUp}
          subtitle="Total visits"
        />
      </div>

      {/* Agent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Activity</CardTitle>
          <CardDescription>Real-time team member status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamStats.agentActivity.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(agent.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{agent.visitsToday}</p>
                    <p className="text-xs text-muted-foreground">visits today</p>
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