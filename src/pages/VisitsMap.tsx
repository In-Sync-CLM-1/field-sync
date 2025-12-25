import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useVisits } from '@/hooks/useVisits';
import { format } from 'date-fns';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

export default function VisitsMap() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { visits, isLoading } = useVisits();

  const formatDuration = (checkIn: string, checkOut?: string | null) => {
    if (!checkOut) return 'In progress';
    const duration = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || isLoading) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Filter visits with valid coordinates
    const visitsWithLocation = visits.filter(
      (v) => v.check_in_latitude && v.check_in_longitude
    );

    // Calculate center from visits or use default
    let initialCenter: [number, number] = [78.9629, 20.5937]; // India center
    let initialZoom = 5;

    if (visitsWithLocation.length > 0) {
      const lats = visitsWithLocation.map((v) => v.check_in_latitude!);
      const lngs = visitsWithLocation.map((v) => v.check_in_longitude!);
      initialCenter = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];
      initialZoom = 10;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each visit
    visitsWithLocation.forEach((visit) => {
      const isCompleted = !!visit.check_out_time;
      const markerColor = isCompleted ? '#22c55e' : '#f59e0b'; // green for completed, amber for in-progress

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 180px;">
          <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${visit.lead?.name || 'Unknown Lead'}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
            ${format(new Date(visit.check_in_time), 'PPp')}
          </p>
          <p style="font-size: 12px; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; background: ${isCompleted ? '#dcfce7' : '#fef3c7'}; color: ${isCompleted ? '#166534' : '#92400e'};">
              ${isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
            </span>
            <span style="margin-left: 8px; color: #666;">
              ${formatDuration(visit.check_in_time, visit.check_out_time)}
            </span>
          </p>
          ${visit.notes ? `<p style="font-size: 11px; color: #888; margin-bottom: 8px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${visit.notes}</p>` : ''}
          <button 
            onclick="window.location.href='/visits/${visit.id}'" 
            style="width: 100%; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;"
          >
            View Details
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([visit.check_in_longitude!, visit.check_in_latitude!])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have multiple visits
    if (visitsWithLocation.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      visitsWithLocation.forEach((v) => {
        bounds.extend([v.check_in_longitude!, v.check_in_latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [visits, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading visits map...</p>
        </div>
      </div>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-8rem)]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <h3 className="text-xs font-semibold mb-2">Visit Status</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs">In Progress</span>
          </div>
        </div>
      </div>

      {/* Visit count */}
      <div className="absolute top-4 right-16 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 z-10">
        <span className="text-xs font-medium">
          {visits.filter((v) => v.check_in_latitude && v.check_in_longitude).length} visits on map
        </span>
      </div>
    </div>
  );
}
