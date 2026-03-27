import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useTeamMapData } from '@/hooks/useTeamMapData';
import { StatusKPICard } from './StatusKPICard';
import { ActivityFeed, ActivityItem } from './ActivityFeed';
import TeamMap from './TeamMap';
import AIInsights from './AIInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, MapPin, ShoppingBag, RefreshCw, TrendingUp,
  IndianRupee, UserCheck, Eye, Activity, Route,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell,
} from 'recharts';

export default function AdminDashboard() {
  const { data, loading, refresh } = useAdminDashboard();
  const { kpis, teamMembers, visitsTrend, teamPerformance, recentActivity } = data;
  const mapData = useTeamMapData();

  // Map activity to ActivityFeed format
  const feedItems: ActivityItem[] = recentActivity.map(a => ({
    id: a.id,
    name: a.agentName,
    action: a.detail,
    timestamp: a.timestamp,
    status: a.type === 'visit_completed' ? 'completed' as const
      : a.type === 'visit_started' ? 'active' as const
      : undefined,
    meta: a.meta,
  }));

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[350px]" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Team availability counts for KPI cards
  const onVisitCount = teamMembers.filter(m => m.status === 'on-visit').length;
  const availableCount = teamMembers.filter(m => m.status === 'punched-in').length;
  const absentCount = teamMembers.filter(m => m.status === 'idle').length;

  // Build bar chart data for team comparison
  const teamBarData = teamPerformance.slice(0, 10).map(r => ({
    name: r.name.split(' ')[0],
    visits: r.visitsToday,
    orders: r.ordersCount,
  }));

  // Collection rate
  const totalOrders30d = data.teamPerformance.reduce((s, r) => s + r.ordersValue, 0);
  const totalCollections30d = data.teamPerformance.reduce((s, r) => s + r.collectionsValue, 0);
  const collectionRate = totalOrders30d > 0 ? Math.round((totalCollections30d / totalOrders30d) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Team Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refresh(); mapData.refresh(); }} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatusKPICard
          title="On Visit"
          value={onVisitCount}
          subtitle={`of ${kpis.teamSize} agents`}
          icon={MapPin}
          accent="success"
        />
        <StatusKPICard
          title="Available"
          value={availableCount}
          subtitle="Punched in"
          icon={UserCheck}
          accent="primary"
        />
        <StatusKPICard
          title="Absent"
          value={absentCount}
          subtitle={`${kpis.attendanceRate}% attendance`}
          icon={Users}
          accent={absentCount === 0 ? 'success' : 'destructive'}
        />
        <StatusKPICard
          title="Distance"
          value={`${mapData.totalDistance} km`}
          subtitle={`${mapData.distances.length} tracked`}
          icon={Route}
          accent="warning"
        />
        <StatusKPICard
          title="Visits Today"
          value={kpis.visitsToday}
          badge={kpis.visitsInProgress > 0 ? `${kpis.visitsInProgress} live` : undefined}
          icon={MapPin}
          accent="primary"
        />
        <StatusKPICard
          title="Orders"
          value={kpis.ordersToday}
          subtitle={kpis.ordersValueToday > 0 ? `₹${kpis.ordersValueToday.toLocaleString()}` : undefined}
          icon={ShoppingBag}
          accent="info"
        />
        <StatusKPICard
          title="Collections"
          value={kpis.collectionsToday}
          subtitle={kpis.collectionsValueToday > 0 ? `₹${kpis.collectionsValueToday.toLocaleString()}` : undefined}
          icon={IndianRupee}
          accent="success"
        />
        <StatusKPICard
          title="Customers"
          value={kpis.customersTotal.toLocaleString()}
          subtitle={collectionRate > 0 ? `${collectionRate}% collected` : undefined}
          icon={Eye}
          accent="primary"
        />
      </div>

      {/* === HERO: LIVE MAP (full width) === */}
      <TeamMap agents={mapData.agents} visits={mapData.visits} loading={mapData.loading} />

      {/* === CHARTS ROW === */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* 30-Day Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              30-Day Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={visitsTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="visits" name="Visits" stroke="hsl(var(--primary))" fill="url(#visitsFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#10b981" fill="url(#ordersFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed
          title="Live Activity"
          items={feedItems}
          maxHeight="320px"
        />
      </div>

      {/* === TEAM COMPARISON BAR CHART + SUMMARY CARDS === */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Team Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Comparison
              <Badge variant="outline" className="text-[10px] ml-1">Today vs 30d Orders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {teamBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={teamBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="visits" name="Today's Visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" name="30d Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No team data available</p>
            )}
          </CardContent>
        </Card>

        {/* Summary stat cards */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-info/10">
                <ShoppingBag className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">30-Day Orders</p>
                <p className="text-xl font-bold">{data.teamPerformance.reduce((s, r) => s + r.ordersCount, 0)}</p>
                <p className="text-xs text-muted-foreground">₹{totalOrders30d.toLocaleString()} value</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <IndianRupee className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">30-Day Collections</p>
                <p className="text-xl font-bold">₹{totalCollections30d.toLocaleString()}</p>
                {collectionRate > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success to-success/70 rounded-full transition-all"
                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-success">{collectionRate}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg Visits/Agent</p>
                <p className="text-xl font-bold">
                  {kpis.teamSize > 0 ? (data.teamPerformance.reduce((s, r) => s + r.visitsThisWeek, 0) / kpis.teamSize).toFixed(1) : '0'}
                </p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === AI INSIGHTS === */}
      <AIInsights />

      {/* === TEAM PERFORMANCE TABLE === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Team Performance
            <Badge variant="outline" className="text-[10px] ml-1">30 days</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Member</TableHead>
                  <TableHead className="text-xs text-center">Today</TableHead>
                  <TableHead className="text-xs text-center">This Week</TableHead>
                  <TableHead className="text-xs text-center">Orders</TableHead>
                  <TableHead className="text-xs text-right">Order Value</TableHead>
                  <TableHead className="text-xs text-right">Collections</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No team data available
                    </TableCell>
                  </TableRow>
                ) : (
                  teamPerformance.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm text-center">
                        <span className={row.visitsToday > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                          {row.visitsToday}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-center">{row.visitsThisWeek}</TableCell>
                      <TableCell className="text-sm text-center">{row.ordersCount}</TableCell>
                      <TableCell className="text-sm text-right">
                        {row.ordersValue > 0 ? `₹${row.ordersValue.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.collectionsValue > 0 ? `₹${row.collectionsValue.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.isPresent ? 'default' : 'outline'} className="text-[10px]">
                          {row.isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
