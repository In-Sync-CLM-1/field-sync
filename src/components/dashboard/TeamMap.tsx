import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Maximize2, Minimize2, Layers } from 'lucide-react';
import { AgentLocation, VisitPin } from '@/hooks/useTeamMapData';
import { format } from 'date-fns';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const statusColors: Record<AgentLocation['status'], string> = {
  'on-visit': '#22c55e',
  'available': '#3b82f6',
  'idle': '#9ca3af',
};

const statusLabels: Record<AgentLocation['status'], string> = {
  'on-visit': 'On Visit',
  'available': 'Available',
  'idle': 'Absent',
};

interface TeamMapProps {
  agents: AgentLocation[];
  visits: VisitPin[];
  loading?: boolean;
}

export default function TeamMap({ agents, visits, loading }: TeamMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showVisits, setShowVisits] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 20.5937], // India center
      zoom: 4.5,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    // Agent markers — pulsing dots
    agents.forEach(agent => {
      const color = statusColors[agent.status];

      const el = document.createElement('div');
      el.className = 'agent-marker';
      el.innerHTML = `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          ${agent.status === 'on-visit' ? `<div style="position:absolute;width:36px;height:36px;border-radius:50%;background:${color};opacity:0.25;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
          <div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);position:relative;z-index:1;"></div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '200px' })
        .setHTML(`
          <div style="font-family:system-ui;padding:2px 0;">
            <div style="font-weight:600;font-size:13px;color:#111;">${agent.name}</div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
              <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>
              <span style="font-size:11px;color:#666;">${statusLabels[agent.status]}</span>
            </div>
            ${agent.accuracy ? `<div style="font-size:10px;color:#999;margin-top:2px;">Accuracy: ${Math.round(agent.accuracy)}m</div>` : ''}
            <div style="font-size:10px;color:#999;margin-top:1px;">Updated ${format(new Date(agent.updatedAt), 'hh:mm a')}</div>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([agent.longitude, agent.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
      bounds.extend([agent.longitude, agent.latitude]);
      hasPoints = true;
    });

    // Visit markers — small diamond pins
    if (showVisits) {
      visits.forEach(visit => {
        const isActive = visit.isActive;
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 8L8 15L2 8Z" fill="${isActive ? '#f59e0b' : '#6366f1'}" stroke="white" stroke-width="1.5"/>
            </svg>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false, maxWidth: '180px' })
          .setHTML(`
            <div style="font-family:system-ui;padding:2px 0;">
              <div style="font-weight:600;font-size:12px;color:#111;">${visit.agentName}</div>
              <div style="font-size:11px;color:#555;">${visit.purpose || 'Visit'}</div>
              <div style="font-size:10px;color:#999;margin-top:2px;">${format(new Date(visit.checkInTime), 'hh:mm a')}${visit.checkOutTime ? ' - ' + format(new Date(visit.checkOutTime), 'hh:mm a') : ' (ongoing)'}</div>
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([visit.longitude, visit.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([visit.longitude, visit.latitude]);
        hasPoints = true;
      });
    }

    // Fit to bounds
    if (hasPoints) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    }
  }, [agents, visits, showVisits]);

  // Resize on expand/collapse
  useEffect(() => {
    setTimeout(() => map.current?.resize(), 100);
  }, [expanded]);

  if (!MAPBOX_TOKEN) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Map unavailable — Mapbox token not configured
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${expanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Map className="h-4 w-4 text-primary" />
          Live Team Map
          {agents.filter(a => a.status === 'on-visit').length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-green-500/15 text-green-600">
              {agents.filter(a => a.status === 'on-visit').length} on visit
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant={showVisits ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-[10px]"
            onClick={() => setShowVisits(!showVisits)}
          >
            <Layers className="h-3 w-3 mr-1" />
            Visits
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div
          ref={mapContainer}
          className={`w-full transition-all duration-300 ${expanded ? 'h-[calc(100vh-120px)]' : 'h-[450px]'}`}
        />
        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] shadow-sm border">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> On Visit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" /> Absent
          </span>
          {showVisits && (
            <span className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16"><path d="M8 1L14 8L8 15L2 8Z" fill="#6366f1" /></svg>
              Visit
            </span>
          )}
        </div>
      </CardContent>
      {/* Inject pulse animation */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </Card>
  );
}
