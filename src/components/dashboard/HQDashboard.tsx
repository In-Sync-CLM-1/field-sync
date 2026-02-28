import { useState } from 'react';
import { useBranchDashboard } from '@/hooks/useBranchDashboard';
import { useAnalyticsData, usePerformanceData } from '@/hooks/useDashboardData';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { useOrgPerformance, useDailyTrends, useBranchEmployees } from '@/hooks/usePerformanceReview';
import { DashboardViewControl, DashboardPeriod } from './DashboardViewControl';
import { StatusKPICard } from './StatusKPICard';
import { PipelineCard } from './PipelineCard';
import { MetricCard } from './MetricCard';
import { EmployeeDetailSheet } from '@/components/performance/EmployeeDetailSheet';
import { Building2, Users, Clock, TrendingUp, TrendingDown, MapPin, Target, IndianRupee, Trophy, Medal, Award, CalendarIcon, FileText, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { startOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';

export default function HQDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: dashboard, isLoading } = useBranchDashboard(period);
  const { data: analyticsData } = useAnalyticsData();
  const { data: performanceData } = usePerformanceData();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const { teamPerformance, policyTrend, incentiveToppers, kpis, isLoading: branchLoading } = useBranchAnalytics(selectedMonth);
  const { data: orgData, isLoading: orgLoading } = useOrgPerformance();
  const { data: dailyTrends } = useDailyTrends();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const drilldownBranchId = selectedBranchId || (orgData?.branches?.[0]?.branchId || null);
  const { data: branchEmployees, isLoading: employeesLoading } = useBranchEmployees(drilldownBranchId);
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

  const topPerformers = performanceData || [];

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

  // Org overview chart data
  const orgBarData = orgData?.branches.map(b => ({
    name: b.branchName.length > 12 ? b.branchName.slice(0, 12) + '…' : b.branchName,
    'Sales T': b.salesTarget,
    'Sales A': b.salesActual,
    'Prospects T': b.prospectsTarget,
    'Prospects A': b.prospectsActual,
  })) || [];

  const radarData = orgData ? [
    { metric: 'Sales %', ...Object.fromEntries(orgData.branches.map(b => [b.branchName, Math.round((b.achievementPct / Math.max(...orgData.branches.map(x => x.achievementPct), 1)) * 100)])) },
    { metric: 'Visits', ...Object.fromEntries(orgData.branches.map(b => [b.branchName, Math.round((b.visitsMonth / Math.max(...orgData.branches.map(x => x.visitsMonth), 1)) * 100)])) },
    { metric: 'Attendance', ...Object.fromEntries(orgData.branches.map(b => [b.branchName, Math.round((b.attendanceRate / Math.max(...orgData.branches.map(x => x.attendanceRate), 1)) * 100)])) },
    { metric: 'Prospects', ...Object.fromEntries(orgData.branches.map(b => [b.branchName, b.prospectsTarget > 0 ? Math.round((b.prospectsActual / b.prospectsTarget) * 100) : 0])) },
    { metric: 'Quotes', ...Object.fromEntries(orgData.branches.map(b => [b.branchName, b.quotesTarget > 0 ? Math.round((b.quotesActual / b.quotesTarget) * 100) : 0])) },
  ] : [];

  const radarColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(319, 24%, 62%)', 'hsl(197, 73%, 73%)'];
  const lineColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(319, 24%, 62%)', 'hsl(197, 56%, 47%)'];
  const branchNames = orgData?.branches.map(b => b.branchName) || [];

  // Branch drilldown data
  const currentBranch = orgData?.branches.find(b => b.branchId === drilldownBranchId);
  const employeeBarData = (branchEmployees || []).map(e => ({
    name: (e.fullName || '').split(' ')[0],
    'Sales T': e.salesTarget,
    'Sales A': e.salesActual,
    'Prospects T': e.prospectsTarget,
    'Prospects A': e.prospectsActual,
  }));
  const completedCount = (branchEmployees || []).reduce((s, e) => s + e.completedVisits, 0);
  const cancelledCount = (branchEmployees || []).reduce((s, e) => s + e.cancelledVisits, 0);
  const inProgressCount = (branchEmployees || []).reduce((s, e) => s + (e.visitsMonth - e.completedVisits - e.cancelledVisits), 0);
  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Cancelled', value: cancelledCount },
  ].filter(d => d.value > 0);
  const pieColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(0, 43%, 51%)'];

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

      {/* Analytics Metrics Row */}
      {analyticsData && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Avg Duration" value={`${analyticsData.avgDuration}m`} icon={Clock} subtitle="Per visit" />
          <MetricCard title="Form Rate" value={`${analyticsData.formCompletionRate}%`} icon={FileText} subtitle="Completion" />
          <MetricCard title="Photo Rate" value={`${analyticsData.photoCompletionRate}%`} icon={Camera} subtitle="Capture rate" />
          <MetricCard title="Total Visits" value={analyticsData.totalVisits} icon={TrendingUp} subtitle="All time" />
        </div>
      )}

      {/* Branch Performance KPIs + Month Selector */}
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

      {/* Org Performance: Branch Target vs Actual + Radar */}
      {orgData && orgData.branches.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Sales', value: orgData.totalSales, target: orgData.totalSalesTarget, icon: Target, color: 'text-primary' },
              { label: 'Avg Achievement', value: `${orgData.avgAchievement}%`, icon: TrendingUp, color: orgData.avgAchievement >= 80 ? 'text-emerald-500' : 'text-amber-500' },
              { label: 'Total Visits', value: orgData.totalVisits, icon: MapPin, color: 'text-blue-500' },
              { label: 'Attendance Rate', value: `${orgData.attendanceRate}%`, icon: CalendarIcon, color: orgData.attendanceRate >= 85 ? 'text-emerald-500' : 'text-amber-500' },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      {'target' in kpi && kpi.target ? <p className="text-xs text-muted-foreground">of {kpi.target} target</p> : null}
                    </div>
                    <kpi.icon className={`h-5 w-5 ${kpi.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Branch Target vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orgBarData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Sales T" fill="hsl(174, 99%, 36%)" opacity={0.3} />
                    <Bar dataKey="Sales A" fill="hsl(174, 99%, 36%)" />
                    <Bar dataKey="Prospects T" fill="hsl(48, 93%, 50%)" opacity={0.3} />
                    <Bar dataKey="Prospects A" fill="hsl(48, 93%, 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Branch Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                    {orgData.branches.map((b, i) => (
                      <Radar key={b.branchId} name={b.branchName} dataKey={b.branchName} stroke={radarColors[i % radarColors.length]} fill={radarColors[i % radarColors.length]} fillOpacity={0.15} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Trend */}
          {dailyTrends && dailyTrends.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Sales Trend (This Month)</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {branchNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={lineColors[i % lineColors.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Branch Performance Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Branch Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Branch</TableHead>
                      <TableHead className="text-xs text-center">Agents</TableHead>
                      <TableHead className="text-xs text-center">Visits (Today/Mo)</TableHead>
                      <TableHead className="text-xs text-center">Sales (T/A)</TableHead>
                      <TableHead className="text-xs text-center">Achievement</TableHead>
                      <TableHead className="text-xs text-center">Attendance</TableHead>
                      <TableHead className="text-xs">Top Performer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgData.branches.map(branch => (
                      <TableRow
                        key={branch.branchId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedBranchId(branch.branchId)}
                      >
                        <TableCell className="text-xs font-medium">{branch.branchName}</TableCell>
                        <TableCell className="text-xs text-center">{branch.activeAgents}</TableCell>
                        <TableCell className="text-xs text-center">{branch.visitsToday}/{branch.visitsMonth}</TableCell>
                        <TableCell className="text-xs text-center">{branch.salesTarget}/{branch.salesActual}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={branch.achievementPct >= 80 ? 'default' : branch.achievementPct >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                            {branch.achievementPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-center">{branch.attendanceRate}%</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{branch.topPerformer || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Branch Drilldown */}
      {orgData && orgData.branches.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Branch Drilldown</h2>
            <Select value={drilldownBranchId || ''} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {orgData.branches.map(b => (
                  <SelectItem key={b.branchId} value={b.branchId}>{b.branchName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentBranch && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sales Achievement', value: `${currentBranch.achievementPct}%`, icon: Target, color: currentBranch.achievementPct >= 80 ? 'text-emerald-500' : 'text-amber-500' },
                { label: 'Visit Count', value: currentBranch.visitsMonth, icon: MapPin, color: 'text-blue-500' },
                { label: 'Attendance Rate', value: `${currentBranch.attendanceRate}%`, icon: CalendarIcon, color: currentBranch.attendanceRate >= 85 ? 'text-emerald-500' : 'text-amber-500' },
                { label: 'Active Agents', value: currentBranch.activeAgents, icon: Clock, color: 'text-primary' },
              ].map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                    <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-60`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!employeesLoading && branchEmployees && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Employee Target vs Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeeBarData} barSize={10}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Sales T" fill="hsl(174, 99%, 36%)" opacity={0.3} />
                        <Bar dataKey="Sales A" fill="hsl(174, 99%, 36%)" />
                        <Bar dataKey="Prospects T" fill="hsl(48, 93%, 50%)" opacity={0.3} />
                        <Bar dataKey="Prospects A" fill="hsl(48, 93%, 50%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Visit Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={pieColors[i % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Employee Performance Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Employee Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs text-center">Visits (Today/Mo)</TableHead>
                          <TableHead className="text-xs text-center">Sales (T/A)</TableHead>
                          <TableHead className="text-xs text-center">Achievement</TableHead>
                          <TableHead className="text-xs text-center">Attendance</TableHead>
                          <TableHead className="text-xs text-center">Avg Duration</TableHead>
                          <TableHead className="text-xs">Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branchEmployees.map(emp => (
                          <TableRow
                            key={emp.userId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedEmployee(emp.userId)}
                          >
                            <TableCell className="text-xs font-medium">{emp.fullName}</TableCell>
                            <TableCell className="text-xs text-center">{emp.visitsToday}/{emp.visitsMonth}</TableCell>
                            <TableCell className="text-xs text-center">{emp.salesTarget}/{emp.salesActual}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={emp.achievementPct >= 80 ? 'default' : emp.achievementPct >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                                {emp.achievementPct}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-center">{emp.attendanceDays}d</TableCell>
                            <TableCell className="text-xs text-center">{emp.avgVisitDuration}m</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {emp.lastActive ? format(new Date(emp.lastActive), 'dd MMM') : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <EmployeeDetailSheet
            userId={selectedEmployee}
            open={!!selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        </>
      )}

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
