import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBranchAnalytics } from '@/hooks/useBranchAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Target, IndianRupee, TrendingUp, CalendarIcon, Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const BranchAnalytics = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const { teamPerformance, enrollmentTrend, incentiveToppers, kpis, isLoading } = useBranchAnalytics(selectedMonth);

  const getAchievementColor = (actual: number, target: number) => {
    if (target === 0) return 'text-muted-foreground';
    const pct = (actual / target) * 100;
    if (pct >= 100) return 'text-green-600';
    if (pct >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMilestoneBadge = (enrollments: number) => {
    if (enrollments >= 25) return { label: 'Gold', className: 'bg-yellow-500 text-white' };
    if (enrollments >= 15) return { label: 'Silver', className: 'bg-gray-400 text-white' };
    if (enrollments >= 7) return { label: 'Bronze', className: 'bg-amber-700 text-white' };
    return null;
  };

  const formatPct = (actual: number, target: number) => {
    if (target === 0) return '-';
    return `${Math.round((actual / target) * 100)}%`;
  };

  // Prepare bar chart data
  const barChartData = teamPerformance.slice(0, 8).map(member => ({
    name: member.name.split(' ')[0],
    Target: member.enrollTarget,
    Actual: member.enrollActual
  }));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Branch Analytics</h1>
          <p className="text-muted-foreground">Sales Officer Performance Overview</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedMonth, 'MMMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Enrollments</p>
                <p className="text-xl font-bold">{kpis.totalEnrollments}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Achievement Rate</p>
                <p className="text-xl font-bold">{kpis.overallAchievement}%</p>
              </div>
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Team Incentive</p>
                <p className="text-xl font-bold">₹{kpis.totalIncentive.toLocaleString()}</p>
              </div>
              <IndianRupee className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Sales Officers</p>
                <p className="text-xl font-bold">{kpis.activeSalesOfficers}</p>
              </div>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enrollment Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'd MMM')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy')}
                    formatter={(value: number) => [value, 'Enrollments']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Target vs Achievement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enrollment: Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Target" fill="hsl(var(--muted))" />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incentive Toppers */}
      {incentiveToppers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Incentive Toppers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center">
              {incentiveToppers.slice(0, 3).map((topper, index) => {
                const icons = [Trophy, Medal, Award];
                const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
                const Icon = icons[index];
                const badge = getMilestoneBadge(topper.enrollments);
                
                return (
                  <div 
                    key={topper.id}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border-2",
                      index === 0 ? "border-yellow-500 bg-yellow-50" : "border-muted"
                    )}
                  >
                    <Icon className={cn("h-8 w-8 mb-2", colors[index])} />
                    <p className="font-semibold text-center">{topper.name}</p>
                    <p className="text-2xl font-bold">{topper.enrollments}</p>
                    <p className="text-sm text-muted-foreground">enrollments</p>
                    <p className="text-lg font-semibold text-green-600 mt-1">₹{topper.incentive.toLocaleString()}</p>
                    {badge && (
                      <Badge className={cn("mt-2", badge.className)}>{badge.label}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Officer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-center">Leads (T/A/%)</TableHead>
                  <TableHead className="text-center">Logins (T/A/%)</TableHead>
                  <TableHead className="text-center">Enroll (T/A/%)</TableHead>
                  <TableHead className="text-right">Incentive</TableHead>
                  <TableHead className="text-center">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  teamPerformance.map((member) => {
                    const badge = getMilestoneBadge(member.enrollActual);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.leadsTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.leadsActual, member.leadsTarget)}>
                            {member.leadsActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.leadsActual, member.leadsTarget)}>
                            {formatPct(member.leadsActual, member.leadsTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.loginsTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.loginsActual, member.loginsTarget)}>
                            {member.loginsActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.loginsActual, member.loginsTarget)}>
                            {formatPct(member.loginsActual, member.loginsTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">{member.enrollTarget}</span>
                          {' / '}
                          <span className={getAchievementColor(member.enrollActual, member.enrollTarget)}>
                            {member.enrollActual}
                          </span>
                          {' / '}
                          <span className={getAchievementColor(member.enrollActual, member.enrollTarget)}>
                            {formatPct(member.enrollActual, member.enrollTarget)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{member.incentive.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {badge ? (
                            <Badge className={badge.className}>{badge.label}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchAnalytics;
