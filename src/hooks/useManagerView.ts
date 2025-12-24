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
  leads_target: number;
  leads_actual: number;
  logins_target: number;
  logins_actual: number;
  enroll_target: number;
  enroll_actual: number;
  fi_target: number;
  fi_actual: number;
  db_target: number;
  db_actual: number;
}

interface TeamMemberIncentive {
  user_id: string;
  full_name: string | null;
  total_enrollments: number;
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
          leads_target: 0, leads_actual: 0, 
          logins_target: 0, logins_actual: 0, 
          enroll_target: 0, enroll_actual: 0,
          fi_target: 0, fi_actual: 0,
          db_target: 0, db_actual: 0,
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
          leads_target: 0, leads_actual: 0, 
          logins_target: 0, logins_actual: 0, 
          enroll_target: 0, enroll_actual: 0,
          fi_target: 0, fi_actual: 0,
          db_target: 0, db_actual: 0,
        };
      }

      const teamIds = teamMembers.map(m => m.id);

      // Get plans for team members on this date
      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select('leads_target, leads_actual, logins_target, logins_actual, enroll_target, enroll_actual, fi_target, fi_actual, db_target, db_actual')
        .eq('plan_date', planDate)
        .in('user_id', teamIds);

      if (plansError) throw plansError;

      // Aggregate all values
      const aggregates = (plans || []).reduce((acc, plan) => ({
        leads_target: acc.leads_target + (plan.leads_target || 0),
        leads_actual: acc.leads_actual + (plan.leads_actual || 0),
        logins_target: acc.logins_target + (plan.logins_target || 0),
        logins_actual: acc.logins_actual + (plan.logins_actual || 0),
        enroll_target: acc.enroll_target + (plan.enroll_target || 0),
        enroll_actual: acc.enroll_actual + (plan.enroll_actual || 0),
        fi_target: acc.fi_target + (plan.fi_target || 0),
        fi_actual: acc.fi_actual + (plan.fi_actual || 0),
        db_target: acc.db_target + (plan.db_target || 0),
        db_actual: acc.db_actual + (plan.db_actual || 0),
      }), { 
        leads_target: 0, leads_actual: 0, 
        logins_target: 0, logins_actual: 0, 
        enroll_target: 0, enroll_actual: 0,
        fi_target: 0, fi_actual: 0,
        db_target: 0, db_actual: 0,
      });

      return aggregates;
    },
    enabled: !!user?.id && !!planDate,
  });
}

// Calculate incentive based on enrollments (same logic as useMonthlyIncentive)
const calculateIncentive = (enrollments: number): number => {
  if (enrollments <= 6) return 0;
  if (enrollments === 7) return 1500;
  return 1500 + (enrollments - 7) * 250;
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
        .select('user_id, enroll_actual')
        .in('user_id', teamIds)
        .gte('plan_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('plan_date', format(monthEnd, 'yyyy-MM-dd'));

      if (plansError) throw plansError;

      // Aggregate enrollments per user
      const enrollmentsByUser: Record<string, number> = {};
      (plans || []).forEach(plan => {
        enrollmentsByUser[plan.user_id] = (enrollmentsByUser[plan.user_id] || 0) + (plan.enroll_actual || 0);
      });

      // Build result with incentive calculations
      const result: TeamMemberIncentive[] = teamMembers.map(member => {
        const totalEnrollments = enrollmentsByUser[member.id] || 0;
        const displayName = member.full_name || 
          [member.first_name, member.last_name].filter(Boolean).join(' ') || 
          'Unknown';
        
        return {
          user_id: member.id,
          full_name: displayName,
          total_enrollments: totalEnrollments,
          incentive_earned: calculateIncentive(totalEnrollments),
        };
      });

      // Sort by incentive earned (descending), then by enrollments
      result.sort((a, b) => {
        if (b.incentive_earned !== a.incentive_earned) {
          return b.incentive_earned - a.incentive_earned;
        }
        return b.total_enrollments - a.total_enrollments;
      });

      return result;
    },
    enabled: !!user?.id,
  });
}
