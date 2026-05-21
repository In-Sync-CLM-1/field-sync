import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface DailyPlan {
  id: string;
  user_id: string;
  organization_id: string;
  plan_date: string;
  prospects_target: number;
  quotes_target: number;
  policies_target: number;
  prospects_actual: number;
  quotes_actual: number;
  policies_actual: number;
  life_insurance_target: number | null;
  health_insurance_target: number | null;
  life_insurance_actual: number | null;
  health_insurance_actual: number | null;
  status: string;
  corrected_by: string | null;
  original_values: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    reporting_manager_id: string | null;
  };
}

export interface CreatePlanInput {
  plan_date: string;
  prospects_target: number;
  quotes_target: number;
  policies_target: number;
  life_insurance_target?: number;
  health_insurance_target?: number;
}

export interface UpdatePlanInput {
  id: string;
  prospects_target?: number;
  quotes_target?: number;
  policies_target?: number;
  life_insurance_target?: number;
  health_insurance_target?: number;
  prospects_actual?: number;
  quotes_actual?: number;
  policies_actual?: number;
  life_insurance_actual?: number;
  health_insurance_actual?: number;
  status?: string;
}

// Hook for agent's own plan
export function useMyPlan(planDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-plan', 'my', planDate],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', planDate)
        .maybeSingle();

      if (error) throw error;
      return data as DailyPlan | null;
    },
    enabled: !!user && !!planDate,
  });
}

// Hook for team plans (manager view)
export function useTeamPlans(planDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-plans', 'team', planDate],
    queryFn: async () => {
      if (!user) return [];

      // Get plans from direct reports
      const { data, error } = await supabase
        .from('daily_plans')
        .select(`
          *,
          user:profiles!daily_plans_user_id_fkey(
            id,
            full_name,
            first_name,
            last_name,
            reporting_manager_id
          )
        `)
        .eq('plan_date', planDate);

      if (error) throw error;
      return (data || []) as DailyPlan[];
    },
    enabled: !!user && !!planDate,
  });
}

// Hook for organization plans (admin view)
export function useOrgPlans(planDate: string) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['daily-plans', 'org', planDate, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];

      const { data, error } = await supabase
        .from('daily_plans')
        .select(`
          *,
          user:profiles!daily_plans_user_id_fkey(
            id,
            full_name,
            first_name,
            last_name,
            reporting_manager_id
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('plan_date', planDate);

      if (error) throw error;
      return (data || []) as DailyPlan[];
    },
    enabled: !!user && !!planDate && !!currentOrganization,
  });
}

// Hook for getting managers with their aggregated data
export function useManagersWithPlans(planDate: string) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['managers-plans', planDate, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];

      // Get all plans for the date
      const { data: plans, error: plansError } = await supabase
        .from('daily_plans')
        .select(`
          *,
          user:profiles!daily_plans_user_id_fkey(
            id,
            full_name,
            first_name,
            last_name,
            reporting_manager_id
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('plan_date', planDate);

      if (plansError) throw plansError;

      return { plans: (plans || []) as DailyPlan[] };
    },
    enabled: !!user && !!planDate && !!currentOrganization,
  });
}

// Create plan mutation
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      if (!user || !currentOrganization) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('daily_plans')
        .insert({
          user_id: user.id,
          organization_id: currentOrganization.id,
          plan_date: input.plan_date,
          prospects_target: input.prospects_target,
          quotes_target: input.quotes_target,
          policies_target: input.policies_target,
          life_insurance_target: input.life_insurance_target || 0,
          health_insurance_target: input.health_insurance_target || 0,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan', 'my', variables.plan_date] });
      queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
      toast.success('Plan saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save plan: ' + error.message);
    },
  });
}

// Update plan mutation
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePlanInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('daily_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
      queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
      toast.success('Plan updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update plan: ' + error.message);
    },
  });
}

// Correct plan mutation (for managers)
export function useCorrectPlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdatePlanInput & { original: DailyPlan }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { id, original, ...updates } = input;
      
      const { data, error } = await supabase
        .from('daily_plans')
        .update({
          prospects_target: updates.prospects_target,
          quotes_target: updates.quotes_target,
          policies_target: updates.policies_target,
          corrected_by: user.id,
          original_values: JSON.parse(JSON.stringify({
            prospects_target: original.prospects_target,
            quotes_target: original.quotes_target,
            policies_target: original.policies_target,
          })),
          status: 'corrected',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
      queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
      toast.success('Plan corrected successfully');
    },
    onError: (error) => {
      toast.error('Failed to correct plan: ' + error.message);
    },
  });
}
