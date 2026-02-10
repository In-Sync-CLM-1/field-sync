import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, MapPin, Target, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import type { OrgSummary } from '@/hooks/usePerformanceReview';
import { Skeleton } from '@/components/ui/skeleton';

interface OrgOverviewTabProps {
  data: OrgSummary | undefined;
  isLoading: boolean;
  dailyTrends: any[] | undefined;
  onBranchClick: (branchId: string) => void;
}

export function OrgOverviewTab({ data, isLoading, dailyTrends, onBranchClick }: OrgOverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-sm">No data available.</p>;

  const kpis = [
    { label: 'Total Sales', value: data.totalSales, target: data.totalSalesTarget, icon: Target, color: 'text-primary' },
    { label: 'Avg Achievement', value: `${data.avgAchievement}%`, icon: TrendingUp, color: data.avgAchievement >= 80 ? 'text-emerald-500' : 'text-amber-500' },
    { label: 'Total Visits', value: data.totalVisits, icon: MapPin, color: 'text-blue-500' },
    { label: 'Attendance Rate', value: `${data.attendanceRate}%`, icon: Calendar, color: data.attendanceRate >= 85 ? 'text-emerald-500' : 'text-amber-500' },
  ];

  // Bar chart data
  const barData = data.branches.map(b => ({
    name: b.branchName.length > 12 ? b.branchName.slice(0, 12) + '…' : b.branchName,
    'Prospects T': b.prospectsTarget,
    'Prospects A': b.prospectsActual,
    'Quotes T': b.quotesTarget,
    'Quotes A': b.quotesActual,
    'Sales T': b.salesTarget,
    'Sales A': b.salesActual,
  }));

  // Radar chart data
  const maxSales = Math.max(...data.branches.map(b => b.achievementPct), 1);
  const maxAtt = Math.max(...data.branches.map(b => b.attendanceRate), 1);
  const maxVisits = Math.max(...data.branches.map(b => b.visitsMonth), 1);
  const radarData = [
    { metric: 'Sales %', ...Object.fromEntries(data.branches.map(b => [b.branchName, Math.round((b.achievementPct / maxSales) * 100)])) },
    { metric: 'Visits', ...Object.fromEntries(data.branches.map(b => [b.branchName, Math.round((b.visitsMonth / maxVisits) * 100)])) },
    { metric: 'Attendance', ...Object.fromEntries(data.branches.map(b => [b.branchName, Math.round((b.attendanceRate / maxAtt) * 100)])) },
    { metric: 'Prospects', ...Object.fromEntries(data.branches.map(b => [b.branchName, b.prospectsTarget > 0 ? Math.round((b.prospectsActual / b.prospectsTarget) * 100) : 0])) },
    { metric: 'Quotes', ...Object.fromEntries(data.branches.map(b => [b.branchName, b.quotesTarget > 0 ? Math.round((b.quotesActual / b.quotesTarget) * 100) : 0])) },
  ];

  const radarColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(319, 24%, 62%)', 'hsl(197, 73%, 73%)'];

  // Line chart uses dailyTrends
  const branchNames = data.branches.map(b => b.branchName);
  const lineColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(319, 24%, 62%)', 'hsl(197, 56%, 47%)'];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  {'target' in kpi && kpi.target ? (
                    <p className="text-xs text-muted-foreground">of {kpi.target} target</p>
                  ) : null}
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stacked Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Branch Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={12}>
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

        {/* Radar Chart */}
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
                {data.branches.map((b, i) => (
                  <Radar key={b.branchId} name={b.branchName} dataKey={b.branchName} stroke={radarColors[i % radarColors.length]} fill={radarColors[i % radarColors.length]} fillOpacity={0.15} />
                ))}
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Line Chart */}
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

      {/* Branch Table */}
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
                {data.branches.map(branch => (
                  <TableRow
                    key={branch.branchId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onBranchClick(branch.branchId)}
                  >
                    <TableCell className="text-sm font-medium">{branch.branchName}</TableCell>
                    <TableCell className="text-sm text-center">{branch.activeAgents}</TableCell>
                    <TableCell className="text-sm text-center">{branch.visitsToday}/{branch.visitsMonth}</TableCell>
                    <TableCell className="text-sm text-center">{branch.salesTarget}/{branch.salesActual}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={branch.achievementPct >= 80 ? 'default' : branch.achievementPct >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                        {branch.achievementPct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-center">{branch.attendanceRate}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{branch.topPerformer || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
