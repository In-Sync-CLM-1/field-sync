import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, parse } from 'date-fns';
import { cn } from '@/lib/utils';

type RoleCategory = 'agent' | 'manager' | 'admin';

export default function AttendanceSummary() {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [roleCategory, setRoleCategory] = useState<RoleCategory>('agent');

  // Determine role
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const roles = data?.map(r => r.role) || [];
        if (roles.some(r => ['admin', 'super_admin', 'platform_admin'].includes(r))) {
          setRoleCategory('admin');
        } else if (roles.includes('branch_manager')) {
          setRoleCategory('manager');
        } else {
          setRoleCategory('agent');
        }
      });
  }, [user]);

  // Daily attendance query
  const dailyQuery = useQuery({
    queryKey: ['attendance-summary-daily', format(selectedDate, 'yyyy-MM-dd'), roleCategory, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      let query = supabase
        .from('attendance')
        .select('*, profiles:user_id(full_name, email)')
        .eq('organization_id', currentOrganization.id)
        .eq('date', dateStr);

      if (roleCategory === 'agent') {
        query = query.eq('user_id', user.id);
      }
      // For managers & admins, RLS handles visibility

      const { data, error } = await query.order('punch_in_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentOrganization,
  });

  // Monthly attendance query
  const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
  const totalDaysInMonth = getDaysInMonth(monthDate);

  const monthlyQuery = useQuery({
    queryKey: ['attendance-summary-monthly', selectedMonth, roleCategory, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];

      let query = supabase
        .from('attendance')
        .select('user_id, date, status, total_hours, punch_in_time, profiles:user_id(full_name, email)')
        .eq('organization_id', currentOrganization.id)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (roleCategory === 'agent') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentOrganization,
  });

  // Aggregate monthly data per employee
  const monthlyAggregated = useMemo(() => {
    if (!monthlyQuery.data) return [];
    const grouped: Record<string, { name: string; present: number; totalHours: number; dates: Set<string> }> = {};

    for (const row of monthlyQuery.data as any[]) {
      const uid = row.user_id;
      if (!grouped[uid]) {
        grouped[uid] = {
          name: row.profiles?.full_name || row.profiles?.email || 'Unknown',
          present: 0,
          totalHours: 0,
          dates: new Set(),
        };
      }
      if (row.punch_in_time) {
        grouped[uid].present++;
        grouped[uid].dates.add(row.date);
      }
      if (row.total_hours) {
        grouped[uid].totalHours += row.total_hours;
      }
    }

    return Object.entries(grouped).map(([userId, data]) => ({
      userId,
      name: data.name,
      daysPresent: data.present,
      daysAbsent: totalDaysInMonth - data.present,
      totalHours: Math.round(data.totalHours * 10) / 10,
      avgHours: data.present > 0 ? Math.round((data.totalHours / data.present) * 10) / 10 : 0,
    }));
  }, [monthlyQuery.data, totalDaysInMonth]);

  // Month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') });
    }
    return options;
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Attendance Summary</h1>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="daily" className="text-xs px-3 py-1">Daily View</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs px-3 py-1">Monthly View</TabsTrigger>
        </TabsList>

        {/* Daily Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  Attendance — {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(selectedDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Loading...</TableCell>
                    </TableRow>
                  )}
                  {!dailyQuery.isLoading && (dailyQuery.data as any[])?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                        No attendance records for this date
                      </TableCell>
                    </TableRow>
                  )}
                  {(dailyQuery.data as any[])?.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">
                        {a.profiles?.full_name || a.profiles?.email || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.punch_in_time ? format(new Date(a.punch_in_time), 'hh:mm a') : '--'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.punch_out_time ? format(new Date(a.punch_out_time), 'hh:mm a') : '--'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.total_hours ? `${a.total_hours.toFixed(1)}h` : a.status === 'active' ? 'In progress' : '--'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={a.status === 'active' ? 'default' : a.status === 'completed' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Monthly Summary</CardTitle>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Days Present</TableHead>
                    <TableHead>Days Absent</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Avg Hours/Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Loading...</TableCell>
                    </TableRow>
                  )}
                  {!monthlyQuery.isLoading && monthlyAggregated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                        No attendance records for this month
                      </TableCell>
                    </TableRow>
                  )}
                  {monthlyAggregated.map(row => (
                    <TableRow key={row.userId}>
                      <TableCell className="text-sm font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="default" className="text-xs">{row.daysPresent}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="destructive" className="text-xs">{row.daysAbsent}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{row.totalHours}h</TableCell>
                      <TableCell className="text-sm">{row.avgHours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
