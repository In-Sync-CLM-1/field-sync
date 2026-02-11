import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfToday, format, differenceInMinutes } from 'date-fns';

export interface TeamAgent {
  id: string;
  name: string;
  visitsToday: number;
  status: 'active' | 'idle';
  lastCheckIn: string | null;
  attendanceStatus: 'punched_in' | 'punched_out' | 'absent';
}

export interface TeamTargetProgress {
  prospectsTarget: number;
  prospectsActual: number;
  quotesTarget: number;
  quotesActual: number;
  salesTarget: number;
  salesActual: number;
}

export function useTeamDashboard() {
  const { user, currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['team-dashboard', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return null;

      const todayStart = startOfToday();
      const todayString = format(todayStart, 'yyyy-MM-dd');

      // Get agents reporting to this manager
      const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, is_active')
        .eq('organization_id', currentOrganization.id)
        .eq('reporting_manager_id', user.id)
        .eq('is_active', true);

      if (!agents || agents.length === 0) {
        return {
          totalAgents: 0,
          activeAgents: 0,
          visitsToday: 0,
          attendanceRate: 0,
          planCompletion: 0,
          agents: [],
          targetProgress: { prospectsTarget: 0, prospectsActual: 0, quotesTarget: 0, quotesActual: 0, salesTarget: 0, salesActual: 0 },
          visitStatusBreakdown: { completed: 0, inProgress: 0, cancelled: 0 },
        };
      }

      const agentIds = agents.map(a => a.id);

      // Get visits today for all agents
      const { data: visitsData } = await supabase
        .from('visits')
        .select('user_id, check_out_time, status')
        .in('user_id', agentIds)
        .gte('check_in_time', todayStart.toISOString());

      // Get attendance today
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('user_id, punch_in_time, punch_out_time, status')
        .in('user_id', agentIds)
        .eq('date', todayString);

      // Get daily plans today for target progress
      const { data: plansData } = await supabase
        .from('daily_plans')
        .select('user_id, prospects_target, prospects_actual, quotes_target, quotes_actual, policies_target, policies_actual')
        .in('user_id', agentIds)
        .eq('plan_date', todayString);

      // Build agent details
      const agentDetails: TeamAgent[] = agents.map(agent => {
        const agentVisits = visitsData?.filter(v => v.user_id === agent.id) || [];
        const agentAttendance = attendanceData?.find(a => a.user_id === agent.id);
        const hasVisitsToday = agentVisits.length > 0;
        const isPunchedIn = agentAttendance?.punch_in_time && !agentAttendance?.punch_out_time;

        return {
          id: agent.id,
          name: agent.full_name || 'Unknown',
          visitsToday: agentVisits.length,
          status: (hasVisitsToday || isPunchedIn) ? 'active' : 'idle',
          lastCheckIn: agentVisits.length > 0 ? 'Today' : null,
          attendanceStatus: isPunchedIn ? 'punched_in' : agentAttendance ? 'punched_out' : 'absent',
        };
      });

      // Aggregate target progress
      const targetProgress: TeamTargetProgress = {
        prospectsTarget: plansData?.reduce((s, p) => s + (p.prospects_target || 0), 0) || 0,
        prospectsActual: plansData?.reduce((s, p) => s + (p.prospects_actual || 0), 0) || 0,
        quotesTarget: plansData?.reduce((s, p) => s + (p.quotes_target || 0), 0) || 0,
        quotesActual: plansData?.reduce((s, p) => s + (p.quotes_actual || 0), 0) || 0,
        salesTarget: plansData?.reduce((s, p) => s + (p.policies_target || 0), 0) || 0,
        salesActual: plansData?.reduce((s, p) => s + (p.policies_actual || 0), 0) || 0,
      };

      // Visit status breakdown
      const completed = visitsData?.filter(v => v.check_out_time).length || 0;
      const inProgress = visitsData?.filter(v => !v.check_out_time).length || 0;
      const cancelled = visitsData?.filter(v => v.status === 'cancelled').length || 0;

      const activeAgents = agentDetails.filter(a => a.status === 'active').length;
      const attendedAgents = attendanceData?.length || 0;
      const attendanceRate = agents.length > 0 ? Math.round((attendedAgents / agents.length) * 100) : 0;

      const totalTarget = targetProgress.prospectsTarget + targetProgress.quotesTarget + targetProgress.salesTarget;
      const totalActual = targetProgress.prospectsActual + targetProgress.quotesActual + targetProgress.salesActual;
      const planCompletion = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

      return {
        totalAgents: agents.length,
        activeAgents,
        visitsToday: visitsData?.length || 0,
        attendanceRate,
        planCompletion,
        agents: agentDetails,
        targetProgress,
        visitStatusBreakdown: { completed, inProgress, cancelled },
      };
    },
    enabled: !!user && !!currentOrganization,
  });
}
