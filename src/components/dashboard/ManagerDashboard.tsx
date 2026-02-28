import { useState } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { usePerformanceData } from '@/hooks/useDashboardData';
import { DashboardViewControl, DashboardPeriod } from './DashboardViewControl';
import { StatusKPICard } from './StatusKPICard';
import { PipelineCard } from './PipelineCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, MapPin, Clock, CheckCircle, Target, TrendingUp, ClipboardList, Sparkles, Trophy, Medal, Award, IndianRupee } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function ManagerDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: team, isLoading } = useTeamDashboard(period);
  const selectedMonth = startOfMonth(new Date());
  const { teamPerformance, policyTrend, incentiveToppers, kpis } = useBranchAnalytics(selectedMonth);
  const { data: performanceData } = usePerformanceData();
  const navigate = useNavigate();

  if (isLoading || !team) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const visitStages = [
    { label: 'Completed', count: team.visitStatusBreakdown.completed, color: 'green' as const },
    { label: 'In Progress', count: team.visitStatusBreakdown.inProgress, color: 'amber' as const },
    { label: 'Cancelled', count: team.visitStatusBreakdown.cancelled, color: 'red' as const },
    { label: 'Total', count: team.visitsToday, color: 'blue' as const },
  ];

  const targetItems = [
    { label: 'Prospects', target: team.targetProgress.prospectsTarget, actual: team.targetProgress.prospectsActual },
    { label: 'Quotes', target: team.targetProgress.quotesTarget, actual: team.targetProgress.quotesActual },
    { label: 'Sales', target: team.targetProgress.salesTarget, actual: team.targetProgress.salesActual },
  ];

  const barChartData = teamPerformance.slice(0, 8).map(member => ({
    name: member.name.split(' ')[0],
    Target: member.policiesTarget,
    Actual: member.policiesActual
  }));

  const topPerformers = performanceData?.slice(0, 8) || [];

  const getMilestoneBadge = (policies: number) => {
    if (policies >= 25) return { label: 'Gold', className: 'bg-yellow-500 text-white' };
    if (policies >= 15) return { label: 'Silver', className: 'bg-gray-400 text-white' };
    if (policies >= 7) return { label: 'Bronze', className: 'bg-amber-700 text-white' };
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-3 min-h-screen">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Team</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Team Dashboard</h1>
      </div>

      <DashboardViewControl period={period} onPeriodChange={setPeriod} />

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusKPICard title="Team Visits" value={team.visitsToday} subtitle="Team total" icon={MapPin} accent="primary" />
        <StatusKPICard
          title="Active Agents"
          value={`${team.activeAgents}/${team.totalAgents}`}
          subtitle="Working now"
          icon={Users}
          accent="success"
        />
        <StatusKPICard
          title="Attendance"
          value={`${team.attendanceRate}%`}
          subtitle="Rate"
          icon={Clock}
          accent={team.attendanceRate >= 70 ? 'success' : team.attendanceRate >= 40 ? 'warning' : 'destructive'}
        />
        <StatusKPICard
          title="Plan Completion"
          value={`${team.planCompletion}%`}
          subtitle="Targets"
          icon={CheckCircle}
          accent={team.planCompletion >= 70 ? 'success' : team.planCompletion >= 40 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Visit Pipeline */}
      <PipelineCard title="Visit Status Pipeline" icon={MapPin} stages={visitStages} />

      {/* Target vs Achievement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Target vs Achievement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {targetItems.map((item) => {
            const pct = item.target > 0 ? Math.round((item.actual / item.target) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.actual}/{item.target} ({pct}%)
                  </span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sales Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={policyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => format(new Date(value), 'd MMM')} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy')} formatter={(value: number) => [value, 'Sales']} />
                  <Line type="monotone" dataKey="policies" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sales: Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Target" fill="hsl(var(--muted))" />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {topPerformers.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-2 text-xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {index + 1}
                  </div>
                  <span className="flex-1 truncate font-medium">{agent.name}</span>
                  <span className="font-bold">{agent.totalVisits}</span>
                  <Progress value={agent.completionRate} className="h-1 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Sales Performers */}
      {incentiveToppers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Sales Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center">
              {incentiveToppers.slice(0, 3).map((topper, index) => {
                const icons = [Trophy, Medal, Award];
                const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
                const Icon = icons[index];
                const badge = getMilestoneBadge(topper.policies);

                return (
                  <div key={topper.id} className={cn("flex flex-col items-center p-3 rounded-lg border", index === 0 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-muted")}>
                    <Icon className={cn("h-6 w-6 mb-1", colors[index])} />
                    <p className="text-xs font-semibold text-center">{topper.name}</p>
                    <p className="text-xl font-bold">{topper.policies}</p>
                    <p className="text-[10px] text-muted-foreground">sales</p>
                    <p className="text-sm font-semibold text-green-600">₹{topper.incentive.toLocaleString()}</p>
                    {badge && <Badge className={cn("mt-1 text-[10px]", badge.className)}>{badge.label}</Badge>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Agent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {team.agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No agents assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {team.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-semibold text-primary">
                        {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
                    <p className="text-[10px] text-muted-foreground">visits</p>
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
          <ClipboardList className="h-4 w-4 mr-1" /> Team Plans
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/attendance')}>
          <Clock className="h-4 w-4 mr-1" /> Attendance
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/planning/overview')}>
          <TrendingUp className="h-4 w-4 mr-1" /> Planning
        </Button>
      </div>
    </div>
  );
}
