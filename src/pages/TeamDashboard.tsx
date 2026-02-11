import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, CheckCircle, MapPin, Clock, Target, ChevronRight, ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export default function TeamDashboard() {
  const { data: team, isLoading } = useTeamDashboard();
  const navigate = useNavigate();

  if (isLoading || !team) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const targetItems = [
    { label: 'Prospects', target: team.targetProgress.prospectsTarget, actual: team.targetProgress.prospectsActual },
    { label: 'Quotes', target: team.targetProgress.quotesTarget, actual: team.targetProgress.quotesActual },
    { label: 'Sales', target: team.targetProgress.salesTarget, actual: team.targetProgress.salesActual },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4 min-h-screen">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Team</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Team Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor your team's daily performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Visits Today" value={team.visitsToday} icon={MapPin} subtitle="Team total" />
        <MetricCard title="Active Agents" value={`${team.activeAgents}/${team.totalAgents}`} icon={Users} subtitle="Working today" />
        <MetricCard title="Attendance" value={`${team.attendanceRate}%`} icon={Clock} subtitle="Today's rate" />
        <MetricCard title="Plan Completion" value={`${team.planCompletion}%`} icon={CheckCircle} subtitle="Today's targets" />
      </div>

      {/* Target Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Target vs Achievement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {targetItems.map(item => {
            const pct = item.target > 0 ? Math.round((item.actual / item.target) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.actual}/{item.target} ({pct}%)</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Agent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Agent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {team.agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No agents assigned to your team yet.</p>
          ) : (
            <div className="space-y-2">
              {team.agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-semibold text-primary">
                        {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{agent.name}</p>
                      <Badge
                        variant={agent.attendanceStatus === 'punched_in' ? 'default' : agent.attendanceStatus === 'punched_out' ? 'secondary' : 'outline'}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {agent.attendanceStatus === 'punched_in' ? 'On Duty' : agent.attendanceStatus === 'punched_out' ? 'Done' : 'Absent'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{agent.visitsToday}</p>
                    <p className="text-[10px] text-muted-foreground">visits today</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/teams')}>
          <ClipboardList className="h-4 w-4 mr-1" />
          Team Plans
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/attendance')}>
          <Clock className="h-4 w-4 mr-1" />
          Attendance
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/planning/overview')}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Planning Overview
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/performance-review')}>
          <ChevronRight className="h-4 w-4 mr-1" />
          Performance
        </Button>
      </div>
    </div>
  );
}
