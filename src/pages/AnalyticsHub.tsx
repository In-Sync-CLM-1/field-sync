import { useAnalyticsData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, FileText, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar } from 'recharts';

export default function AnalyticsHub() {
  const { data: analyticsData } = useAnalyticsData();

  if (!analyticsData) {
    return (
      <div className="container py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const visitsByDayData = Object.entries(analyticsData.visitsByDay || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: count
  }));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const visitsByDayOfWeekData = analyticsData.visitsByDayOfWeek.map((count, index) => ({
    day: dayNames[index],
    visits: count
  }));

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Hub</h1>
        <p className="text-muted-foreground">Insights and trends from your field operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Duration"
          value={`${analyticsData.avgDuration}m`}
          icon={Clock}
          subtitle="Per visit"
        />
        <MetricCard
          title="Form Rate"
          value={`${analyticsData.formCompletionRate}%`}
          icon={FileText}
          subtitle="Completion"
        />
        <MetricCard
          title="Photo Rate"
          value={`${analyticsData.photoCompletionRate}%`}
          icon={Camera}
          subtitle="Capture rate"
        />
        <MetricCard
          title="Total Visits"
          value={analyticsData.totalVisits}
          icon={TrendingUp}
          subtitle="All time"
        />
      </div>

      {/* Visit Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Trends (Last 30 Days)</CardTitle>
          <CardDescription>Daily visit volume over the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitsByDayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Visits by Day of Week</CardTitle>
          <CardDescription>Distribution of visits across the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByDayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
