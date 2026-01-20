import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface TeamMember {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface TeamAggregates {
  prospects_target: number;
  prospects_actual: number;
  quotes_target: number;
  quotes_actual: number;
  policies_target: number;
  policies_actual: number;
  life_insurance_target: number;
  life_insurance_actual: number;
  health_insurance_target: number;
  health_insurance_actual: number;
}

interface TeamMemberIncentive {
  user_id: string;
  full_name: string | null;
  total_policies: number;
  incentive_earned: number;
}

// Check if current user is a manager (has direct reports)
export function useIsManager() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-manager', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user has any direct reports
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('reporting_manager_id', user.id)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    },
    enabled: !!user?.id,
  });
}

// Get team members who report to the current user
export function useTeamMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name')
        .eq('reporting_manager_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    enabled: !!user?.id,
  });
}

// Get aggregated team targets for a specific date
export function useTeamAggregates(planDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-aggregates', user?.id, planDate],
    queryFn: async (): Promise<TeamAggregates> => {
      if (!user?.id) {
        return { 
          prospects_target: 0, prospects_actual: 0, 
          quotes_target: 0, quotes_actual: 0, 
          policies_target: 0, policies_actual: 0,
          life_insurance_target: 0, life_insurance_actual: 0,
          health_insurance_target: 0, health_insurance_actual: 0,
        };
      }

      // Get team member IDs
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('id')
        .eq('reporting_manager_id', user.id);

      if (teamError) throw teamError;
      if (!teamMembers || teamMembers.length === 0) {
        return { 
          prospects_target: 0, prospects_actual: 0, 
          quotes_target: 0, quotes_actual: 0, 
          policies_target: 0, policies_actual: 0,
          life_insurance_target: 0, life_insurance_actual: 0,
          health_insurance_target: 0, health_insurance_actual: 0,
        };
      }

      const teamIds = teamMembers.map(m => m.id);

      // Get plans for team members on this date
      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('prospects_target, prospects_actual, quotes_target, quotes_actual, policies_target, policies_actual, life_insurance_target, life_insurance_actual, health_insurance_target, health_insurance_actual')
        .eq('plan_date', planDate)
        .in('user_id', teamIds);

      if (plansError) throw plansError;

      // Aggregate all values
      const aggregates = (plans || []).reduce((acc, plan) => ({
        prospects_target: acc.prospects_target + (plan.prospects_target || 0),
        prospects_actual: acc.prospects_actual + (plan.prospects_actual || 0),
        quotes_target: acc.quotes_target + (plan.quotes_target || 0),
        quotes_actual: acc.quotes_actual + (plan.quotes_actual || 0),
        policies_target: acc.policies_target + (plan.policies_target || 0),
        policies_actual: acc.policies_actual + (plan.policies_actual || 0),
        life_insurance_target: acc.life_insurance_target + (plan.life_insurance_target || 0),
        life_insurance_actual: acc.life_insurance_actual + (plan.life_insurance_actual || 0),
        health_insurance_target: acc.health_insurance_target + (plan.health_insurance_target || 0),
        health_insurance_actual: acc.health_insurance_actual + (plan.health_insurance_actual || 0),
      }), { 
        prospects_target: 0, prospects_actual: 0, 
        quotes_target: 0, quotes_actual: 0, 
        policies_target: 0, policies_actual: 0,
        life_insurance_target: 0, life_insurance_actual: 0,
        health_insurance_target: 0, health_insurance_actual: 0,
      });

      return aggregates;
    },
    enabled: !!user?.id && !!planDate,
  });
}

// Calculate incentive based on policies (same logic as useMonthlyIncentive)
const calculateIncentive = (policies: number): number => {
  if (policies <= 6) return 0;
  if (policies === 7) return 1500;
  return 1500 + (policies - 7) * 250;
};

// Get team incentive toppers for the current month
export function useTeamIncentiveToppers(month: Date) {
  const { user } = useAuth();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return useQuery({
    queryKey: ['team-incentive-toppers', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<TeamMemberIncentive[]> => {
      if (!user?.id) return [];

      // Get team members with their names
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name')
        .eq('reporting_manager_id', user.id)
        .eq('is_active', true);

      if (teamError) throw teamError;
      if (!teamMembers || teamMembers.length === 0) return [];

      const teamIds = teamMembers.map(m => m.id);

      // Get all daily plans for the month for team members
      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('user_id, policies_actual')
        .in('user_id', teamIds)
        .gte('plan_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('plan_date', format(monthEnd, 'yyyy-MM-dd'));

      if (plansError) throw plansError;

      // Aggregate policies per user
      const policiesByUser: Record<string, number> = {};
      (plans || []).forEach(plan => {
        policiesByUser[plan.user_id] = (policiesByUser[plan.user_id] || 0) + (plan.policies_actual || 0);
      });

      // Build result with incentive calculations
      const result: TeamMemberIncentive[] = teamMembers.map(member => {
        const totalPolicies = policiesByUser[member.id] || 0;
        const displayName = member.full_name || 
          [member.first_name, member.last_name].filter(Boolean).join(' ') || 
          'Unknown';
        
        return {
          user_id: member.id,
          full_name: displayName,
          total_policies: totalPolicies,
          incentive_earned: calculateIncentive(totalPolicies),
        };
      });

      // Sort by incentive earned (descending), then by policies
      result.sort((a, b) => {
        if (b.incentive_earned !== a.incentive_earned) {
          return b.incentive_earned - a.incentive_earned;
        }
        return b.total_policies - a.total_policies;
      });

      return result;
    },
    enabled: !!user?.id,
  });
}
