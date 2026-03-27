import { useMyStats } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useAttendance } from '@/hooks/useAttendance';
import { StatusKPICard } from './StatusKPICard';
import { RecentVisitsSection } from './RecentVisitsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, TrendingUp, Clock, AlertTriangle, Calendar, ClipboardList, Users,
  ChevronRight, FileText, Phone, Sparkles, LogIn, LogOut, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isBefore, startOfDay } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AgentDashboard() {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const myStats = useMyStats();
  const navigate = useNavigate();
  const { todayAttendance, punchIn, punchOut } = useAttendance();
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const isPunchedIn = todayAttendance.data?.punch_in_time && !todayAttendance.data?.punch_out_time;
  const isDayComplete = todayAttendance.data?.punch_in_time && todayAttendance.data?.punch_out_time;

  const handlePunchIn = async () => {
    setAttendanceLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
        });
      });
      await punchIn.mutateAsync(position);
      toast.success('Punched in successfully!');
    } catch (err: any) {
      if (err.code === 1) toast.error('Location permission denied. Please enable GPS.');
      else toast.error(err.message || 'Failed to punch in');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!todayAttendance.data?.id) return;
    setAttendanceLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
        });
      });
      await punchOut.mutateAsync({ id: todayAttendance.data.id, position });
      toast.success('Punched out. Good work today!');
    } catch (err: any) {
      if (err.code === 1) toast.error('Location permission denied.');
      else toast.error(err.message || 'Failed to punch out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Follow-ups due
  const { data: followUpLeads = [] } = useQuery({
    queryKey: ['follow-up-leads-today', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('leads')
        .select('id, name, mobile_no, follow_up_date, status')
        .eq('organization_id', currentOrganization.id)
        .lte('follow_up_date', today)
        .not('status', 'in', '("won","lost")')
        .order('follow_up_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  const currentHour = new Date().getHours();
  const primaryAction = currentHour < 17
    ? { icon: MapPin, label: 'Start Visit', action: '/dashboard/visits/new' }
    : { icon: FileText, label: 'Daily Report', action: '/dashboard/visits' };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-3 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">{user?.user_metadata?.full_name || user?.email}</p>
        </div>
      </div>

      {/* Attendance Card */}
      <Card className={`border-l-4 ${isPunchedIn ? 'border-l-green-500 bg-green-50/30' : isDayComplete ? 'border-l-muted' : 'border-l-amber-500 bg-amber-50/30'}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPunchedIn ? 'bg-green-500/10' : isDayComplete ? 'bg-muted' : 'bg-amber-500/10'}`}>
                <Clock className={`h-4 w-4 ${isPunchedIn ? 'text-green-600' : isDayComplete ? 'text-muted-foreground' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isPunchedIn ? 'On Duty' : isDayComplete ? 'Day Complete' : 'Not Punched In'}
                </p>
                {todayAttendance.data?.punch_in_time && (
                  <p className="text-xs text-muted-foreground">
                    In: {format(new Date(todayAttendance.data.punch_in_time), 'hh:mm a')}
                    {todayAttendance.data.punch_out_time && ` · Out: ${format(new Date(todayAttendance.data.punch_out_time), 'hh:mm a')}`}
                    {todayAttendance.data.total_hours && ` · ${todayAttendance.data.total_hours}h`}
                  </p>
                )}
              </div>
            </div>
            {!todayAttendance.data?.punch_in_time ? (
              <Button size="sm" onClick={handlePunchIn} disabled={attendanceLoading} className="gap-1.5 bg-green-600 hover:bg-green-700">
                {attendanceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                Punch In
              </Button>
            ) : !todayAttendance.data?.punch_out_time ? (
              <Button size="sm" variant="outline" onClick={handlePunchOut} disabled={attendanceLoading} className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50">
                {attendanceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Punch Out
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs">Done</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div data-tour="metrics" className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusKPICard
          title="Visits Today"
          value={myStats?.visitsToday || 0}
          subtitle={`${myStats?.plannedVisitsToday || 0} planned`}
          badge={myStats?.weeklyTrend ? `${myStats.weeklyTrend}% vs last week` : undefined}
          badgeTrend={myStats?.weeklyTrend && myStats.weeklyTrend > 0 ? 'up' : myStats?.weeklyTrend && myStats.weeklyTrend < 0 ? 'down' : undefined}
          icon={MapPin}
          accent="primary"
          onClick={() => navigate('/dashboard/visits')}
        />
        <StatusKPICard
          title="This Week"
          value={myStats?.visitsThisWeek || 0}
          subtitle={`${myStats?.visitsLastWeek || 0} last week`}
          icon={TrendingUp}
          accent="info"
          onClick={() => navigate('/dashboard/visits')}
        />
        <StatusKPICard
          title="Active Visits"
          value={myStats?.activeVisits || 0}
          subtitle={myStats?.activeVisitMinutes ? `${myStats.activeVisitMinutes}m active` : 'None active'}
          icon={Clock}
          accent="warning"
        />
        <StatusKPICard
          title="Overdue Follow-ups"
          value={myStats?.overdueFollowUps || 0}
          subtitle="Need attention"
          icon={AlertTriangle}
          accent={myStats?.overdueFollowUps && myStats.overdueFollowUps > 0 ? 'destructive' : 'success'}
          onClick={() => navigate('/dashboard/customers?filter=overdue')}
        />
      </div>

      {/* Quick Actions */}
      <div data-tour="quick-actions">
        <Button
          size="default"
          className="w-full mb-2 h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          onClick={() => navigate(primaryAction.action)}
        >
          <primaryAction.icon className="h-4 w-4 mr-2" />
          {primaryAction.label}
        </Button>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Button variant="outline" size="sm" className="h-10 flex flex-col items-center justify-center gap-0.5 py-1.5" onClick={() => navigate('/dashboard/visits')}>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">All Visits</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex flex-col items-center justify-center gap-0.5 py-1.5" onClick={() => navigate('/dashboard/today')}>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Today</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex flex-col items-center justify-center gap-0.5 py-1.5" onClick={() => navigate('/dashboard/orders')}>
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Orders</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 flex flex-col items-center justify-center gap-0.5 py-1.5" onClick={() => navigate('/dashboard/customers')}>
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Customers</span>
          </Button>
        </div>
      </div>

      {/* Follow-ups */}
      {followUpLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Follow-ups Due ({followUpLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUpLeads.map((lead) => {
              const isOverdue = lead.follow_up_date && isBefore(new Date(lead.follow_up_date), startOfDay(new Date()));
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/dashboard/customers/${lead.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className={isOverdue ? 'text-destructive font-medium' : 'text-warning'}>
                        {isOverdue ? 'Overdue' : 'Today'} · {lead.follow_up_date && format(new Date(lead.follow_up_date), 'dd MMM')}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {lead.mobile_no && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.mobile_no}`; }}>
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground self-center" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Visits */}
      <div data-tour="recent-visits">
        <RecentVisitsSection />
      </div>
    </div>
  );
}
