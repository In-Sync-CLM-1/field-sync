import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfDay, format } from 'date-fns';

export interface AgentLocation {
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
  status: 'on-visit' | 'available' | 'idle';
}

export interface VisitPin {
  id: string;
  agentName: string;
  latitude: number;
  longitude: number;
  checkInTime: string;
  checkOutTime: string | null;
  purpose: string | null;
  isActive: boolean;
}

export interface AgentDistance {
  userId: string;
  name: string;
  distanceKm: number;
  pointCount: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useTeamMapData() {
  const { currentOrganization } = useAuthStore();
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [visits, setVisits] = useState<VisitPin[]>([]);
  const [distances, setDistances] = useState<AgentDistance[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);

    try {
      const orgId = currentOrganization.id;
      const todayStart = startOfDay(new Date()).toISOString();
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const [profilesRes, locationsRes, visitsTodayRes, attendanceRes, locationHistoryRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('organization_id', orgId).eq('is_active', true),
        supabase.from('agent_locations').select('user_id, latitude, longitude, accuracy, updated_at').eq('organization_id', orgId),
        supabase.from('visits').select('id, user_id, check_in_latitude, check_in_longitude, check_in_time, check_out_time, purpose, status').eq('organization_id', orgId).gte('check_in_time', todayStart),
        supabase.from('attendance').select('user_id, punch_in_time, punch_out_time').eq('organization_id', orgId).eq('date', todayStr),
        supabase.from('location_history').select('user_id, latitude, longitude, recorded_at').eq('organization_id', orgId).gte('recorded_at', todayStart).order('recorded_at', { ascending: true }),
      ]);

      const profiles = profilesRes.data ?? [];
      const locations = locationsRes.data ?? [];
      const visitsToday = visitsTodayRes.data ?? [];
      const attendance = attendanceRes.data ?? [];
      const locationHistory = locationHistoryRes.data ?? [];

      const profileMap = new Map(profiles.map(p => [p.id, p.full_name || 'Unknown']));
      const attendanceMap = new Map(attendance.map(a => [a.user_id, a]));
      const activeVisitUsers = new Set(visitsToday.filter(v => !v.check_out_time).map(v => v.user_id));

      // Agent live locations
      const agentLocations: AgentLocation[] = locations
        .filter(l => profileMap.has(l.user_id))
        .map(l => {
          const att = attendanceMap.get(l.user_id);
          let status: AgentLocation['status'] = 'idle';
          if (activeVisitUsers.has(l.user_id)) status = 'on-visit';
          else if (att?.punch_in_time && !att?.punch_out_time) status = 'available';
          return {
            userId: l.user_id,
            name: profileMap.get(l.user_id)!,
            latitude: l.latitude,
            longitude: l.longitude,
            accuracy: l.accuracy,
            updatedAt: l.updated_at,
            status,
          };
        });

      // Visit pins
      const visitPins: VisitPin[] = visitsToday
        .filter(v => v.check_in_latitude && v.check_in_longitude)
        .map(v => ({
          id: v.id,
          agentName: profileMap.get(v.user_id) || 'Unknown',
          latitude: v.check_in_latitude!,
          longitude: v.check_in_longitude!,
          checkInTime: v.check_in_time,
          checkOutTime: v.check_out_time,
          purpose: v.purpose,
          isActive: !v.check_out_time,
        }));

      // Distance per agent from location_history
      const userPoints = new Map<string, { lat: number; lng: number }[]>();
      for (const h of locationHistory) {
        if (!userPoints.has(h.user_id)) userPoints.set(h.user_id, []);
        userPoints.get(h.user_id)!.push({ lat: h.latitude, lng: h.longitude });
      }

      const agentDistances: AgentDistance[] = [];
      let total = 0;
      for (const [userId, points] of userPoints) {
        let dist = 0;
        for (let i = 1; i < points.length; i++) {
          const d = haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
          if (d < 50) dist += d; // Filter GPS jumps
        }
        const rounded = Math.round(dist * 10) / 10;
        total += rounded;
        agentDistances.push({
          userId,
          name: profileMap.get(userId) || 'Unknown',
          distanceKm: rounded,
          pointCount: points.length,
        });
      }
      agentDistances.sort((a, b) => b.distanceKm - a.distanceKm);

      setAgents(agentLocations);
      setVisits(visitPins);
      setDistances(agentDistances);
      setTotalDistance(Math.round(total * 10) / 10);
    } catch (err) {
      console.error('Team map data error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  return { agents, visits, distances, totalDistance, loading, refresh: fetchData };
}
