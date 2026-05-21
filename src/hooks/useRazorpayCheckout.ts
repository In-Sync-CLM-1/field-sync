import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutOptions {
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const { currentOrganization, user } = useAuthStore();

  const initiateCheckout = async (options?: CheckoutOptions) => {
    if (!currentOrganization) {
      toast.error('No organization found');
      return;
    }

    if (!user?.email) {
      toast.error('User email not found');
      return;
    }

    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      toast.error('Payment system not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);

    try {
      // Call edge function to create subscription
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: {
          organization_id: currentOrganization.id,
          email: user.email,
          name: currentOrganization.name || user.email,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const { subscription_id, key_id, organization_name, user_count, price_per_user } = data;

      // Calculate display amount
      const monthlyAmount = (user_count * price_per_user).toLocaleString('en-IN');

      // Open Razorpay checkout
      const razorpayOptions = {
        key: key_id,
        subscription_id: subscription_id,
        name: 'InSync',
        description: `Pro Plan - ${user_count} user${user_count > 1 ? 's' : ''} @ ₹${price_per_user}/month`,
        prefill: {
          name: organization_name,
          email: user.email,
        },
        notes: {
          organization_id: currentOrganization.id,
        },
        theme: {
          color: '#0891b2', // Primary brand color (cyan-600)
        },
        handler: function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Payment successful! Your subscription is now active.');
          options?.onSuccess?.();
        },
        modal: {
          ondismiss: function () {
            console.log('Checkout dismissed');
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        const errorMessage = response.error?.description || 'Payment failed. Please try again.';
        toast.error(errorMessage);
        options?.onFailure?.(errorMessage);
        setLoading(false);
      });

      razorpay.open();

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout process');
      options?.onFailure?.(error.message);
      setLoading(false);
    }
  };

  return {
    initiateCheckout,
    loading,
  };
}
