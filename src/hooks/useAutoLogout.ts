import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

const LOGOUT_HOUR_IST = 22; // 10 PM IST

function getISTHour(): number {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  return Math.floor((istMinutes % 1440) / 60);
}

function getMillisUntilIST(hour: number): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istTarget = new Date(istNow);
  istTarget.setUTCHours(hour - 5, 30, 0, 0); // Convert IST hour back to UTC
  if (istTarget.getTime() <= now.getTime()) {
    istTarget.setDate(istTarget.getDate() + 1);
  }
  return istTarget.getTime() - now.getTime();
}

export function useAutoLogout() {
  const user = useAuthStore((s) => s.user);
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;

    // Check role — only auto-logout agents
    let cancelled = false;

    async function setup() {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);

      const userRoles = roles?.map(r => r.role) || [];
      const isAgent = !userRoles.some(r => ['admin', 'platform_admin'].includes(r));

      if (!isAgent || cancelled) return;

      // If already past 10 PM IST, logout immediately
      if (getISTHour() >= LOGOUT_HOUR_IST) {
        await autoPunchOutAndLogout();
        return;
      }

      // Schedule logout at 10 PM IST
      const ms = getMillisUntilIST(LOGOUT_HOUR_IST);
      timerRef.current = setTimeout(async () => {
        if (!cancelled) await autoPunchOutAndLogout();
      }, ms);
    }

    async function autoPunchOutAndLogout() {
      try {
        // Auto punch-out if still punched in
        if (currentOrganization) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const { data: attendance } = await supabase
            .from('attendance')
            .select('id, punch_in_time, punch_out_time')
            .eq('user_id', user!.id)
            .eq('date', today)
            .maybeSingle();

          if (attendance?.punch_in_time && !attendance?.punch_out_time) {
            const punchOutTime = new Date();
            const punchInMs = new Date(attendance.punch_in_time).getTime();
            const totalHours = Math.round(((punchOutTime.getTime() - punchInMs) / 3600000) * 100) / 100;

            await supabase
              .from('attendance')
              .update({
                punch_out_time: punchOutTime.toISOString(),
                status: 'completed',
                total_hours: totalHours,
              })
              .eq('id', attendance.id);
          }
        }
      } catch (err) {
        console.error('Auto punch-out failed:', err);
      }

      await supabase.auth.signOut();
    }

    setup();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.id, currentOrganization?.id]);
}
