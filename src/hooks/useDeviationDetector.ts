import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

const DEVIATION_THRESHOLD_KM = 5;
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ScheduledVisit {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

export function useDeviationDetector(attendanceId: string | null | undefined) {
  const { user, currentOrganization } = useAuthStore();
  const consecutiveOffRoute = useRef(0);
  const lastDeviationTime = useRef(0);

  useEffect(() => {
    if (!user || !currentOrganization || !attendanceId) return;
    if (!navigator.geolocation) return;

    let visits: ScheduledVisit[] = [];

    // Fetch today's scheduled visits once
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('visits')
      .select('id, customer_id, customers:customer_id(latitude, longitude)')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .then(({ data }) => {
        visits = (data || []).map((v: any) => ({
          id: v.id,
          latitude: v.customers?.latitude ? Number(v.customers.latitude) : null,
          longitude: v.customers?.longitude ? Number(v.customers.longitude) : null,
        })).filter((v: ScheduledVisit) => v.latitude != null && v.longitude != null);
      });

    const checkDeviation = () => {
      if (visits.length === 0) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          let minDist = Infinity;
          let nearestVisitId: string | null = null;
          
          for (const v of visits) {
            const d = haversine(latitude, longitude, v.latitude!, v.longitude!);
            if (d < minDist) {
              minDist = d;
              nearestVisitId = v.id;
            }
          }

          if (minDist > DEVIATION_THRESHOLD_KM) {
            consecutiveOffRoute.current++;
          } else {
            consecutiveOffRoute.current = 0;
          }

          // Need 2+ consecutive pings off-route AND cooldown passed
          if (
            consecutiveOffRoute.current >= 2 &&
            Date.now() - lastDeviationTime.current > COOLDOWN_MS
          ) {
            lastDeviationTime.current = Date.now();
            supabase
              .from('route_deviations' as any)
              .insert({
                user_id: user.id,
                organization_id: currentOrganization.id,
                attendance_id: attendanceId,
                latitude,
                longitude,
                distance_from_route_km: Math.round(minDist * 100) / 100,
                nearest_visit_id: nearestVisitId,
                detected_at: new Date().toISOString(),
              })
              .then(({ error }) => {
                if (error) console.error('Deviation insert failed:', error);
              });
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
      );
    };

    const interval = setInterval(checkDeviation, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, currentOrganization, attendanceId]);
}
