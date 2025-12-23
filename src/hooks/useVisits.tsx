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
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
}

export interface VisitInput {
  customer_id: string;
  check_in_latitude: number;
  check_in_longitude: number;
  notes?: string;
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
          customer:customers!visits_customer_id_fkey (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data as Visit[];
    },
    enabled: !!currentOrganization && !!user,
  });

  const createVisit = useMutation({
    mutationFn: async (input: VisitInput) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('visits')
        .insert({
          ...input,
          organization_id: currentOrganization.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit started successfully');
    },
    onError: (error) => {
      console.error('Error creating visit:', error);
      toast.error('Failed to start visit');
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
        .update(input)
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

  return {
    visits,
    isLoading,
    error,
    createVisit: createVisit.mutate,
    checkOutVisit: checkOutVisit.mutate,
    updateVisit: updateVisit.mutate,
    isCreating: createVisit.isPending,
    isCheckingOut: checkOutVisit.isPending,
    isUpdating: updateVisit.isPending,
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
          customer:customers!visits_customer_id_fkey (
            id,
            name,
            address,
            city,
            phone,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Visit | null;
    },
    enabled: !!id,
  });

  return { visit, isLoading, error };
};
