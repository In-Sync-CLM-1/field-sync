import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface TeamMemberPerformance {
  id: string;
  name: string;
  prospectsTarget: number;
  prospectsActual: number;
  quotesTarget: number;
  quotesActual: number;
  policiesTarget: number;
  policiesActual: number;
  incentive: number;
  isActive: boolean;
}

interface DailyTrend {
  date: string;
  policies: number;
}

interface IncentiveTopper {
  id: string;
  name: string;
  policies: number;
  incentive: number;
  rank: number;
}

// Incentive calculation (same formula as useMonthlyIncentive)
export const calculateIncentive = (policies: number): number => {
  if (policies < 7) return 0;
  if (policies === 7) return 1500;
  return 1500 + (policies - 7) * 250;
};

export const useBranchAnalytics = (month: Date) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  // Fetch team members reporting to current user
  const { data: teamMembers, isLoading: loadingTeam } = useQuery({
    queryKey: ['branch-team-members'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_active')
        .eq('reporting_manager_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch performance data for all team members
  const { data: teamPerformance, isLoading: loadingPerformance } = useQuery({
    queryKey: ['branch-team-performance', monthStart, monthEnd, teamMembers?.map(m => m.id)],
    enabled: !!teamMembers && teamMembers.length > 0,
    queryFn: async () => {
      if (!teamMembers || teamMembers.length === 0) return [];

      const teamIds = teamMembers.map(m => m.id);

      const { data: plans, error } = await supabase
        .from('daily_plans')
        .select('user_id, prospects_target, prospects_actual, quotes_target, quotes_actual, policies_target, policies_actual')
        .in('user_id', teamIds)
        .gte('plan_date', monthStart)
        .lte('plan_date', monthEnd);

      if (error) throw error;

      // Aggregate by user
      const userAggregates: Record<string, {
        prospectsTarget: number;
        prospectsActual: number;
        quotesTarget: number;
        quotesActual: number;
        policiesTarget: number;
        policiesActual: number;
      }> = {};

      teamIds.forEach(id => {
        userAggregates[id] = {
          prospectsTarget: 0,
          prospectsActual: 0,
          quotesTarget: 0,
          quotesActual: 0,
          policiesTarget: 0,
          policiesActual: 0
        };
      });

      (plans || []).forEach(plan => {
        if (userAggregates[plan.user_id]) {
          userAggregates[plan.user_id].prospectsTarget += plan.prospects_target || 0;
          userAggregates[plan.user_id].prospectsActual += plan.prospects_actual || 0;
          userAggregates[plan.user_id].quotesTarget += plan.quotes_target || 0;
          userAggregates[plan.user_id].quotesActual += plan.quotes_actual || 0;
          userAggregates[plan.user_id].policiesTarget += plan.policies_target || 0;
          userAggregates[plan.user_id].policiesActual += plan.policies_actual || 0;
        }
      });

      const performance: TeamMemberPerformance[] = teamMembers.map(member => ({
        id: member.id,
        name: member.full_name || 'Unknown',
        ...userAggregates[member.id],
        incentive: calculateIncentive(userAggregates[member.id].policiesActual),
        isActive: member.is_active
      }));

      return performance.sort((a, b) => b.policiesActual - a.policiesActual);
    }
  });

  // Fetch policy trend for last 30 days
  const { data: policyTrend, isLoading: loadingTrend } = useQuery({
    queryKey: ['branch-policy-trend', teamMembers?.map(m => m.id)],
    enabled: !!teamMembers && teamMembers.length > 0,
    queryFn: async () => {
      if (!teamMembers || teamMembers.length === 0) return [];

      const teamIds = teamMembers.map(m => m.id);
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: plans, error } = await supabase
        .from('daily_plans')
        .select('plan_date, policies_actual')
        .in('user_id', teamIds)
        .gte('plan_date', thirtyDaysAgo)
        .lte('plan_date', today)
        .order('plan_date', { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const dateAggregates: Record<string, number> = {};
      (plans || []).forEach(plan => {
        const date = plan.plan_date;
        dateAggregates[date] = (dateAggregates[date] || 0) + (plan.policies_actual || 0);
      });

      const trend: DailyTrend[] = Object.entries(dateAggregates)
        .map(([date, policies]) => ({ date, policies }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trend;
    }
  });

  // Calculate incentive toppers
  const incentiveToppers: IncentiveTopper[] = (teamPerformance || [])
    .filter(m => m.policiesActual > 0)
    .slice(0, 10)
    .map((member, index) => ({
      id: member.id,
      name: member.name,
      policies: member.policiesActual,
      incentive: member.incentive,
      rank: index + 1
    }));

  // Calculate aggregate KPIs
  const totalPolicies = (teamPerformance || []).reduce((sum, m) => sum + m.policiesActual, 0);
  const totalPoliciesTarget = (teamPerformance || []).reduce((sum, m) => sum + m.policiesTarget, 0);
  const overallAchievement = totalPoliciesTarget > 0 ? Math.round((totalPolicies / totalPoliciesTarget) * 100) : 0;
  const totalIncentive = (teamPerformance || []).reduce((sum, m) => sum + m.incentive, 0);
  const activeSalesOfficers = teamMembers?.length || 0;

  return {
    teamPerformance: teamPerformance || [],
    policyTrend: policyTrend || [],
    incentiveToppers,
    kpis: {
      totalPolicies,
      overallAchievement,
      totalIncentive,
      activeSalesOfficers
    },
    isLoading: loadingTeam || loadingPerformance || loadingTrend
  };
};
