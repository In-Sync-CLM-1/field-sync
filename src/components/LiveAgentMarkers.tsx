import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface AgentLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
  user_name: string;
}

interface LiveAgentMarkersProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
}

export function LiveAgentMarkers({ map, mapLoaded }: LiveAgentMarkersProps) {
  const { user, currentOrganization } = useAuthStore();
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAgentLocations = async () => {
    if (!user || !currentOrganization) return;

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('agent_locations' as any)
      .select('user_id, latitude, longitude, accuracy, updated_at')
      .eq('organization_id', currentOrganization.id)
      .gte('updated_at', thirtyMinAgo);

    if (error) {
      console.error('Error fetching agent locations:', error);
      return;
    }

    if (!data || data.length === 0) {
      setAgents([]);
      return;
    }

    // Fetch names for these users
    const userIds = (data as any[]).map((d: any) => d.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    const nameMap = new Map(profiles?.map(p => [p.id, p.full_name || 'Unknown']) || []);

    setAgents(
      (data as any[]).map((loc: any) => ({
        ...loc,
        user_name: nameMap.get(loc.user_id) || 'Unknown',
      }))
    );
  };

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchAgentLocations();
    intervalRef.current = setInterval(fetchAgentLocations, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, currentOrganization]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel('agent-locations-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_locations',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          // Refetch on any change
          fetchAgentLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization]);

  // Render markers on map
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    agents.forEach(agent => {
      // Skip current user
      if (agent.user_id === user?.id) return;

      const minutesAgo = Math.round((Date.now() - new Date(agent.updated_at).getTime()) / 60000);
      const isStale = minutesAgo > 15;

      // Pulsing blue dot element
      const el = document.createElement('div');
      el.style.cssText = `
        width: 18px; height: 18px; border-radius: 50%;
        background: ${isStale ? '#94a3b8' : '#3b82f6'};
        border: 3px solid white;
        box-shadow: 0 0 0 ${isStale ? '0' : '6px'} rgba(59,130,246,0.3);
        cursor: pointer;
        ${isStale ? '' : 'animation: pulse-ring 2s ease-out infinite;'}
      `;

      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
        <div style="padding: 8px; min-width: 160px;">
          <div style="font-size: 10px; color: #3b82f6; font-weight: 600; margin-bottom: 4px;">LIVE AGENT</div>
          <h3 style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">${agent.user_name}</h3>
          <div style="font-size: 12px; color: ${isStale ? '#ef4444' : '#10b981'};">
            ${isStale ? '⚠️' : '🟢'} ${formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([agent.longitude, agent.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [agents, map, mapLoaded, user]);

  return null;
}
