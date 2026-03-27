import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarCheck, Clock, MapPin, CheckCircle2, Circle,
  Users, Navigation, Play, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import { useVisits } from '@/hooks/useVisits';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Lead } from '@/lib/db';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberStatus[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Get today's daily plan from IndexedDB
  const todayPlan = useLiveQuery(async () => {
    if (!user) return null;
    const plans = await db.dailyPlans
      .where('userId')
      .equals(user.id)
      .filter(p => p.planDate === today)
      .toArray();
    return plans.length > 0 ? plans[0] : null;
  }, [user?.id, today]);

  // Get all leads from IndexedDB for lookup
  const allLeads = useLiveQuery(async () => {
    if (!currentOrganization) return [];
    return db.leads
      .where('organizationId')
      .equals(currentOrganization.id)
      .toArray();
  }, [currentOrganization?.id]) || [];

  // Build lead lookup map
  const leadMap = useMemo(() => {
    const map = new Map<string, Lead>();
    allLeads.forEach(l => map.set(l.id, l));
    return map;
  }, [allLeads]);

  // Get the ordered planned leads for today
  const plannedLeads = useMemo(() => {
    if (!todayPlan?.plannedLeadIds) return [];
    return todayPlan.plannedLeadIds
      .map(id => leadMap.get(id))
      .filter((l): l is Lead => !!l);
  }, [todayPlan, leadMap]);

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.some(r => ['admin', 'platform_admin'].includes(r)));
    }
    checkRole();
  }, [user]);

  // Fetch team data for managers/admins
  useEffect(() => {
    async function fetchTeamData() {
      if (!isAdmin || !currentOrganization) return;
      setLoadingTeam(true);
      try {
        const { data: orgMembers } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('organization_id', currentOrganization.id);

        if (!orgMembers || orgMembers.length === 0) {
          setTeamMembers([]);
          return;
        }

        const memberIds = orgMembers.map(m => m.user_id);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', memberIds);

        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('user_id, punch_in_time, punch_out_time')
          .eq('date', today)
          .in('user_id', memberIds);

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
  }, [isAdmin, currentOrganization]);

  const todayVisits = visits?.filter(v => {
    const visitDate = v.created_at ? format(new Date(v.created_at), 'yyyy-MM-dd') : '';
    return visitDate === today;
  }) || [];

  // Check if a lead already has a visit today
  const getLeadVisitStatus = (leadId: string) => {
    const visit = todayVisits.find(v => v.customer_id === leadId);
    if (!visit) return 'pending';
    return visit.status as string;
  };

  const completedVisits = todayVisits.filter(v => v.status === 'completed').length;
  const totalPlanned = plannedLeads.length || todayVisits.length;
  const remainingVisits = totalPlanned - completedVisits;
  const isPunchedIn = todayAttendance && todayAttendance.punch_in_time && !todayAttendance.punch_out_time;

  // Open Google Maps directions
  const handleNavigate = (lead: Lead) => {
    if (lead.latitude && lead.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`,
        '_blank'
      );
    } else if (lead.villageCity) {
      // Fallback: search by city name
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [lead.name, lead.villageCity, lead.district, lead.state].filter(Boolean).join(', ')
        )}`,
        '_blank'
      );
    }
  };

  const handleStartVisit = (leadId: string) => {
    navigate(`/dashboard/visits/new?leadId=${leadId}`);
  };

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

      {/* Attendance */}
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
      {isAdmin && (
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

      {/* Daily Plan — Planned Visits Route */}
      {plannedLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Today's Route</h2>
            </div>
            <Badge variant="outline" className="text-sm">
              {completedVisits}/{plannedLeads.length} done
            </Badge>
          </div>
          <div className="space-y-2">
            {plannedLeads.map((lead, index) => {
              const visitStatus = getLeadVisitStatus(lead.id);
              const isCompleted = visitStatus === 'completed';
              const isInProgress = visitStatus === 'in_progress';
              const hasLocation = !!(lead.latitude && lead.longitude) || !!lead.villageCity;

              return (
                <Card
                  key={lead.id}
                  className={
                    isCompleted
                      ? 'border-green-200 bg-green-50/30'
                      : isInProgress
                        ? 'border-blue-200 bg-blue-50/30'
                        : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Visit number */}
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isInProgress
                            ? 'bg-blue-600 text-white'
                            : 'bg-primary text-primary-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Lead info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          {lead.villageCity && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              {lead.villageCity}
                              {lead.district && `, ${lead.district}`}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-2">
                          {/* Navigate button — always available if location exists */}
                          {hasLocation && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(lead);
                              }}
                            >
                              <Navigation className="h-4 w-4" />
                              Navigate
                            </Button>
                          )}

                          {/* Start Visit button — only if not already started */}
                          {visitStatus === 'pending' && (
                            <Button
                              size="sm"
                              className="gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartVisit(lead.id);
                              }}
                            >
                              <Play className="h-4 w-4" />
                              Start Visit
                            </Button>
                          )}

                          {isInProgress && (
                            <Badge variant="secondary" className="text-xs">In progress</Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback: No plan — show today's visits or empty state */}
      {plannedLeads.length === 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{isAdmin ? 'My Visits' : "Today's Visits"}</h2>
            <Button size="sm" onClick={() => navigate('/dashboard/visits/new')}>+ New Visit</Button>
          </div>
          {todayVisits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No plan for today</p>
                <Button variant="link" onClick={() => navigate('/dashboard/plan')} className="mt-2">
                  Create a daily plan
                </Button>
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
      )}
    </div>
  );
};

export default TodayPage;
