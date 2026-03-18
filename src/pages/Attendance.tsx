import { useState } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { AttendanceTimer } from '@/components/AttendanceTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Clock, LogIn, LogOut, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function Attendance() {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const { todayAttendance, myHistory, teamAttendance, punchIn, punchOut } = useAttendance();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('sales_officer');

  // Check role
  useState(() => {
    if (!user) return;
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const roles = data?.map((r) => r.role) || [];
        if (roles.includes('admin') || roles.includes('super_admin') || roles.includes('platform_admin')) {
          setUserRole('admin');
        } else if (roles.includes('branch_manager') || roles.includes('manager')) {
          setUserRole('manager');
        }
      });
  });

  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';
  const activeAttendance = todayAttendance.data;
  const activeAttendanceId = activeAttendance?.status === 'active' ? activeAttendance.id : null;


  const handlePunchIn = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      await punchIn.mutateAsync(position);
      toast.success('Punched in successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to punch in');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!activeAttendance) return;
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      await punchOut.mutateAsync({ id: activeAttendance.id, position });
      toast.success('Punched out successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to punch out');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'missed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
        <Badge variant="outline" className="text-xs">
          {format(new Date(), 'EEEE, MMM d, yyyy')}
        </Badge>
      </div>


      {/* Agent Punch Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeAttendance ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-muted-foreground">You haven't punched in today</p>
              <Button
                size="lg"
                onClick={handlePunchIn}
                disabled={loading}
                className="gap-2 min-w-[200px]"
              >
                <LogIn className="h-5 w-5" />
                {loading ? 'Getting location...' : 'Punch In'}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> GPS location will be recorded
              </p>
            </div>
          ) : activeAttendance.status === 'active' ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                Active — Field Hours
              </Badge>
              <AttendanceTimer punchInTime={activeAttendance.punch_in_time!} />
              <p className="text-xs text-muted-foreground">
                Punched in at {format(new Date(activeAttendance.punch_in_time!), 'hh:mm a')}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3 text-primary" />
                Location tracking active
              </div>
              <Button
                size="lg"
                variant="destructive"
                onClick={handlePunchOut}
                disabled={loading}
                className="gap-2 min-w-[200px]"
              >
                <LogOut className="h-5 w-5" />
                {loading ? 'Getting location...' : 'Punch Out'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <Badge variant="secondary">Completed</Badge>
              <p className="text-sm text-foreground font-medium">
                {activeAttendance.total_hours?.toFixed(1)} hours today
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(activeAttendance.punch_in_time!), 'hh:mm a')} —{' '}
                {activeAttendance.punch_out_time ? format(new Date(activeAttendance.punch_out_time), 'hh:mm a') : '--'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Manager: Team Attendance */}
      {isManagerOrAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team Attendance — Today</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamAttendance.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">
                      No attendance records for today
                    </TableCell>
                  </TableRow>
                )}
                {teamAttendance.data?.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">
                      {a.profiles?.full_name || a.profiles?.email || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.punch_in_time ? format(new Date(a.punch_in_time), 'hh:mm a') : '--'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(a.status)} className="text-xs">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.total_hours ? `${a.total_hours.toFixed(1)}h` : a.status === 'active' ? 'In progress' : '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* My Attendance History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myHistory.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">
                    No attendance history yet
                  </TableCell>
                </TableRow>
              )}
              {myHistory.data?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm font-medium">{format(new Date(a.date), 'MMM d')}</TableCell>
                  <TableCell className="text-sm">
                    {a.punch_in_time ? format(new Date(a.punch_in_time), 'hh:mm a') : '--'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.punch_out_time ? format(new Date(a.punch_out_time), 'hh:mm a') : '--'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.total_hours ? `${a.total_hours.toFixed(1)}h` : '--'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(a.status)} className="text-xs">{a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
