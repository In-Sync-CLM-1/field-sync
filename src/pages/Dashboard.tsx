import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ClipboardList, TrendingUp, Users, Sparkles } from 'lucide-react';
import { useMyStats } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const myStats = useMyStats();

  const quickActions = [
    {
      icon: MapPin,
      label: 'Start Visit',
      description: 'Check in to a customer location',
      action: () => navigate('/dashboard/visits/new'),
      className: 'btn-gradient-primary text-primary-foreground',
    },
    {
      icon: Calendar,
      label: 'View Visits',
      description: 'See all your visits',
      action: () => navigate('/dashboard/visits'),
      className: 'btn-outline-info',
    },
    {
      icon: ClipboardList,
      label: 'Daily Planning',
      description: 'Manage daily plans',
      action: () => navigate('/dashboard/planning'),
      className: 'btn-outline-accent',
    },
    {
      icon: MapPin,
      label: 'Visit Map',
      description: 'View visits on map',
      action: () => navigate('/dashboard/territory'),
      className: 'btn-outline-warning',
    },
  ];

  const weekChange = myStats?.visitsLastWeek && myStats?.visitsLastWeek > 0
    ? ((myStats.visitsThisWeek - myStats.visitsLastWeek) / myStats.visitsLastWeek * 100).toFixed(0)
    : '0';

  const stats = [
    { 
      label: 'Visits Today', 
      value: myStats?.visitsToday.toString() || '0', 
      change: `${weekChange}% vs last week`,
      icon: MapPin,
      trend: 'up' as const,
      accentColor: 'primary' as const,
    },
    { 
      label: 'This Week', 
      value: myStats?.visitsThisWeek.toString() || '0', 
      change: `${myStats?.visitsLastWeek || 0} last week`,
      icon: TrendingUp,
      accentColor: 'info' as const,
    },
    { 
      label: 'Active Visits', 
      value: myStats?.activeVisits.toString() || '0', 
      change: 'In progress',
      icon: Calendar,
      accentColor: 'warning' as const,
    },
    { 
      label: 'Total Leads', 
      value: myStats?.totalLeads.toString() || '0', 
      change: '',
      icon: Users,
      accentColor: 'accent' as const,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 page-gradient min-h-screen">
      {/* Hero Welcome Section */}
      <div className="hero-gradient animate-fade-in">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text-primary">
              Welcome back!
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} style={{ animationDelay: `${index * 100}ms` }} className="animate-slide-up opacity-0">
            <MetricCard
              title={stat.label}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              trend={stat.trend}
              accentColor={stat.accentColor}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions - grid layout */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                size="sm"
                className={`gap-2 h-10 font-medium ${action.className}`}
                onClick={action.action}
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity - more compact */}
      <Card className="animate-fade-in card-glass" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <div className="icon-circle icon-circle-primary mx-auto mb-3 h-12 w-12">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium mb-1">View all your visits</p>
            <p className="text-xs text-muted-foreground mb-3">Track your field activity and check-ins</p>
            <Button className="btn-gradient-primary text-primary-foreground" size="sm" onClick={() => navigate('/dashboard/visits')}>
              Go to Visits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}