import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface Visit {
  id: string;
  organization_id: string;
  user_id: string;
  customer_id: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude?: number;
  check_out_longitude?: number;
  notes?: string;
  purpose?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  status: string;
  cancelled_at?: string;
  cancel_reason?: string;
  rescheduled_from?: string;
  checklist?: ChecklistItem[];
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    name: string;
    village_city?: string;
    district?: string;
    mobile_no?: string;
    policy_type_category?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface ChecklistItem {
  label: string;
  required: boolean;
  completed: boolean;
}

export interface VisitInput {
  customer_id: string;
  check_in_latitude: number;
  check_in_longitude: number;
  notes?: string;
  purpose?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  checklist?: ChecklistItem[];
  updateLeadLocation?: boolean;
  target_user_id?: string; // Create visit on behalf of another user (manager/admin)
}

export interface BulkVisitInput {
  customer_ids: string[];
  scheduled_date: string;
  scheduled_time?: string;
  purpose?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  target_user_id?: string;
}

export interface ChecklistTemplate {
  id: string;
  organization_id: string;
  name: string;
  items: { label: string; required: boolean }[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVisits = () => {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading, error } = useQuery({
    queryKey: ['visits', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization || !user) return [];

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          lead:leads!visits_customer_id_fkey (
            id,
            name,
            latitude,
            longitude
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return (data as any[]).map(v => ({
        ...v,
        checklist: v.checklist as ChecklistItem[] | undefined,
      })) as Visit[];
    },
    enabled: !!currentOrganization && !!user,
  });

  const createVisitMutation = useMutation({
    mutationFn: async (input: VisitInput) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      const isScheduled = !!input.scheduled_date;
      const { data, error } = await supabase
        .from('visits')
        .insert({
          customer_id: input.customer_id,
          check_in_latitude: input.check_in_latitude,
          check_in_longitude: input.check_in_longitude,
          notes: input.notes,
          purpose: input.purpose,
          scheduled_date: input.scheduled_date,
          scheduled_time: input.scheduled_time,
          status: isScheduled ? 'scheduled' : 'in_progress',
          checklist: input.checklist as any,
          organization_id: currentOrganization.id,
          user_id: input.target_user_id || user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (input.updateLeadLocation) {
        await supabase
          .from('leads')
          .update({
            latitude: input.check_in_latitude,
            longitude: input.check_in_longitude,
          })
          .eq('id', input.customer_id);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit created successfully');
    },
    onError: (error) => {
      console.error('Error creating visit:', error);
      toast.error('Failed to create visit');
    },
  });

  const bulkCreateVisits = useMutation({
    mutationFn: async (input: BulkVisitInput) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      const records = input.customer_ids.map(cid => ({
        customer_id: cid,
        check_in_latitude: 0,
        check_in_longitude: 0,
        notes: input.notes,
        purpose: input.purpose,
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time,
        status: 'scheduled' as const,
        checklist: input.checklist as any,
        organization_id: currentOrganization.id,
        user_id: input.target_user_id || user.id,
      }));

      const { data, error } = await supabase
        .from('visits')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success(`${data.length} visits scheduled successfully`);
    },
    onError: (error) => {
      console.error('Error bulk creating visits:', error);
      toast.error('Failed to schedule visits');
    },
  });

  const checkOutVisit = useMutation({
    mutationFn: async ({
      id,
      latitude,
      longitude,
      notes,
    }: {
      id: string;
      latitude: number;
      longitude: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          notes,
          status: 'completed',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit completed successfully');
    },
    onError: (error) => {
      console.error('Error checking out:', error);
      toast.error('Failed to complete visit');
    },
  });

  const updateVisit = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Visit> & { id: string }) => {
      const { data, error } = await supabase
        .from('visits')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit updated successfully');
    },
    onError: (error) => {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    },
  });

  const rescheduleVisit = useMutation({
    mutationFn: async ({
      originalId,
      newDate,
      newTime,
      reason,
    }: {
      originalId: string;
      newDate: string;
      newTime?: string;
      reason?: string;
    }) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      // Get original visit
      const { data: original, error: fetchErr } = await supabase
        .from('visits')
        .select('*')
        .eq('id', originalId)
        .single();

      if (fetchErr) throw fetchErr;

      // Mark original as rescheduled
      await supabase
        .from('visits')
        .update({ status: 'rescheduled' })
        .eq('id', originalId);

      // Create new visit linked to original
      const { data: newVisit, error: createErr } = await supabase
        .from('visits')
        .insert({
          customer_id: original.customer_id,
          check_in_latitude: 0,
          check_in_longitude: 0,
          scheduled_date: newDate,
          scheduled_time: newTime,
          purpose: original.purpose,
          notes: reason ? `Rescheduled: ${reason}` : original.notes,
          status: 'scheduled',
          rescheduled_from: originalId,
          checklist: original.checklist,
          organization_id: original.organization_id,
          user_id: original.user_id,
        })
        .select()
        .single();

      if (createErr) throw createErr;
      return newVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit rescheduled successfully');
    },
    onError: (error) => {
      console.error('Error rescheduling visit:', error);
      toast.error('Failed to reschedule visit');
    },
  });

  const cancelVisit = useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit cancelled');
    },
    onError: (error) => {
      console.error('Error cancelling visit:', error);
      toast.error('Failed to cancel visit');
    },
  });

  return {
    visits,
    isLoading,
    error,
    createVisit: createVisitMutation.mutate,
    bulkCreateVisits: bulkCreateVisits.mutate,
    checkOutVisit: checkOutVisit.mutate,
    updateVisit: updateVisit.mutate,
    rescheduleVisit: rescheduleVisit.mutate,
    cancelVisit: cancelVisit.mutate,
    isCreating: createVisitMutation.isPending,
    isBulkCreating: bulkCreateVisits.isPending,
    isCheckingOut: checkOutVisit.isPending,
    isUpdating: updateVisit.isPending,
    isRescheduling: rescheduleVisit.isPending,
    isCancelling: cancelVisit.isPending,
  };
};

export const useVisit = (id?: string) => {
  const { data: visit, isLoading, error } = useQuery({
    queryKey: ['visit', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          lead:leads!visits_customer_id_fkey (
            id,
            name,
            village_city,
            district,
            mobile_no,
            policy_type_category,
            latitude,
            longitude
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? {
        ...data,
        checklist: data.checklist as unknown as ChecklistItem[] | undefined,
      } as Visit : null;
    },
    enabled: !!id,
  });

  return { visit, isLoading, error };
};

export const useChecklistTemplates = () => {
  const { currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['checklist-templates', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('visit_checklist_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return (data as any[]).map(t => ({
        ...t,
        items: t.items as { label: string; required: boolean }[],
      })) as ChecklistTemplate[];
    },
    enabled: !!currentOrganization,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; items: { label: string; required: boolean }[] }) => {
      if (!currentOrganization) throw new Error('No organization');
      const { data, error } = await supabase
        .from('visit_checklist_templates')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          items: input.items as any,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template created');
    },
    onError: () => toast.error('Failed to create template'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('visit_checklist_templates')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
  };
};
