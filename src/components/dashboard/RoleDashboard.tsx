import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import AgentDashboard from './AgentDashboard';
import AdminDashboard from './AdminDashboard';
import PlatformDashboard from '@/pages/PlatformDashboard';

type DashboardTier = 'platform' | 'admin' | 'agent';

export default function RoleDashboard() {
  const { user } = useAuth();
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin);
  const [tier, setTier] = useState<DashboardTier | null>(null);

  useEffect(() => {
    async function detectRole() {
      if (!user) return;

      if (isPlatformAdmin) {
        setTier('platform');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map((r) => r.role) || [];

      if (userRoles.includes('platform_admin')) {
        setTier('platform');
      } else if (
        userRoles.some(r => ['admin', 'super_admin', 'branch_manager'].includes(r))
      ) {
        setTier('admin');
      } else {
        setTier('agent');
      }
    }
    detectRole();
  }, [user, isPlatformAdmin]);

  if (!tier) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (tier === 'platform') {
    return <PlatformDashboard />;
  }

  if (tier === 'admin') {
    return <AdminDashboard />;
  }

  return <AgentDashboard />;
}
