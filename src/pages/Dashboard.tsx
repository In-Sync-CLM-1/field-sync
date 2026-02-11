import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ClipboardList, TrendingUp, Users, Sparkles, Clock, AlertTriangle, Timer, FileText, ChevronRight, Lightbulb, Building2, LayoutDashboard, Phone } from 'lucide-react';
import { useMyStats } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentVisitsSection } from '@/components/dashboard/RecentVisitsSection';
import { SetupChecklist } from '@/components/dashboard/SetupChecklist';
import { useNavigate } from 'react-router-dom';
import { AppTour, TourTriggerButton } from '@/components/AppTour';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

type StatusColor = 'success' | 'warning' | 'danger' | 'neutral';

function getVisitsTodayStatus(completed: number, planned: number): StatusColor {
  if (planned === 0) return 'neutral';
  const percentage = (completed / planned) * 100;
  if (percentage >= 80) return 'success';
  if (percentage >= 40) return 'warning';
  return 'danger';
}

function getWeekStatus(completed: number, planned: number): StatusColor {
  if (planned === 0) return 'neutral';
  const percentage = (completed / planned) * 100;
  if (percentage >= 70) return 'success';
  if (percentage >= 40) return 'warning';
  return 'danger';
}

function getActiveVisitStatus(minutes: number): StatusColor {
  if (minutes === 0) return 'neutral';
  if (minutes > 120) return 'warning'; // More than 2 hours
  return 'success';
}

function getFollowUpStatus(count: number): StatusColor {
  if (count === 0) return 'success';
  if (count > 10) return 'danger';
  if (count > 5) return 'warning';
  return 'neutral';
}

function getPendingStatus(pending: number): StatusColor {
  if (pending === 0) return 'success';
  if (pending <= 3) return 'warning';
  return 'danger';
}

function getOverdueStatus(overdue: number): StatusColor {
  if (overdue === 0) return 'success';
  if (overdue <= 5) return 'warning';
  return 'danger';
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  }
  return `${hours}h ${mins}m ago`;
}

// Get time-based primary action
function getPrimaryAction(hour: number, visitsToday: number) {
  if (hour < 10) {
    return {
      icon: MapPin,
      label: 'Start First Visit',
      description: 'Begin your day with a customer visit',
      action: '/dashboard/visits/new',
    };
  } else if (hour < 17) {
    return {
      icon: ChevronRight,
      label: visitsToday > 0 ? 'Next Visit' : 'Start Visit',
      description: 'Continue with your planned visits',
      action: '/dashboard/visits/new',
    };
  } else {
    return {
      icon: FileText,
      label: 'Complete Day Report',
      description: 'Wrap up your daily activities',
      action: '/dashboard/planning',
    };
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const myStats = useMyStats();
  const { currentOrganization } = useAuthStore();
  const [userRole, setUserRole] = useState<string>('sales_officer');

  // Fetch follow-ups due today
  const { data: followUpLeads = [] } = useQuery({
    queryKey: ['follow-up-leads-today', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, mobile_no, follow_up_date, status')
        .eq('organization_id', currentOrganization.id)
        .lte('follow_up_date', today)
        .not('status', 'in', '("won","lost")')
        .order('follow_up_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      if (userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('platform_admin')) {
        setUserRole('admin');
      } else if (userRoles.includes('branch_manager')) {
        setUserRole('branch_manager');
      } else {
        setUserRole('sales_officer');
      }
    }
    checkRole();
  }, [user]);

  const currentHour = new Date().getHours();
  const primaryAction = getPrimaryAction(currentHour, myStats?.visitsToday || 0);

  const secondaryActions = [
    {
      icon: Calendar,
      label: 'View All Visits',
      description: 'See your visit history',
      action: () => navigate('/dashboard/visits'),
      priority: 2,
    },
    {
      icon: ClipboardList,
      label: 'Daily Planning',
      description: 'Manage daily plans',
      action: () => navigate('/dashboard/planning'),
      priority: 3,
    },
    {
      icon: MapPin,
      label: 'Territory Map',
      description: 'View visits on map',
      action: () => navigate('/dashboard/territory'),
      priority: 4,
    },
    {
      icon: Users,
      label: 'View Leads',
      description: 'Manage your prospects',
      action: () => navigate('/dashboard/leads'),
      priority: 5,
    },
  ];

  // Calculate progress and status for Visits Today
  const visitsTodayProgress = myStats?.plannedVisitsToday 
    ? Math.round((myStats.visitsToday / myStats.plannedVisitsToday) * 100)
    : 0;
  const visitsTodayStatus = getVisitsTodayStatus(myStats?.visitsToday || 0, myStats?.plannedVisitsToday || 0);

  // Week status
  const weekProgress = myStats?.plannedVisitsWeek 
    ? Math.round((myStats.visitsThisWeek / myStats.plannedVisitsWeek) * 100)
    : 0;
  const weekStatus = getWeekStatus(myStats?.visitsThisWeek || 0, myStats?.plannedVisitsWeek || 0);

  // Active visit status
  const activeVisitStatus = getActiveVisitStatus(myStats?.activeVisitMinutes || 0);

  // Follow-up status
  const followUpStatus = getFollowUpStatus(myStats?.followUpToday || 0);

  // Pending visits status
  const pendingStatus = getPendingStatus(myStats?.pendingVisitsToday || 0);

  // Overdue follow-ups status
  const overdueStatus = getOverdueStatus(myStats?.overdueFollowUps || 0);

  const stats = [
    { 
      label: 'Visits Today', 
      value: myStats?.visitsToday || 0,
      primaryText: `${myStats?.visitsToday || 0} of ${myStats?.plannedVisitsToday || 0} planned`,
      progress: visitsTodayProgress,
      change: myStats?.weeklyTrend !== 0 ? `${myStats?.weeklyTrend || 0}% vs last week` : undefined,
      trend: (myStats?.weeklyTrend || 0) > 0 ? 'up' as const : (myStats?.weeklyTrend || 0) < 0 ? 'down' as const : 'neutral' as const,
      icon: MapPin,
      accentColor: 'primary' as const,
      status: visitsTodayStatus,
      onClick: () => navigate('/dashboard/visits'),
    },
    { 
      label: 'This Week', 
      value: myStats?.visitsThisWeek || 0,
      primaryText: `${myStats?.visitsThisWeek || 0} completed`,
      secondaryText: myStats?.plannedVisitsWeek ? `${myStats.plannedVisitsWeek} planned this week` : undefined,
      change: `${myStats?.visitsLastWeek || 0} last week`,
      trend: (myStats?.visitsThisWeek || 0) >= (myStats?.visitsLastWeek || 0) ? 'up' as const : 'down' as const,
      icon: TrendingUp,
      accentColor: 'info' as const,
      status: weekStatus,
      onClick: () => navigate('/dashboard/visits'),
    },
    { 
      label: 'Active Visits', 
      value: myStats?.activeVisits || 0,
      primaryText: myStats?.activeVisits ? `${myStats.activeVisits} in progress` : 'No active visits',
      secondaryText: myStats?.activeVisitMinutes ? `Started ${formatMinutes(myStats.activeVisitMinutes)}` : undefined,
      icon: Clock,
      accentColor: 'warning' as const,
      status: activeVisitStatus,
      onClick: () => navigate('/dashboard/visits?status=active'),
    },
    { 
      label: 'Total Prospects', 
      value: myStats?.totalLeads || 0,
      primaryText: `${myStats?.openLeadsCount || 0} open leads`,
      secondaryText: myStats?.followUpToday ? `${myStats.followUpToday} need follow-up today` : 'No follow-ups today',
      icon: Users,
      accentColor: 'accent' as const,
      status: followUpStatus,
      onClick: () => navigate('/dashboard/leads'),
    },
    { 
      label: 'Pending Visits', 
      value: myStats?.pendingVisitsToday || 0,
      primaryText: `${myStats?.pendingVisitsToday || 0} pending today`,
      secondaryText: `${myStats?.visitsToday || 0} completed so far`,
      icon: Clock,
      accentColor: 'info' as const,
      status: pendingStatus,
      onClick: () => navigate('/dashboard/visits'),
    },
    { 
      label: 'Overdue Follow-ups', 
      value: myStats?.overdueFollowUps || 0,
      primaryText: `${myStats?.overdueFollowUps || 0} overdue`,
      secondaryText: 'Need immediate attention',
      icon: AlertTriangle,
      accentColor: 'destructive' as const,
      status: overdueStatus,
      onClick: () => navigate('/dashboard/leads?filter=overdue'),
    },
    { 
      label: 'Avg Duration', 
      value: myStats?.avgVisitDuration || 0,
      primaryText: `${myStats?.avgVisitDuration || 0} mins`,
      secondaryText: 'Last 30 days average',
      icon: Timer,
      accentColor: 'success' as const,
      status: 'neutral' as StatusColor,
      onClick: () => navigate('/dashboard/visits'),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-3 page-gradient min-h-screen">
      {/* App-wide Tour */}
      <AppTour />

      {/* Hero Welcome Section */}
      <div className="hero-gradient animate-fade-in">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Welcome back!
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          {/* Tour trigger button */}
          <TourTriggerButton />
        </div>
      </div>

      {/* Role-based navigation banner */}
      {userRole === 'admin' && (
        <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate('/dashboard/branch-dashboard')}>
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Branch Dashboard</p>
                <p className="text-xs text-muted-foreground">View organization-wide performance</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>
      )}
      {userRole === 'branch_manager' && (
        <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate('/dashboard/team-dashboard')}>
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Team Dashboard</p>
                <p className="text-xs text-muted-foreground">Monitor your team's performance</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>
      )}

      {/* Setup Checklist - shows for new users */}
      <SetupChecklist />

      {/* Stats Grid - 2 columns on mobile */}
      <div data-tour="metrics" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} style={{ animationDelay: `${index * 80}ms` }} className="animate-slide-up opacity-0">
            <MetricCard
              title={stat.label}
              value={stat.value}
              primaryText={stat.primaryText}
              secondaryText={stat.secondaryText}
              progress={stat.progress}
              change={stat.change}
              icon={stat.icon}
              trend={stat.trend}
              accentColor={stat.accentColor}
              status={stat.status}
              onClick={stat.onClick}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions - Priority layout with time-based primary action */}
      <div data-tour="quick-actions" className="animate-fade-in" style={{ animationDelay: '250ms' }}>
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-primary" />
          Quick Actions
        </h2>
        
        {/* Primary Action - Larger, prominent button */}
        <Button
          size="default"
          className="w-full mb-2 h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg"
          onClick={() => navigate(primaryAction.action)}
        >
          <primaryAction.icon className="h-4 w-4 mr-2" />
          {primaryAction.label}
          <span className="ml-2 text-xs opacity-80 hidden sm:inline">— {primaryAction.description}</span>
        </Button>

        {/* Secondary Actions - Smaller buttons in grid */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-10 flex flex-col items-center justify-center gap-0.5 py-1.5 border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                onClick={action.action}
                style={{ animationDelay: `${300 + index * 40}ms` }}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Follow-ups Due Today */}
      {followUpLeads.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
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
                  onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.follow_up_date && (
                        <span className={isOverdue ? 'text-red-500 font-medium' : 'text-amber-600'}>
                          {isOverdue ? 'Overdue' : 'Today'} · {format(new Date(lead.follow_up_date), 'dd MMM')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {lead.mobile_no && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead.mobile_no}`;
                        }}
                      >
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

      {/* Recent Visits Section */}
      <div data-tour="recent-visits">
        <RecentVisitsSection />
      </div>
    </div>
  );
}
