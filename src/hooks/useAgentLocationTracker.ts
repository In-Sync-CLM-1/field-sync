import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

const TRACKING_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function useAgentLocationTracker() {
  const { user, currentOrganization } = useAuthStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !currentOrganization) return;
    if (!navigator.geolocation) return;

    const upsertLocation = (position: GeolocationPosition) => {
      const now = Date.now();
      // Debounce: don't update more than once per 90 seconds
      if (now - lastUpdateRef.current < 90_000) return;
      lastUpdateRef.current = now;

      const { latitude, longitude, accuracy } = position.coords;

      supabase
        .from('agent_locations' as any)
        .upsert(
          {
            user_id: user.id,
            organization_id: currentOrganization.id,
            latitude,
            longitude,
            accuracy,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Location upsert failed:', error);
        });
    };

    const requestLocation = () => {
      navigator.geolocation.getCurrentPosition(upsertLocation, (err) => {
        console.warn('Geolocation error:', err.message);
      }, {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000,
      });
    };

    // Initial capture
    requestLocation();

    // Recurring capture
    intervalRef.current = setInterval(requestLocation, TRACKING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, currentOrganization]);
}
