import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface Branch {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateBranchData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

interface UpdateBranchData extends Partial<CreateBranchData> {
  id: string;
  is_active?: boolean;
  manager_id?: string | null;
}

export function useBranches() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [canManageBranches, setCanManageBranches] = useState(false);

  // Check if user can manage branches (admin roles only)
  useEffect(() => {
    async function checkPermission() {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const canManage = userRoles.some(role => 
        ['admin', 'super_admin', 'platform_admin'].includes(role)
      );
      setCanManageBranches(canManage);
    }
    
    checkPermission();
  }, [user]);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name');
      
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!currentOrganization?.id,
  });

  const createBranch = useMutation({
    mutationFn: async (data: CreateBranchData) => {
      if (!currentOrganization?.id) throw new Error('No organization selected');
      
      const { data: newBranch, error } = await supabase
        .from('branches')
        .insert({
          organization_id: currentOrganization.id,
          ...data,
        })
        .select()
        .single();
      
      if (error) throw error;
      return newBranch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create branch: ${error.message}`);
    },
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...data }: UpdateBranchData) => {
      const { data: updatedBranch, error } = await supabase
        .from('branches')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedBranch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update branch: ${error.message}`);
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete branch: ${error.message}`);
    },
  });

  return {
    branches,
    isLoading,
    createBranch,
    updateBranch,
    deleteBranch,
    canManageBranches,
  };
}
