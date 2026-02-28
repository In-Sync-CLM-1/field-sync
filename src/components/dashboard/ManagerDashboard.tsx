import { useState } from 'react';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { useAnalyticsData, usePerformanceData } from '@/hooks/useDashboardData';
import { DashboardViewControl, DashboardPeriod } from './DashboardViewControl';
import { StatusKPICard } from './StatusKPICard';
import { PipelineCard } from './PipelineCard';
import { MetricCard } from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, MapPin, Clock, CheckCircle, Target, TrendingUp, TrendingDown, ClipboardList, Sparkles, Trophy, Medal, Award, IndianRupee, CalendarIcon, FileText, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function ManagerDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: team, isLoading } = useTeamDashboard(period);
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const { teamPerformance, policyTrend, incentiveToppers, kpis } = useBranchAnalytics(selectedMonth);
  const { data: analyticsData } = useAnalyticsData();
  const { data: performanceData } = usePerformanceData();
  const navigate = useNavigate();

  const topPerformers = performanceData || [];

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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const visitsByDayOfWeekData = analyticsData ? analyticsData.visitsByDayOfWeek.map((count, index) => ({
    day: dayNames[index],
    visits: count
  })) : [];

  const getMilestoneBadge = (policies: number) => {
    if (policies >= 25) return { label: 'Gold', className: 'bg-yellow-500 text-white' };
    if (policies >= 15) return { label: 'Silver', className: 'bg-gray-400 text-white' };
    if (policies >= 7) return { label: 'Bronze', className: 'bg-amber-700 text-white' };
    return null;
  };

  const getAchievementColor = (actual: number, target: number) => {
    if (target === 0) return 'text-muted-foreground';
    const pct = (actual / target) * 100;
    if (pct >= 100) return 'text-green-600';
    if (pct >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPct = (actual: number, target: number) => {
    if (target === 0) return '-';
    return `${Math.round((actual / target) * 100)}%`;
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

      {/* Analytics Metrics Row */}
      {analyticsData && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Avg Duration" value={`${analyticsData.avgDuration}m`} icon={Clock} subtitle="Per visit" />
          <MetricCard title="Form Rate" value={`${analyticsData.formCompletionRate}%`} icon={FileText} subtitle="Completion" />
          <MetricCard title="Photo Rate" value={`${analyticsData.photoCompletionRate}%`} icon={Camera} subtitle="Capture rate" />
          <MetricCard title="Total Visits" value={analyticsData.totalVisits} icon={TrendingUp} subtitle="All time" />
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Branch Performance</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <CalendarIcon className="h-3 w-3" />
              {format(selectedMonth, 'MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

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

        {/* Visits by Day of Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visits by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitsByDayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales: Target vs Actual */}
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

      {/* Sales Officer Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sales Officer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Officer</TableHead>
                  <TableHead className="text-xs text-center">Prospects (T/A/%)</TableHead>
                  <TableHead className="text-xs text-center">Quotes (T/A/%)</TableHead>
                  <TableHead className="text-xs text-center">Sales (T/A/%)</TableHead>
                  <TableHead className="text-xs text-right">Incentives</TableHead>
                  <TableHead className="text-xs text-center">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No team members found</TableCell>
                  </TableRow>
                ) : (
                  teamPerformance.map((member) => {
                    const badge = getMilestoneBadge(member.policiesActual);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="text-xs font-medium">{member.name}</TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="text-muted-foreground">{member.prospectsTarget}</span>{' / '}
                          <span className={getAchievementColor(member.prospectsActual, member.prospectsTarget)}>{member.prospectsActual}</span>{' / '}
                          <span className={getAchievementColor(member.prospectsActual, member.prospectsTarget)}>{formatPct(member.prospectsActual, member.prospectsTarget)}</span>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="text-muted-foreground">{member.quotesTarget}</span>{' / '}
                          <span className={getAchievementColor(member.quotesActual, member.quotesTarget)}>{member.quotesActual}</span>{' / '}
                          <span className={getAchievementColor(member.quotesActual, member.quotesTarget)}>{formatPct(member.quotesActual, member.quotesTarget)}</span>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="text-muted-foreground">{member.policiesTarget}</span>{' / '}
                          <span className={getAchievementColor(member.policiesActual, member.policiesTarget)}>{member.policiesActual}</span>{' / '}
                          <span className={getAchievementColor(member.policiesActual, member.policiesTarget)}>{formatPct(member.policiesActual, member.policiesTarget)}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-green-600">₹{member.incentive.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-center">
                          {badge ? <Badge className={badge.className}>{badge.label}</Badge> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard with Complete Rankings */}
      {topPerformers.length >= 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3 mb-4">
              {[1, 0, 2].map((index) => {
                const performer = topPerformers[index];
                const rank = index === 0 ? 1 : index === 1 ? 2 : 3;
                const heights = ['h-28', 'h-32', 'h-24'];
                const trophyColors = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-600';
                const iconList = [Medal, Trophy, Award];
                const PodiumIcon = iconList[index];

                return (
                  <div key={performer.id} className={`${heights[index]} flex flex-col justify-end items-center p-2 rounded-lg border`}>
                    <PodiumIcon className={`h-5 w-5 ${trophyColors} mb-1`} />
                    <div className="text-[10px] font-bold">#{rank}</div>
                    <div className="text-xs font-medium truncate w-full text-center">{performer.name}</div>
                    <div className="text-lg font-bold text-primary">{performer.totalVisits}</div>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {performer.completionRate}%
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Complete Rankings */}
            <div className="space-y-2">
              {topPerformers.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-2 border-b pb-2 last:border-0 last:pb-0">
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
                        <p className="text-sm font-bold">{agent.totalVisits}</p>
                        {index < topPerformers.length - 1 && (
                          agent.totalVisits > topPerformers[index + 1].totalVisits ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )
                        )}
                      </div>
                    </div>
                    <Progress value={agent.completionRate} className="h-1 mt-1" />
                  </div>
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
