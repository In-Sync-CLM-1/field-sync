import { useState } from 'react';
import { useBranchDashboard } from '@/hooks/useBranchDashboard';
import { useAnalyticsData, usePerformanceData } from '@/hooks/useDashboardData';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { DashboardViewControl, DashboardPeriod } from './DashboardViewControl';
import { StatusKPICard } from './StatusKPICard';
import { PipelineCard } from './PipelineCard';
import { Building2, Users, Clock, TrendingUp, MapPin, Target, IndianRupee, Trophy, Medal, Award, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { startOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function HQDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: dashboard, isLoading } = useBranchDashboard(period);
  const { data: analyticsData } = useAnalyticsData();
  const { data: performanceData } = usePerformanceData();
  const selectedMonth = startOfMonth(new Date());
  const { teamPerformance, policyTrend, incentiveToppers, kpis, isLoading: branchLoading } = useBranchAnalytics(selectedMonth);
  const navigate = useNavigate();

  if (isLoading || !dashboard) {
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

  // Branch pipeline stages
  const branchStages = [
    { label: 'Branches', count: dashboard.branches.length, color: 'blue' as const },
    { label: 'Active Agents', count: dashboard.totalActiveAgents, color: 'green' as const },
    { label: 'Visits', count: dashboard.totalVisits, color: 'amber' as const },
    { label: 'Low Attendance', count: dashboard.branches.filter((b) => b.attendanceRate < 50).length, color: 'red' as const },
  ];

  // Alert branches
  const alertBranches = dashboard.branches.filter((b) => b.attendanceRate < 50);

  // Analytics chart data
  const visitsByDayData = analyticsData ? Object.entries(analyticsData.visitsByDay || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: count
  })) : [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const visitsByDayOfWeekData = analyticsData ? analyticsData.visitsByDayOfWeek.map((count, index) => ({
    day: dayNames[index],
    visits: count
  })) : [];

  // Branch performance chart data
  const barChartData = teamPerformance.slice(0, 8).map(member => ({
    name: member.name.split(' ')[0],
    Target: member.policiesTarget,
    Actual: member.policiesActual
  }));

  const topPerformers = performanceData?.slice(0, 10) || [];

  const getMilestoneBadge = (policies: number) => {
    if (policies >= 25) return { label: 'Gold', className: 'bg-yellow-500 text-white' };
    if (policies >= 15) return { label: 'Silver', className: 'bg-gray-400 text-white' };
    if (policies >= 7) return { label: 'Bronze', className: 'bg-amber-700 text-white' };
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-3 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Head Office</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Organization Dashboard</h1>
        </div>
      </div>

      <DashboardViewControl period={period} onPeriodChange={setPeriod} />

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusKPICard
          title="Visits"
          value={dashboard.totalVisits}
          subtitle="All branches"
          icon={MapPin}
          accent="primary"
          badge={dashboard.yesterdayVisits !== undefined ? `${dashboard.totalVisits - dashboard.yesterdayVisits >= 0 ? '+' : ''}${dashboard.totalVisits - dashboard.yesterdayVisits} vs yesterday` : undefined}
          badgeTrend={dashboard.yesterdayVisits !== undefined ? (dashboard.totalVisits >= dashboard.yesterdayVisits ? 'up' : 'down') : undefined}
          onClick={() => navigate('/dashboard/visits')}
        />
        <StatusKPICard
          title="Active Agents"
          value={`${dashboard.totalActiveAgents}/${dashboard.totalAgents}`}
          subtitle="Across org"
          icon={Users}
          accent="success"
        />
        <StatusKPICard
          title="Attendance Rate"
          value={`${dashboard.overallAttendance}%`}
          subtitle="Overall"
          icon={Clock}
          accent={dashboard.overallAttendance >= 70 ? 'success' : dashboard.overallAttendance >= 40 ? 'warning' : 'destructive'}
        />
        <StatusKPICard
          title="Plan Achievement"
          value={`${dashboard.overallAchievement}%`}
          subtitle="Target progress"
          icon={TrendingUp}
          accent={dashboard.overallAchievement >= 70 ? 'success' : dashboard.overallAchievement >= 40 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Pipeline */}
      <PipelineCard title="Organization Overview" icon={Building2} stages={branchStages} />

      {/* Branch Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">{kpis.totalPolicies}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Conversion Rate</p>
                <p className="text-xl font-bold">{kpis.overallAchievement}%</p>
              </div>
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Team Incentives</p>
                <p className="text-xl font-bold">₹{kpis.totalIncentive.toLocaleString()}</p>
              </div>
              <IndianRupee className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Sales Officers</p>
                <p className="text-xl font-bold">{kpis.activeSalesOfficers}</p>
              </div>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Visit Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visit Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitsByDayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Top Performers Podium */}
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

            {/* Rankings list */}
            <div className="space-y-1.5">
              {topPerformers.slice(0, 8).map((agent, index) => (
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

      {/* Alerts */}
      {alertBranches.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              ⚠ Low Attendance Branches ({alertBranches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {alertBranches.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{b.name}</span>
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  {b.attendanceRate}% attendance
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/branches')}>
          <Building2 className="h-4 w-4 mr-1" /> Manage Branches
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/users')}>
          <Users className="h-4 w-4 mr-1" /> Manage Users
        </Button>
      </div>
    </div>
  );
}
