import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface OrderCollection {
  id: string;
  visit_id: string;
  organization_id: string;
  user_id: string;
  lead_id: string | null;
  type: 'sales_order' | 'payment_collection';
  product_name: string | null;
  product_description: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_mode: string | null;
  payment_reference: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  remarks: string | null;
  status: string;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCollectionInput {
  visit_id: string;
  lead_id?: string;
  type: 'sales_order' | 'payment_collection';
  product_name?: string;
  product_description?: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  payment_mode?: string;
  payment_reference?: string;
  customer_name?: string;
  customer_phone?: string;
  remarks?: string;
}

export const useOrderCollections = (visitId?: string) => {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: orderCollections = [], isLoading } = useQuery({
    queryKey: ['order-collections', visitId],
    queryFn: async () => {
      if (!visitId) return [];
      const { data, error } = await (supabase
        .from('order_collections' as any)
        .select('*')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as OrderCollection[];
    },
    enabled: !!visitId,
  });

  const createOrderCollection = useMutation({
    mutationFn: async (input: OrderCollectionInput) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('order_collections' as any)
        .insert({
          visit_id: input.visit_id,
          organization_id: currentOrganization.id,
          user_id: user.id,
          lead_id: input.lead_id || null,
          type: input.type,
          product_name: input.product_name || null,
          product_description: input.product_description || null,
          quantity: input.quantity || 1,
          unit_price: input.unit_price || 0,
          total_amount: input.total_amount,
          payment_mode: input.payment_mode || null,
          payment_reference: input.payment_reference || null,
          customer_name: input.customer_name || null,
          customer_phone: input.customer_phone || null,
          remarks: input.remarks || null,
        })
        .select()
        .single() as any);

      if (error) throw error;

      // Trigger email notification via edge function
      try {
        await supabase.functions.invoke('send-order-email', {
          body: { order_collection_id: data.id },
        });
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
        // Don't fail the whole operation if email fails
      }

      return data as OrderCollection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order-collections', visitId] });
      const label = data.type === 'sales_order' ? 'Sales order' : 'Payment collection';
      toast.success(`${label} submitted successfully`);
    },
    onError: (error) => {
      console.error('Error creating order/collection:', error);
      toast.error('Failed to submit. Please try again.');
    },
  });

  return {
    orderCollections,
    isLoading,
    createOrderCollection: createOrderCollection.mutate,
    isSubmitting: createOrderCollection.isPending,
  };
};
