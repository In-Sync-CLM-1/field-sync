import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export type ActivityType = 'call' | 'whatsapp' | 'visit' | 'note' | 'status_change' | 'follow_up';

export interface LeadActivity {
  id: string;
  lead_id: string;
  organization_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name?: string;
}

export const useLeadActivities = (leadId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useAuthStore();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await (supabase as any)
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const items = (data || []) as any[];

      // Fetch user names for activities
      const userIds = [...new Set(items.map((a: any) => a.user_id as string))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return items.map((a: any) => ({
        ...a,
        user_name: nameMap.get(a.user_id) || 'Unknown',
      })) as LeadActivity[];
    },
    enabled: !!leadId,
  });

  const createActivity = useMutation({
    mutationFn: async (params: {
      leadId: string;
      activityType: ActivityType;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentOrganization) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('lead_activities')
        .insert({
          lead_id: params.leadId,
          organization_id: currentOrganization.id,
          user_id: user.id,
          activity_type: params.activityType,
          description: params.description || null,
          metadata: params.metadata || {},
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
    onError: (error) => {
      console.error('Failed to log activity:', error);
      toast.error('Failed to log activity');
    },
  });

  return { activities, isLoading, createActivity };
};
