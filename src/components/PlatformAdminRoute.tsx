import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingStates';

interface PlatformAdminRouteProps {
  children: React.ReactNode;
}

export const PlatformAdminRoute = ({ children }: PlatformAdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkPlatformAdminRole() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'platform_admin'
      });

      if (error) {
        console.error('Error checking platform admin role:', error);
        setIsPlatformAdmin(false);
      } else {
        setIsPlatformAdmin(!!data);
      }
      
      setCheckingRole(false);
    }

    checkPlatformAdminRole();
  }, [user]);

  if (loading || checkingRole) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
