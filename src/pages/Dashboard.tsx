import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      label: 'Customers',
      description: 'Manage customers',
      action: () => navigate('/contacts'),
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
      icon: MapPin
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
      label: 'Total Customers', 
      value: myStats?.totalCustomers.toString() || '0', 
      change: '',
      icon: Users
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          {user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col items-start gap-2 p-4"
                onClick={action.action}
              >
                <Icon className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">{action.label}</div>
                  <div className="text-xs font-normal opacity-70">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
          <CardDescription>
            Your latest field visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>View all your visits in the Visits section</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/visits')}>
              Go to Visits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
