import { useAdminDashboard, TeamMember, TeamPerformanceRow } from '@/hooks/useAdminDashboard';
import { StatusKPICard } from './StatusKPICard';
import { ActivityFeed, ActivityItem } from './ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, MapPin, ShoppingBag, Clock, RefreshCw, TrendingUp,
  IndianRupee, UserCheck, Eye, CircleDot, Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend,
} from 'recharts';

export default function AdminDashboard() {
  const { data, loading, refresh } = useAdminDashboard();
  const { kpis, teamMembers, visitsTrend, teamPerformance, recentActivity } = data;

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
        <Skeleton className="h-16" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statusColor: Record<TeamMember['status'], string> = {
    'on-visit': 'bg-green-500',
    'punched-in': 'bg-blue-500',
    'idle': 'bg-gray-300',
  };

  const statusLabel: Record<TeamMember['status'], string> = {
    'on-visit': 'On Visit',
    'punched-in': 'Available',
    'idle': 'Absent',
  };

  const statusBadgeVariant: Record<TeamMember['status'], 'default' | 'secondary' | 'outline'> = {
    'on-visit': 'default',
    'punched-in': 'secondary',
    'idle': 'outline',
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Team Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusKPICard
          title="Team"
          value={`${kpis.activeMembers}/${kpis.teamSize}`}
          subtitle={`${kpis.attendanceRate}% attendance`}
          icon={Users}
          accent={kpis.attendanceRate >= 80 ? 'success' : kpis.attendanceRate >= 50 ? 'warning' : 'destructive'}
        />
        <StatusKPICard
          title="Visits Today"
          value={kpis.visitsToday}
          subtitle={kpis.visitsInProgress > 0 ? `${kpis.visitsInProgress} in progress` : 'No active visits'}
          badge={kpis.visitsInProgress > 0 ? `${kpis.visitsInProgress} live` : undefined}
          icon={MapPin}
          accent="primary"
        />
        <StatusKPICard
          title="Orders Today"
          value={kpis.ordersToday}
          subtitle={kpis.ordersValueToday > 0 ? `₹${kpis.ordersValueToday.toLocaleString()}` : 'No orders yet'}
          icon={ShoppingBag}
          accent="info"
        />
        <StatusKPICard
          title="Collections"
          value={kpis.collectionsToday}
          subtitle={kpis.collectionsValueToday > 0 ? `₹${kpis.collectionsValueToday.toLocaleString()}` : 'No collections yet'}
          icon={IndianRupee}
          accent="success"
        />
      </div>

      {/* Team Availability Strip */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Team Availability
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> On Visit</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Available</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300 inline-block" /> Absent</span>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1">
                {teamMembers.map(m => (
                  <div
                    key={m.id}
                    className="flex-shrink-0 w-[130px] rounded-lg border p-2.5 space-y-1.5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${statusColor[m.status]}`} />
                      <p className="text-xs font-medium truncate">{m.name.split(' ')[0]}</p>
                    </div>
                    <Badge variant={statusBadgeVariant[m.status]} className="text-[10px] h-4 px-1.5">
                      {statusLabel[m.status]}
                    </Badge>
                    {m.visitsToday > 0 && (
                      <p className="text-[10px] text-muted-foreground">{m.visitsToday} visit{m.visitsToday !== 1 ? 's' : ''}</p>
                    )}
                    {m.punchInTime && (
                      <p className="text-[10px] text-muted-foreground">In: {format(new Date(m.punchInTime), 'hh:mm a')}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Charts + Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Visit & Orders Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              30-Day Activity
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

      {/* Team Performance Table */}
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

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Customers</p>
              <p className="text-xl font-bold">{kpis.customersTotal.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-info/10">
              <ShoppingBag className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">30-Day Orders</p>
              <p className="text-xl font-bold">{data.teamPerformance.reduce((s, r) => s + r.ordersCount, 0)}</p>
              <p className="text-xs text-muted-foreground">₹{data.teamPerformance.reduce((s, r) => s + r.ordersValue, 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success/10">
              <IndianRupee className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">30-Day Collections</p>
              <p className="text-xl font-bold">₹{data.teamPerformance.reduce((s, r) => s + r.collectionsValue, 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
