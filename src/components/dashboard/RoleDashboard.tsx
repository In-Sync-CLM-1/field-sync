import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import HQDashboard from './HQDashboard';
import ManagerDashboard from './ManagerDashboard';
import AgentDashboard from './AgentDashboard';

type DashboardTier = 'hq' | 'manager' | 'agent';

export default function RoleDashboard() {
  const { user } = useAuth();
  const [tier, setTier] = useState<DashboardTier | null>(null);

  useEffect(() => {
    async function detectRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map((r) => r.role) || [];

      if (
        userRoles.includes('platform_admin') ||
        userRoles.includes('super_admin') ||
        userRoles.includes('admin')
      ) {
        setTier('hq');
      } else if (userRoles.includes('branch_manager')) {
        setTier('manager');
      } else {
        setTier('agent');
      }
    }
    detectRole();
  }, [user]);

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

  switch (tier) {
    case 'hq':
      return <HQDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'agent':
      return <AgentDashboard />;
  }
}
