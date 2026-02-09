import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAnalyticsData } from '@/hooks/useDashboardData';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  Users, Target, IndianRupee, TrendingUp, CalendarIcon, Trophy, Medal, Award, 
  BarChart3, Building2, ArrowLeft, Clock, FileText, Camera 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Analytics</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="branch" className="gap-2">
            <Building2 className="h-4 w-4" />
            Branch Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="branch" className="mt-4">
          <BranchPerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab - General Analytics
function OverviewTab() {
  const { data: analyticsData } = useAnalyticsData();

  if (!analyticsData) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const visitsByDayData = Object.entries(analyticsData.visitsByDay || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: count
  }));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const visitsByDayOfWeekData = analyticsData.visitsByDayOfWeek.map((count, index) => ({
    day: dayNames[index],
    visits: count
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Duration"
          value={`${analyticsData.avgDuration}m`}
          icon={Clock}
          subtitle="Per visit"
        />
        <MetricCard
          title="Form Rate"
          value={`${analyticsData.formCompletionRate}%`}
          icon={FileText}
          subtitle="Completion"
        />
        <MetricCard
          title="Photo Rate"
          value={`${analyticsData.photoCompletionRate}%`}
          icon={Camera}
          subtitle="Capture rate"
        />
        <MetricCard
          title="Total Visits"
          value={analyticsData.totalVisits}
          icon={TrendingUp}
          subtitle="All time"
        />
      </div>

      {/* Visit Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Trends (Last 30 Days)</CardTitle>
          <CardDescription>Daily visit volume over the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitsByDayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Visits by Day of Week</CardTitle>
          <CardDescription>Distribution of visits across the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByDayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Branch Performance Tab
function BranchPerformanceTab() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const { teamPerformance, policyTrend, incentiveToppers, kpis, isLoading } = useBranchAnalytics(selectedMonth);

  const getAchievementColor = (actual: number, target: number) => {
    if (target === 0) return 'text-muted-foreground';
    const pct = (actual / target) * 100;
    if (pct >= 100) return 'text-green-600';
    if (pct >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMilestoneBadge = (policies: number) => {
    if (policies >= 25) return { label: 'Gold', className: 'bg-yellow-500 text-white' };
    if (policies >= 15) return { label: 'Silver', className: 'bg-gray-400 text-white' };
    if (policies >= 7) return { label: 'Bronze', className: 'bg-amber-700 text-white' };
    return null;
  };

  const formatPct = (actual: number, target: number) => {
    if (target === 0) return '-';
    return `${Math.round((actual / target) * 100)}%`;
  };

  const barChartData = teamPerformance.slice(0, 8).map(member => ({
    name: member.name.split(' ')[0],
    Target: member.policiesTarget,
    Actual: member.policiesActual
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedMonth, 'MMMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={policyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'd MMM')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy')}
                    formatter={(value: number) => [value, 'Sales']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="policies" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales: Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
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

      {/* Top Performers */}
      {incentiveToppers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center">
              {incentiveToppers.slice(0, 3).map((topper, index) => {
                const icons = [Trophy, Medal, Award];
                const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
                const Icon = icons[index];
                const badge = getMilestoneBadge(topper.policies);
                
                return (
                  <div 
                    key={topper.id}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border-2",
                      index === 0 ? "border-yellow-500 bg-yellow-50" : "border-muted"
                    )}
                  >
                    <Icon className={cn("h-8 w-8 mb-2", colors[index])} />
                    <p className="font-semibold text-center">{topper.name}</p>
                    <p className="text-2xl font-bold">{topper.policies}</p>
                    <p className="text-sm text-muted-foreground">sales</p>
                    <p className="text-lg font-semibold text-green-600 mt-1">₹{topper.incentive.toLocaleString()}</p>
                    {badge && (
                      <Badge className={cn("mt-2", badge.className)}>{badge.label}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Officer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-center">Prospects (T/A/%)</TableHead>
                  <TableHead className="text-center">Quotes (T/A/%)</TableHead>
                  <TableHead className="text-center">Sales (T/A/%)</TableHead>
                  <TableHead className="text-right">Incentives</TableHead>
                  <TableHead className="text-center">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  teamPerformance.map((member) => {
                    const badge = getMilestoneBadge(member.policiesActual);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.prospectsTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.prospectsActual, member.prospectsTarget)}>
                            {member.prospectsActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.prospectsActual, member.prospectsTarget)}>
                            {formatPct(member.prospectsActual, member.prospectsTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.quotesTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.quotesActual, member.quotesTarget)}>
                            {member.quotesActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.quotesActual, member.quotesTarget)}>
                            {formatPct(member.quotesActual, member.quotesTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.policiesTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.policiesActual, member.policiesTarget)}>
                            {member.policiesActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.policiesActual, member.policiesTarget)}>
                            {formatPct(member.policiesActual, member.policiesTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{member.incentive.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {badge ? (
                            <Badge className={badge.className}>{badge.label}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
    </div>
  );
}
