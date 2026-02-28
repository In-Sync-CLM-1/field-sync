import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function HelpWidget() {
  const user = useAuthStore((s) => s.user);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }

    const check = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const roles = data?.map((r) => r.role) || [];
      setIsAdmin(roles.some((r) => ['admin', 'super_admin', 'platform_admin'].includes(r)));
    };
    check();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;

    const script = document.createElement('script');
    script.src = 'https://go-in-sync.lovable.app/help-widget.js';
    script.dataset.source = 'field_force_automation';
    document.body.appendChild(script);

    return () => {
      script.remove();
      // Clean up any widget DOM the script may have injected
      document.querySelectorAll('[data-help-widget]').forEach((el) => el.remove());
    };
  }, [isAdmin]);

  return null;
}
