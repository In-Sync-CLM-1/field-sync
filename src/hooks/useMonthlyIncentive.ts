import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface MonthlyIncentiveTarget {
  id: string;
  user_id: string;
  organization_id: string;
  target_month: string;
  enrollment_target: number;
  created_at: string;
  updated_at: string;
}

interface MonthlyEnrollmentData {
  totalEnrollments: number;
  incentiveEarned: number;
  baseIncentive: number;
  additionalIncentive: number;
}

// Calculate incentive based on enrollments
// 1-6: ₹0, 7: ₹1500 flat, 8+: ₹1500 + ₹250 per additional beyond 7
export const calculateIncentive = (enrollments: number): { total: number; base: number; additional: number } => {
  if (enrollments <= 6) {
    return { total: 0, base: 0, additional: 0 };
  }
  if (enrollments === 7) {
    return { total: 1500, base: 1500, additional: 0 };
  }
  // 8+: ₹1,500 base + ₹250 for each enrollment beyond 7
  const additional = (enrollments - 7) * 250;
  return { total: 1500 + additional, base: 1500, additional };
};

// Get the first day of a given month
const getMonthStart = (date: Date): string => {
  return format(startOfMonth(date), 'yyyy-MM-dd');
};

// Hook to fetch and manage monthly incentive target
export function useMonthlyIncentiveTarget(month: Date) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const monthStart = getMonthStart(month);

  const { data: target, isLoading } = useQuery({
    queryKey: ['monthly-incentive-target', user?.id, monthStart],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('monthly_incentive_targets')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_month', monthStart)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyIncentiveTarget | null;
    },
    enabled: !!user?.id,
  });

  const upsertTarget = useMutation({
    mutationFn: async (enrollmentTarget: number) => {
      if (!user?.id || !currentOrganization?.id) {
        throw new Error('User or organization not found');
      }

      const { data, error } = await supabase
        .from('monthly_incentive_targets')
        .upsert({
          user_id: user.id,
          organization_id: currentOrganization.id,
          target_month: monthStart,
          enrollment_target: enrollmentTarget,
        }, {
          onConflict: 'user_id,target_month',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['monthly-incentive-target', user?.id, monthStart] 
      });
    },
  });

  return {
    target,
    isLoading,
    upsertTarget,
  };
}

// Hook to calculate monthly enrollments and incentive
export function useMonthlyEnrollments(month: Date) {
  const { user } = useAuth();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-enrollments', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<MonthlyEnrollmentData> => {
      if (!user?.id) {
        return { totalEnrollments: 0, incentiveEarned: 0, baseIncentive: 0, additionalIncentive: 0 };
      }

      const { data, error } = await supabase
        .from('daily_plans')
        .select('enroll_actual')
        .eq('user_id', user.id)
        .gte('plan_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('plan_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalEnrollments = (data || []).reduce((sum, plan) => sum + (plan.enroll_actual || 0), 0);
      const incentive = calculateIncentive(totalEnrollments);

      return {
        totalEnrollments,
        incentiveEarned: incentive.total,
        baseIncentive: incentive.base,
        additionalIncentive: incentive.additional,
      };
    },
    enabled: !!user?.id,
  });

  return {
    data: data || { totalEnrollments: 0, incentiveEarned: 0, baseIncentive: 0, additionalIncentive: 0 },
    isLoading,
  };
}
