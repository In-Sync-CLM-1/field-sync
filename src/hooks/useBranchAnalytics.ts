import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface TeamMemberPerformance {
  id: string;
  name: string;
  leadsTarget: number;
  leadsActual: number;
  loginsTarget: number;
  loginsActual: number;
  enrollTarget: number;
  enrollActual: number;
  incentive: number;
  isActive: boolean;
}

interface DailyTrend {
  date: string;
  enrollments: number;
}

interface IncentiveTopper {
  id: string;
  name: string;
  enrollments: number;
  incentive: number;
  rank: number;
}

// Incentive calculation (same formula as useMonthlyIncentive)
export const calculateIncentive = (enrollments: number): number => {
  if (enrollments < 7) return 0;
  if (enrollments === 7) return 1500;
  return 1500 + (enrollments - 7) * 250;
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
        .select('user_id, leads_target, leads_actual, logins_target, logins_actual, enroll_target, enroll_actual')
        .in('user_id', teamIds)
        .gte('plan_date', monthStart)
        .lte('plan_date', monthEnd);

      if (error) throw error;

      // Aggregate by user
      const userAggregates: Record<string, {
        leadsTarget: number;
        leadsActual: number;
        loginsTarget: number;
        loginsActual: number;
        enrollTarget: number;
        enrollActual: number;
      }> = {};

      teamIds.forEach(id => {
        userAggregates[id] = {
          leadsTarget: 0,
          leadsActual: 0,
          loginsTarget: 0,
          loginsActual: 0,
          enrollTarget: 0,
          enrollActual: 0
        };
      });

      (plans || []).forEach(plan => {
        if (userAggregates[plan.user_id]) {
          userAggregates[plan.user_id].leadsTarget += plan.leads_target || 0;
          userAggregates[plan.user_id].leadsActual += plan.leads_actual || 0;
          userAggregates[plan.user_id].loginsTarget += plan.logins_target || 0;
          userAggregates[plan.user_id].loginsActual += plan.logins_actual || 0;
          userAggregates[plan.user_id].enrollTarget += plan.enroll_target || 0;
          userAggregates[plan.user_id].enrollActual += plan.enroll_actual || 0;
        }
      });

      const performance: TeamMemberPerformance[] = teamMembers.map(member => ({
        id: member.id,
        name: member.full_name || 'Unknown',
        ...userAggregates[member.id],
        incentive: calculateIncentive(userAggregates[member.id].enrollActual),
        isActive: member.is_active
      }));

      return performance.sort((a, b) => b.enrollActual - a.enrollActual);
    }
  });

  // Fetch enrollment trend for last 30 days
  const { data: enrollmentTrend, isLoading: loadingTrend } = useQuery({
    queryKey: ['branch-enrollment-trend', teamMembers?.map(m => m.id)],
    enabled: !!teamMembers && teamMembers.length > 0,
    queryFn: async () => {
      if (!teamMembers || teamMembers.length === 0) return [];

      const teamIds = teamMembers.map(m => m.id);
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: plans, error } = await supabase
        .from('daily_plans')
        .select('plan_date, enroll_actual')
        .in('user_id', teamIds)
        .gte('plan_date', thirtyDaysAgo)
        .lte('plan_date', today)
        .order('plan_date', { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const dateAggregates: Record<string, number> = {};
      (plans || []).forEach(plan => {
        const date = plan.plan_date;
        dateAggregates[date] = (dateAggregates[date] || 0) + (plan.enroll_actual || 0);
      });

      const trend: DailyTrend[] = Object.entries(dateAggregates)
        .map(([date, enrollments]) => ({ date, enrollments }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trend;
    }
  });

  // Calculate incentive toppers
  const incentiveToppers: IncentiveTopper[] = (teamPerformance || [])
    .filter(m => m.enrollActual > 0)
    .slice(0, 10)
    .map((member, index) => ({
      id: member.id,
      name: member.name,
      enrollments: member.enrollActual,
      incentive: member.incentive,
      rank: index + 1
    }));

  // Calculate aggregate KPIs
  const totalEnrollments = (teamPerformance || []).reduce((sum, m) => sum + m.enrollActual, 0);
  const totalEnrollTarget = (teamPerformance || []).reduce((sum, m) => sum + m.enrollTarget, 0);
  const overallAchievement = totalEnrollTarget > 0 ? Math.round((totalEnrollments / totalEnrollTarget) * 100) : 0;
  const totalIncentive = (teamPerformance || []).reduce((sum, m) => sum + m.incentive, 0);
  const activeSalesOfficers = teamMembers?.length || 0;

  return {
    teamPerformance: teamPerformance || [],
    enrollmentTrend: enrollmentTrend || [],
    incentiveToppers,
    kpis: {
      totalEnrollments,
      overallAchievement,
      totalIncentive,
      activeSalesOfficers
    },
    isLoading: loadingTeam || loadingPerformance || loadingTrend
  };
};
