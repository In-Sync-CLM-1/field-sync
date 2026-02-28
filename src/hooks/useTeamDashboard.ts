import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfToday, startOfWeek, startOfMonth, endOfWeek, endOfMonth, format } from 'date-fns';
import { DashboardPeriod } from '@/components/dashboard/DashboardViewControl';

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

function getDateRange(period: DashboardPeriod) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfToday(), dateString: format(startOfToday(), 'yyyy-MM-dd') };
    case 'week':
      return { start: startOfWeek(now), dateString: format(startOfWeek(now), 'yyyy-MM-dd') };
    case 'month':
      return { start: startOfMonth(now), dateString: format(startOfMonth(now), 'yyyy-MM-dd') };
  }
}

export function useTeamDashboard(period: DashboardPeriod = 'today') {
  const { user, currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['team-dashboard', user?.id, currentOrganization?.id, period],
    queryFn: async () => {
      if (!user || !currentOrganization) return null;

      const { start, dateString } = getDateRange(period);
      const todayString = format(startOfToday(), 'yyyy-MM-dd');

      const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, is_active')
        .eq('organization_id', currentOrganization.id)
        .eq('reporting_manager_id', user.id)
        .eq('is_active', true);

      if (!agents || agents.length === 0) {
        return {
          totalAgents: 0, activeAgents: 0, visitsToday: 0, attendanceRate: 0, planCompletion: 0,
          agents: [], targetProgress: { prospectsTarget: 0, prospectsActual: 0, quotesTarget: 0, quotesActual: 0, salesTarget: 0, salesActual: 0 },
          visitStatusBreakdown: { completed: 0, inProgress: 0, cancelled: 0 },
        };
      }

      const agentIds = agents.map(a => a.id);

      const { data: visitsData } = await supabase
        .from('visits')
        .select('user_id, check_out_time, status')
        .in('user_id', agentIds)
        .gte('check_in_time', start.toISOString());

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('user_id, punch_in_time, punch_out_time, status')
        .in('user_id', agentIds)
        .eq('date', todayString);

      const { data: plansData } = await supabase
        .from('daily_plans')
        .select('user_id, prospects_target, prospects_actual, quotes_target, quotes_actual, policies_target, policies_actual')
        .in('user_id', agentIds)
        .gte('plan_date', dateString);

      const agentDetails: TeamAgent[] = agents.map(agent => {
        const agentVisits = visitsData?.filter(v => v.user_id === agent.id) || [];
        const agentAttendance = attendanceData?.find(a => a.user_id === agent.id);
        const hasVisits = agentVisits.length > 0;
        const isPunchedIn = agentAttendance?.punch_in_time && !agentAttendance?.punch_out_time;

        return {
          id: agent.id,
          name: agent.full_name || 'Unknown',
          visitsToday: agentVisits.length,
          status: (hasVisits || isPunchedIn) ? 'active' : 'idle',
          lastCheckIn: hasVisits ? 'Today' : null,
          attendanceStatus: isPunchedIn ? 'punched_in' : agentAttendance ? 'punched_out' : 'absent',
        };
      });

      const targetProgress: TeamTargetProgress = {
        prospectsTarget: plansData?.reduce((s, p) => s + (p.prospects_target || 0), 0) || 0,
        prospectsActual: plansData?.reduce((s, p) => s + (p.prospects_actual || 0), 0) || 0,
        quotesTarget: plansData?.reduce((s, p) => s + (p.quotes_target || 0), 0) || 0,
        quotesActual: plansData?.reduce((s, p) => s + (p.quotes_actual || 0), 0) || 0,
        salesTarget: plansData?.reduce((s, p) => s + (p.policies_target || 0), 0) || 0,
        salesActual: plansData?.reduce((s, p) => s + (p.policies_actual || 0), 0) || 0,
      };

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
        totalAgents: agents.length, activeAgents, visitsToday: visitsData?.length || 0,
        attendanceRate, planCompletion, agents: agentDetails, targetProgress,
        visitStatusBreakdown: { completed, inProgress, cancelled },
      };
    },
    enabled: !!user && !!currentOrganization,
  });
}
