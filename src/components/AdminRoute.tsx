import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingStates';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      // Check if user has admin, super_admin, or platform_admin role
      const { data: isAdminRole, error: adminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      const { data: isSuperAdminRole, error: superAdminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      const { data: isPlatformAdminRole, error: platformAdminError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'platform_admin'
      });

      if (adminError || superAdminError || platformAdminError) {
        console.error('Error checking admin role:', adminError || superAdminError || platformAdminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdminRole || !!isSuperAdminRole || !!isPlatformAdminRole);
      }
      
      setCheckingRole(false);
    }

    checkAdminRole();
  }, [user]);

  if (loading || checkingRole) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
