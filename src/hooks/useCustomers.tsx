import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  territory?: string;
  status: 'active' | 'inactive' | 'prospect';
  customer_type?: string;
  company_name?: string;
  industry?: string;
  notes?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  last_visit_date?: string;
  assigned_user_id?: string;
  crm_customer_id?: string;
  last_synced_from_crm?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  territory?: string;
  status?: 'active' | 'inactive' | 'prospect';
  customer_type?: string;
  company_name?: string;
  industry?: string;
  notes?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  assigned_user_id?: string;
}

export const useCustomers = () => {
  const { currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch all customers
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!currentOrganization,
  });

  // Create customer
  const createCustomer = useMutation({
    mutationFn: async (input: CustomerInput) => {
      if (!currentOrganization) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...input,
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    },
  });

  // Update customer
  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    },
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    },
  });

  return {
    customers,
    isLoading,
    error,
    createCustomer: createCustomer.mutate,
    updateCustomer: updateCustomer.mutate,
    deleteCustomer: deleteCustomer.mutate,
    isCreating: createCustomer.isPending,
    isUpdating: updateCustomer.isPending,
    isDeleting: deleteCustomer.isPending,
  };
};

// Hook to get a single customer
export const useCustomer = (id?: string) => {
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });

  return { customer, isLoading, error };
};
