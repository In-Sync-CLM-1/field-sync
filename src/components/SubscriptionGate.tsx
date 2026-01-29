import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user, currentOrganization, setCurrentOrganization } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user's profile to find their organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organization_id) {
          setLoading(false);
          return;
        }

        // Fetch fresh organization data to check subscription status
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (error) {
          console.error('Error fetching organization:', error);
          setLoading(false);
          return;
        }

        // Update the current organization in store with fresh data
        if (org) {
          setCurrentOrganization(org);
          
          // Check if subscription is expired
          const expired = org.subscription_status === 'expired';
          setIsExpired(expired);
        }
      } catch (error) {
        console.error('Subscription check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, setCurrentOrganization]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to expired page if subscription is expired
  if (isExpired) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}
