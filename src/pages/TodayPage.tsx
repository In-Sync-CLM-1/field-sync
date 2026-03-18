import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Clock, MapPin, CheckCircle2, Circle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { useVisits } from '@/hooks/useVisits';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberStatus {
  user_id: string;
  full_name: string;
  is_punched_in: boolean;
  punch_in_time: string | null;
  visit_count: number;
  completed_visits: number;
}

const TodayPage = () => {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const navigate = useNavigate();
  const { todayAttendance, punchIn, punchOut } = useAttendance();
  const { visits } = useVisits();
  const [userRole, setUserRole] = useState<string>('agent');
  const [teamMembers, setTeamMembers] = useState<TeamMemberStatus[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

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
      } else if (userRoles.includes('manager') || userRoles.includes('branch_manager')) {
        setUserRole('manager');
      } else {
        setUserRole('agent');
      }
    }
    checkRole();
  }, [user]);

  // Fetch team data for managers/admins
  useEffect(() => {
    async function fetchTeamData() {
      if ((userRole !== 'manager' && userRole !== 'admin') || !currentOrganization) return;
      setLoadingTeam(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        // Get team members (users in same org)
        const { data: orgMembers } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('organization_id', currentOrganization.id);

        if (!orgMembers || orgMembers.length === 0) {
          setTeamMembers([]);
          return;
        }

        const memberIds = orgMembers.map(m => m.user_id);

        // Get profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', memberIds);

        // Get today's attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('user_id, punch_in_time, punch_out_time')
          .eq('date', today)
          .in('user_id', memberIds);

        // Get today's visits
        const { data: visitsData } = await supabase
          .from('visits')
          .select('user_id, status')
          .eq('organization_id', currentOrganization.id)
          .gte('check_in_time', `${today}T00:00:00`)
          .lte('check_in_time', `${today}T23:59:59`)
          .in('user_id', memberIds);

        const teamData: TeamMemberStatus[] = (profiles || []).map(p => {
          const att = attendanceData?.find(a => a.user_id === p.id);
          const memberVisits = visitsData?.filter(v => v.user_id === p.id) || [];
          return {
            user_id: p.id,
            full_name: p.full_name || 'Unknown',
            is_punched_in: !!(att?.punch_in_time && !att?.punch_out_time),
            punch_in_time: att?.punch_in_time || null,
            visit_count: memberVisits.length,
            completed_visits: memberVisits.filter(v => v.status === 'completed').length,
          };
        });

        setTeamMembers(teamData);
      } catch (err) {
        console.error('Error fetching team data:', err);
      } finally {
        setLoadingTeam(false);
      }
    }
    fetchTeamData();
  }, [userRole, currentOrganization]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayVisits = visits?.filter(v => {
    const visitDate = v.created_at ? format(new Date(v.created_at), 'yyyy-MM-dd') : '';
    return visitDate === today;
  }) || [];

  const completedVisits = todayVisits.filter(v => v.status === 'completed').length;
  const totalPlanned = todayVisits.length;
  const remainingVisits = totalPlanned - completedVisits;
  const isPunchedIn = todayAttendance && todayAttendance.punch_in_time && !todayAttendance.punch_out_time;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Today
          </h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {totalPlanned > 0 && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            {completedVisits} done, {remainingVisits} remaining
          </Badge>
        )}
      </div>

      {/* Attendance - First Button */}
      <Card className={isPunchedIn ? 'border-green-200 bg-green-50/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className={`h-5 w-5 ${isPunchedIn ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">{isPunchedIn ? 'You are on duty' : 'Start your day'}</p>
                {todayAttendance?.punch_in_time && (
                  <p className="text-sm text-muted-foreground">
                    Punched in at {format(new Date(todayAttendance.punch_in_time), 'hh:mm a')}
                  </p>
                )}
              </div>
            </div>
            {!todayAttendance?.punch_in_time ? (
              <Button onClick={() => punchIn()} className="bg-green-600 hover:bg-green-700">Punch In</Button>
            ) : !todayAttendance?.punch_out_time ? (
              <Button onClick={() => punchOut()} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Punch Out</Button>
            ) : (
              <Badge variant="secondary">Day Complete</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team View for Managers/Admins */}
      {isManagerOrAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Team Overview</h2>
          </div>
          {loadingTeam ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Loading team data...</p>
              </CardContent>
            </Card>
          ) : teamMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No team members found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <Card key={member.user_id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${member.is_punched_in ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.is_punched_in
                              ? `On duty since ${member.punch_in_time ? format(new Date(member.punch_in_time), 'hh:mm a') : ''}`
                              : 'Not punched in'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.completed_visits}/{member.visit_count}</p>
                        <p className="text-xs text-muted-foreground">visits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Today's Visits (personal) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{isManagerOrAdmin ? 'My Visits' : "Today's Visits"}</h2>
          <Button size="sm" onClick={() => navigate('/dashboard/visits/new')}>+ New Visit</Button>
        </div>
        {todayVisits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No visits planned for today</p>
              <Button variant="link" onClick={() => navigate('/dashboard/visits/new')} className="mt-2">Schedule a visit</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((visit) => (
              <Card key={visit.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/dashboard/visits/${visit.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {visit.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{visit.lead?.name || 'Customer'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{visit.purpose || 'Visit'}</p>
                    </div>
                    <Badge variant={visit.status === 'completed' ? 'default' : visit.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {visit.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayPage;
