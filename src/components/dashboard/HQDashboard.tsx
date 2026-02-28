import { useState } from 'react';
import { useBranchDashboard } from '@/hooks/useBranchDashboard';
import { DashboardViewControl, DashboardPeriod } from './DashboardViewControl';
import { StatusKPICard } from './StatusKPICard';
import { PipelineCard } from './PipelineCard';
import { ActivityFeed, ActivityItem } from './ActivityFeed';
import { Building2, Users, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function HQDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: dashboard, isLoading } = useBranchDashboard(period);
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

  // Build activity feed from recent visits
  const activityItems: ActivityItem[] = dashboard.recentVisits.map((v) => ({
    id: v.id,
    name: v.agentName,
    action: `Visited ${v.customerName}`,
    timestamp: v.checkInTime,
    status: 'completed' as const,
    meta: v.branchName,
  }));

  // Branch pipeline stages
  const branchStages = [
    { label: 'Branches', count: dashboard.branches.length, color: 'blue' as const },
    { label: 'Active Agents', count: dashboard.totalActiveAgents, color: 'green' as const },
    { label: 'Visits', count: dashboard.totalVisits, color: 'amber' as const },
    { label: 'Low Attendance', count: dashboard.branches.filter((b) => b.attendanceRate < 50).length, color: 'red' as const },
  ];

  // Alert branches
  const alertBranches = dashboard.branches.filter((b) => b.attendanceRate < 50);

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

      {/* Activity Feed */}
      <ActivityFeed
        title="Recent Activity"
        items={activityItems}
        onViewAll={() => navigate('/dashboard/visits')}
      />

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
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/analytics')}>
          <TrendingUp className="h-4 w-4 mr-1" /> Analytics
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/performance-review')}>
          <TrendingUp className="h-4 w-4 mr-1" /> Performance
        </Button>
      </div>
    </div>
  );
}
