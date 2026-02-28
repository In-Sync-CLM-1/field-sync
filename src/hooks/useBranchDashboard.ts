import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfToday, startOfWeek, startOfMonth, endOfWeek, endOfMonth, subDays, format } from 'date-fns';
import { DashboardPeriod } from '@/components/dashboard/DashboardViewControl';

export interface BranchPerformance {
  id: string;
  name: string;
  agentCount: number;
  visitsToday: number;
  attendanceRate: number;
  planAchievement: number;
}

export interface RecentOrgVisit {
  id: string;
  agentName: string;
  customerName: string;
  branchName: string;
  checkInTime: string;
}

function getDateRange(period: DashboardPeriod) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfToday(), end: now, dateString: format(startOfToday(), 'yyyy-MM-dd') };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now), dateString: format(startOfWeek(now), 'yyyy-MM-dd') };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now), dateString: format(startOfMonth(now), 'yyyy-MM-dd') };
  }
}

export function useBranchDashboard(period: DashboardPeriod = 'today') {
  const { currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['branch-dashboard', currentOrganization?.id, period],
    queryFn: async () => {
      if (!currentOrganization) return null;

      const { start, dateString } = getDateRange(period);
      const todayString = format(startOfToday(), 'yyyy-MM-dd');

      // Get all branches
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name, is_active')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      // Get all active profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, branch_id, is_active')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      // Get visits in period
      const { data: visitsInPeriod } = await supabase
        .from('visits')
        .select('id, user_id, check_in_time, check_out_time, customer_id')
        .eq('organization_id', currentOrganization.id)
        .gte('check_in_time', start.toISOString());

      // Get yesterday's visits for comparison
      const yesterdayStart = subDays(startOfToday(), 1);
      const { count: yesterdayVisitCount } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .gte('check_in_time', yesterdayStart.toISOString())
        .lt('check_in_time', startOfToday().toISOString());

      // Get attendance today (always today for attendance)
      const { data: attendanceToday } = await supabase
        .from('attendance')
        .select('user_id, status')
        .eq('organization_id', currentOrganization.id)
        .eq('date', todayString);

      // Get daily plans in period
      const { data: plansInPeriod } = await supabase
        .from('daily_plans')
        .select('user_id, prospects_target, prospects_actual, quotes_target, quotes_actual, policies_target, policies_actual')
        .eq('organization_id', currentOrganization.id)
        .gte('plan_date', dateString);

      // Build branch performance
      const branchPerformance: BranchPerformance[] = (branches || []).map(branch => {
        const branchAgents = profiles?.filter(p => p.branch_id === branch.id) || [];
        const branchAgentIds = branchAgents.map(a => a.id);
        const branchVisits = visitsInPeriod?.filter(v => branchAgentIds.includes(v.user_id)) || [];
        const branchAttendance = attendanceToday?.filter(a => branchAgentIds.includes(a.user_id)) || [];
        const branchPlans = plansInPeriod?.filter(p => branchAgentIds.includes(p.user_id)) || [];

        const totalTarget = branchPlans.reduce((s, p) => s + (p.prospects_target || 0) + (p.quotes_target || 0) + (p.policies_target || 0), 0);
        const totalActual = branchPlans.reduce((s, p) => s + (p.prospects_actual || 0) + (p.quotes_actual || 0) + (p.policies_actual || 0), 0);

        return {
          id: branch.id,
          name: branch.name,
          agentCount: branchAgents.length,
          visitsToday: branchVisits.length,
          attendanceRate: branchAgents.length > 0 ? Math.round((branchAttendance.length / branchAgents.length) * 100) : 0,
          planAchievement: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0,
        };
      });

      // Recent visits across org (last 10)
      const { data: recentVisitsRaw } = await supabase
        .from('visits')
        .select(`id, user_id, check_in_time, leads:customer_id (name)`)
        .eq('organization_id', currentOrganization.id)
        .order('check_in_time', { ascending: false })
        .limit(10);

      const recentVisits: RecentOrgVisit[] = (recentVisitsRaw || []).map(v => {
        const agent = profiles?.find(p => p.id === v.user_id);
        const branch = branches?.find(b => b.id === agent?.branch_id);
        const lead = v.leads as unknown as { name: string } | null;
        return {
          id: v.id,
          agentName: agent?.full_name || 'Unknown',
          customerName: lead?.name || 'Unknown',
          branchName: branch?.name || 'Unassigned',
          checkInTime: v.check_in_time,
        };
      });

      const totalAgents = profiles?.length || 0;
      const totalActiveAgents = attendanceToday?.length || 0;
      const totalVisits = visitsInPeriod?.length || 0;
      const overallAttendance = totalAgents > 0 ? Math.round((totalActiveAgents / totalAgents) * 100) : 0;

      const totalOrgTarget = plansInPeriod?.reduce((s, p) => s + (p.prospects_target || 0) + (p.quotes_target || 0) + (p.policies_target || 0), 0) || 0;
      const totalOrgActual = plansInPeriod?.reduce((s, p) => s + (p.prospects_actual || 0) + (p.quotes_actual || 0) + (p.policies_actual || 0), 0) || 0;
      const overallAchievement = totalOrgTarget > 0 ? Math.round((totalOrgActual / totalOrgTarget) * 100) : 0;

      return {
        totalAgents,
        totalActiveAgents,
        totalVisits,
        yesterdayVisits: yesterdayVisitCount ?? 0,
        overallAttendance,
        overallAchievement,
        branches: branchPerformance,
        recentVisits,
      };
    },
    enabled: !!currentOrganization,
  });
}
