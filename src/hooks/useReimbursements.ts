import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface TravelReimbursement {
  id: string;
  organization_id: string;
  user_id: string;
  attendance_id: string | null;
  claim_date: string;
  distance_km: number;
  rate_per_km: number;
  calculated_amount: number;
  visit_ids: string[];
  route_summary: string | null;
  status: 'submitted' | 'recommended' | 'approved' | 'rejected';
  recommended_by: string | null;
  recommended_at: string | null;
  manager_remarks: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  agent_name?: string;
  agent_email?: string;
}

export interface ReimbursementInput {
  claim_date: string;
  distance_km: number;
  rate_per_km: number;
  calculated_amount: number;
  attendance_id?: string;
  visit_ids?: string[];
  route_summary?: string;
}

// Calculate distance between two GPS points using Haversine formula
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate total distance from a series of visit check-in points
export function calculateTotalDistance(
  visits: Array<{ check_in_latitude: number; check_in_longitude: number }>
): number {
  if (visits.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < visits.length; i++) {
    total += haversineDistance(
      visits[i - 1].check_in_latitude, visits[i - 1].check_in_longitude,
      visits[i].check_in_latitude, visits[i].check_in_longitude
    );
  }
  return Math.round(total * 100) / 100;
}

export const useMyReimbursements = () => {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ['my-reimbursements', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization || !user) return [];
      const { data, error } = await (supabase
        .from('travel_reimbursements' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .order('claim_date', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as TravelReimbursement[];
    },
    enabled: !!currentOrganization && !!user,
  });

  const createReimbursement = useMutation({
    mutationFn: async (input: ReimbursementInput) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('travel_reimbursements' as any)
        .insert({
          organization_id: currentOrganization.id,
          user_id: user.id,
          attendance_id: input.attendance_id || null,
          claim_date: input.claim_date,
          distance_km: input.distance_km,
          rate_per_km: input.rate_per_km,
          calculated_amount: input.calculated_amount,
          visit_ids: input.visit_ids || [],
          route_summary: input.route_summary || null,
          status: 'submitted',
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data as TravelReimbursement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reimbursements'] });
      toast.success('Reimbursement claim submitted');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('A claim already exists for this date');
      } else {
        toast.error('Failed to submit claim');
      }
    },
  });

  return {
    reimbursements,
    isLoading,
    createReimbursement: createReimbursement.mutate,
    isSubmitting: createReimbursement.isPending,
  };
};

export const useTeamReimbursements = () => {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ['team-reimbursements', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !user) return [];

      // Get direct reports
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('reporting_manager_id', user.id);

      const reportIds = reports?.map(r => r.id) || [];
      if (reportIds.length === 0) return [];

      const { data, error } = await (supabase
        .from('travel_reimbursements' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('user_id', reportIds)
        .in('status', ['submitted'])
        .order('claim_date', { ascending: false }) as any);

      if (error) throw error;

      // Fetch agent names
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map((r: any) => ({
        ...r,
        agent_name: profileMap.get(r.user_id)?.full_name || 'Unknown',
        agent_email: profileMap.get(r.user_id)?.email || '',
      })) as TravelReimbursement[];
    },
    enabled: !!currentOrganization && !!user,
  });

  const recommendReimbursement = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'recommended',
          recommended_by: user.id,
          recommended_at: new Date().toISOString(),
          manager_remarks: remarks || null,
        })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-reimbursements'] });
      toast.success('Reimbursement recommended');
    },
    onError: () => toast.error('Failed to recommend'),
  });

  const bulkRecommend = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'recommended',
          recommended_by: user.id,
          recommended_at: new Date().toISOString(),
        })
        .in('id', ids) as any);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['team-reimbursements'] });
      toast.success(`${ids.length} claims recommended`);
    },
    onError: () => toast.error('Failed to recommend claims'),
  });

  return {
    reimbursements,
    isLoading,
    recommendReimbursement: recommendReimbursement.mutate,
    bulkRecommend: bulkRecommend.mutate,
    isRecommending: recommendReimbursement.isPending,
    isBulkRecommending: bulkRecommend.isPending,
  };
};

export const useAdminReimbursements = () => {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ['admin-reimbursements', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization || !user) return [];

      const { data, error } = await (supabase
        .from('travel_reimbursements' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('claim_date', { ascending: false }) as any);

      if (error) throw error;

      // Fetch agent names
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map((r: any) => ({
        ...r,
        agent_name: profileMap.get(r.user_id)?.full_name || 'Unknown',
        agent_email: profileMap.get(r.user_id)?.email || '',
      })) as TravelReimbursement[];
    },
    enabled: !!currentOrganization && !!user,
  });

  const approveReimbursement = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reimbursements'] });
      toast.success('Reimbursement approved');
    },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectReimbursement = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'rejected',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reimbursements'] });
      toast.success('Reimbursement rejected');
    },
    onError: () => toast.error('Failed to reject'),
  });

  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', ids) as any);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reimbursements'] });
      toast.success(`${ids.length} claims approved`);
    },
    onError: () => toast.error('Failed to approve claims'),
  });

  const bulkReject = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase
        .from('travel_reimbursements' as any)
        .update({
          status: 'rejected',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .in('id', ids) as any);
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reimbursements'] });
      toast.success(`${ids.length} claims rejected`);
    },
    onError: () => toast.error('Failed to reject claims'),
  });

  return {
    reimbursements,
    isLoading,
    approveReimbursement: approveReimbursement.mutate,
    rejectReimbursement: rejectReimbursement.mutate,
    bulkApprove: bulkApprove.mutate,
    bulkReject: bulkReject.mutate,
    isApproving: approveReimbursement.isPending,
    isRejecting: rejectReimbursement.isPending,
    isBulkApproving: bulkApprove.isPending,
    isBulkRejecting: bulkReject.isPending,
  };
};
