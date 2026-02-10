import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

mapboxgl.accessToken = 'MAPBOX_TOKEN_REMOVED';

interface RouteReplayMapProps {
  userId: string;
  date: string;
  attendanceId?: string;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export function RouteReplayMap({ userId, date, attendanceId }: RouteReplayMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const { data: points = [] } = useQuery({
    queryKey: ['location_history', userId, date],
    queryFn: async () => {
      let query = supabase
        .from('location_history' as any)
        .select('latitude, longitude, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });
      
      if (attendanceId) {
        query = query.eq('attendance_id', attendanceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as LocationPoint[];
    },
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits_for_replay', userId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('id, check_in_time, check_in_latitude, check_in_longitude, customers:customer_id(name)')
        .eq('user_id', userId)
        .gte('check_in_time', `${date}T00:00:00`)
        .lte('check_in_time', `${date}T23:59:59`);
      if (error) throw error;
      return data || [];
    },
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937], // India center
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw route and markers when points load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    const onLoad = () => {
      const coords = points.map((p) => [p.longitude, p.latitude] as [number, number]);

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 60 });

      // Route line
      if (map.getSource('route')) {
        (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords },
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': 'hsl(var(--primary))',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        });
      }

      // Start marker (green)
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat(coords[0])
        .setPopup(new mapboxgl.Popup().setText('Punch In'))
        .addTo(map);

      // End marker (red) if more than 1 point
      if (coords.length > 1) {
        new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(coords[coords.length - 1])
          .setPopup(new mapboxgl.Popup().setText('Punch Out'))
          .addTo(map);
      }

      // Visit markers (orange)
      visits.forEach((v: any) => {
        if (v.check_in_latitude && v.check_in_longitude) {
          new mapboxgl.Marker({ color: '#f97316' })
            .setLngLat([Number(v.check_in_longitude), Number(v.check_in_latitude)])
            .setPopup(new mapboxgl.Popup().setText(v.customers?.name || 'Visit'))
            .addTo(map);
        }
      });

      // Moving marker
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg';
      markerRef.current = new mapboxgl.Marker(el).setLngLat(coords[0]).addTo(map);
    };

    if (map.loaded()) onLoad();
    else map.on('load', onLoad);
  }, [points, visits]);

  // Animation
  useEffect(() => {
    if (!isPlaying || points.length < 2) return;

    const coords = points.map((p) => [p.longitude, p.latitude] as [number, number]);
    const totalSteps = coords.length - 1;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      progressRef.current += (delta * speed) / (totalSteps * 0.5); // ~0.5s per segment at 1x
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        setIsPlaying(false);
      }

      setProgress(progressRef.current);

      const idx = Math.min(Math.floor(progressRef.current * totalSteps), totalSteps - 1);
      const frac = (progressRef.current * totalSteps) - idx;
      const lng = coords[idx][0] + (coords[idx + 1][0] - coords[idx][0]) * frac;
      const lat = coords[idx][1] + (coords[idx + 1][1] - coords[idx][1]) * frac;

      markerRef.current?.setLngLat([lng, lat]);

      if (progressRef.current < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, speed, points]);

  const togglePlay = () => {
    if (progress >= 1) {
      progressRef.current = 0;
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    setSpeed((s) => (s >= 4 ? 1 : s * 2));
  };

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg text-muted-foreground text-sm">
        No location data available for this date
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg overflow-hidden border border-border" />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={cycleSpeed}>
          <SkipForward className="h-4 w-4 mr-1" /> {speed}x
        </Button>
        <div className="flex-1">
          <Slider
            value={[progress * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => {
              progressRef.current = v / 100;
              setProgress(v / 100);
              if (points.length > 1) {
                const idx = Math.min(Math.floor((v / 100) * (points.length - 1)), points.length - 2);
                const frac = ((v / 100) * (points.length - 1)) - idx;
                const lng = points[idx].longitude + (points[idx + 1].longitude - points[idx].longitude) * frac;
                const lat = points[idx].latitude + (points[idx + 1].latitude - points[idx].latitude) * frac;
                markerRef.current?.setLngLat([lng, lat]);
              }
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[40px]">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
