import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
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
      action: () => navigate('/visits/new'),
      variant: 'default' as const,
    },
    {
      icon: Calendar,
      label: 'View Visits',
      description: 'See all your visits',
      action: () => navigate('/visits'),
      variant: 'outline' as const,
    },
    {
      icon: Users,
      label: 'Leads',
      description: 'Manage leads',
      action: () => navigate('/leads'),
      variant: 'outline' as const,
    },
    {
      icon: MapPin,
      label: 'Visit Map',
      description: 'View visits on map',
      action: () => navigate('/territory'),
      variant: 'outline' as const,
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
      trend: 'up' as const
    },
    { 
      label: 'This Week', 
      value: myStats?.visitsThisWeek.toString() || '0', 
      change: `${myStats?.visitsLastWeek || 0} last week`,
      icon: TrendingUp
    },
    { 
      label: 'Active Visits', 
      value: myStats?.activeVisits.toString() || '0', 
      change: 'In progress',
      icon: Calendar
    },
    { 
      label: 'Total Leads', 
      value: myStats?.totalLeads.toString() || '0', 
      change: '',
      icon: Users
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-neon-pink bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} style={{ animationDelay: `${index * 100}ms` }} className="animate-slide-up opacity-0">
            <MetricCard
              title={stat.label}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              trend={stat.trend}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions - grid layout */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                className="gap-2"
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
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">View all your visits in the Visits section</p>
            <Button variant="gradient" size="sm" className="mt-2" onClick={() => navigate('/visits')}>
              Go to Visits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}