import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

const TRACKING_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function useLocationHistory(attendanceId: string | null | undefined) {
  const { user, currentOrganization } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !currentOrganization || !attendanceId) return;
    if (!navigator.geolocation) return;

    const recordLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          supabase
            .from('location_history' as any)
            .insert({
              user_id: user.id,
              organization_id: currentOrganization.id,
              attendance_id: attendanceId,
              latitude,
              longitude,
              accuracy,
              recorded_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) console.error('Location history insert failed:', error);
            });
        },
        (err) => console.warn('Geolocation error:', err.message),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
      );
    };

    // Initial capture
    recordLocation();

    // Recurring capture
    intervalRef.current = setInterval(recordLocation, TRACKING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, currentOrganization, attendanceId]);
}
