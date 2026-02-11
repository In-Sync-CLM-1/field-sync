import { useBranchDashboard } from '@/hooks/useBranchDashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Clock, TrendingUp, Building2, ChevronRight, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function BranchDashboard() {
  const { data: dashboard, isLoading } = useBranchDashboard();
  const navigate = useNavigate();

  if (isLoading || !dashboard) {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4 min-h-screen">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Organization</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Branch Dashboard</h1>
        <p className="text-sm text-muted-foreground">Organization-wide performance overview</p>
      </div>

      {/* Org KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Visits Today" value={dashboard.totalVisits} icon={MapPin} subtitle="All branches" />
        <MetricCard title="Active Agents" value={`${dashboard.totalActiveAgents}/${dashboard.totalAgents}`} icon={Users} subtitle="Across org" />
        <MetricCard title="Attendance" value={`${dashboard.overallAttendance}%`} icon={Clock} subtitle="Overall rate" />
        <MetricCard title="Plan Achievement" value={`${dashboard.overallAchievement}%`} icon={TrendingUp} subtitle="Today's targets" />
      </div>

      {/* Branch Performance Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Branch Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.branches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active branches found.</p>
          ) : (
            dashboard.branches.map(branch => (
              <div key={branch.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">{branch.agentCount} agents</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {branch.visitsToday} visits
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => navigate('/dashboard/performance-review')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Attendance</span>
                    <Progress value={branch.attendanceRate} className="h-1.5 mt-1" />
                    <span className="text-muted-foreground">{branch.attendanceRate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Achievement</span>
                    <Progress value={Math.min(branch.planAchievement, 100)} className="h-1.5 mt-1" />
                    <span className="text-muted-foreground">{branch.planAchievement}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {dashboard.recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent visits.</p>
          ) : (
            <div className="space-y-2">
              {dashboard.recentVisits.map(visit => (
                <div key={visit.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                      <MapPin className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{visit.agentName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">→ {visit.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{visit.branchName}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(visit.checkInTime), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/branches')}>
          <Building2 className="h-4 w-4 mr-1" />
          Manage Branches
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/users')}>
          <Users className="h-4 w-4 mr-1" />
          Manage Users
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/analytics')}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Analytics
        </Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => navigate('/dashboard/performance-review')}>
          <ChevronRight className="h-4 w-4 mr-1" />
          Performance Review
        </Button>
      </div>
    </div>
  );
}
