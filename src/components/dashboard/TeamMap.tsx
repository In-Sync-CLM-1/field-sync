import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow, Polyline } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Maximize2, Minimize2, Layers } from 'lucide-react';
import { AgentLocation, VisitPin, AgentTrail } from '@/hooks/useTeamMapData';
import { format } from 'date-fns';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

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

// Each rep gets a distinct, stable identity colour so their route line + pin are
// instantly distinguishable on the map ("whose route is that?" at a glance).
// Tuned for legibility on a LIGHT basemap — saturated, mid-dark hues that read
// clearly against pale land/roads.
const AGENT_PALETTE = [
  '#0891b2', // cyan-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#ca8a04', // yellow-600
  '#e11d48', // rose-600
];

// Clean light theme — soft greys, dimmed POIs and transit so the rep routes pop.
const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#eceef1' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8efe6' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcebd6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fdf3e7' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f3d9b5' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfe0ef' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6b9fb5' }] },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: LIGHT_MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 /* RIGHT_BOTTOM */ },
  clickableIcons: false,
  gestureHandling: 'greedy',
  backgroundColor: '#f3f4f6',
};

const centerOffset = (w: number, h: number) => ({ x: -(w / 2), y: -(h / 2) });

interface TeamMapProps {
  agents: AgentLocation[];
  visits: VisitPin[];
  trails?: AgentTrail[];
  loading?: boolean;
}

type Selected =
  | { type: 'agent'; data: AgentLocation }
  | { type: 'visit'; data: VisitPin };

export default function TeamMap({ agents, visits, trails = [], loading }: TeamMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showVisits, setShowVisits] = useState(true);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true); // re-run the fit effect even when data arrived before the map mounted
  }, []);
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Stable identity colour per rep (by name, so it doesn't shuffle between refreshes).
  const colorByUser = useMemo(() => {
    const ids = new Map<string, string>(); // userId -> name
    agents.forEach(a => ids.set(a.userId, a.name));
    trails.forEach(t => { if (!ids.has(t.userId)) ids.set(t.userId, t.name); });
    const ordered = [...ids.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    const map = new Map<string, string>();
    ordered.forEach(([id], i) => map.set(id, AGENT_PALETTE[i % AGENT_PALETTE.length]));
    return map;
  }, [agents, trails]);
  const agentColor = useCallback(
    (userId: string) => colorByUser.get(userId) || '#9ca3af',
    [colorByUser],
  );

  // Fit map to all visible points whenever data, visit toggle, or expand changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !mapReady) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    agents.forEach(a => { bounds.extend({ lat: a.latitude, lng: a.longitude }); hasPoints = true; });
    if (showVisits) {
      visits.forEach(v => { bounds.extend({ lat: v.latitude, lng: v.longitude }); hasPoints = true; });
    }
    trails.forEach(t => t.path.forEach(p => { bounds.extend({ lat: p.lat, lng: p.lng }); hasPoints = true; }));

    // Container size may have just changed (expand/collapse); let it settle first
    const t = setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
      if (hasPoints) {
        map.fitBounds(bounds, 22);
        if (agents.length + (showVisits ? visits.length : 0) === 1) {
          map.setZoom(15);
        } else {
          // Keep the team view tight so individual rep routes stay legible —
          // never fall back to a far-out regional zoom.
          google.maps.event.addListenerOnce(map, 'idle', () => {
            const z = map.getZoom() ?? 13;
            if (z < 12) map.setZoom(12);
            else if (z > 16) map.setZoom(16);
          });
        }
      }
    }, 120);
    return () => clearTimeout(t);
  }, [agents, visits, trails, showVisits, expanded, isLoaded, mapReady]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Map unavailable — Google Maps API key not configured
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${expanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-primary" />
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
        {(loading || !isLoaded) && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className={`w-full transition-all duration-300 ${expanded ? 'h-[calc(100vh-120px)]' : 'h-[450px]'}`}>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={INDIA_CENTER}
              zoom={5}
              options={MAP_OPTIONS}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={() => setSelected(null)}
            >
              {/* Movement trails — each agent's path today, in their own identity colour */}
              {trails.map(trail => {
                const trailColor = agentColor(trail.userId);
                return (
                  <Polyline
                    key={`trail-${trail.userId}`}
                    path={trail.path.map(p => ({ lat: p.lat, lng: p.lng }))}
                    options={{
                      strokeColor: trailColor,
                      strokeOpacity: 0.95,
                      strokeWeight: 4,
                      geodesic: true,
                      icons: [{
                        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.2, strokeColor: trailColor },
                        offset: '100%', repeat: '110px',
                      }],
                    }}
                  />
                );
              })}

              {/* Agent markers — pulsing dots */}
              {agents.map(agent => {
                const color = agentColor(agent.userId);
                return (
                  <OverlayView
                    key={`agent-${agent.id}`}
                    position={{ lat: agent.latitude, lng: agent.longitude }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={centerOffset}
                  >
                    <div
                      style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      onClick={() => setSelected({ type: 'agent', data: agent })}
                    >
                      {/* Live pulse — every active rep reads as real-time. On-visit pulses
                          stronger/faster; available (en route) pulses gently; idle stays still. */}
                      {agent.status !== 'idle' && (
                        <div style={{
                          position: 'absolute', width: 40, height: 40, borderRadius: '50%', background: color,
                          opacity: agent.status === 'on-visit' ? 0.3 : 0.18,
                          animation: `ping ${agent.status === 'on-visit' ? '1.4s' : '2.2s'} cubic-bezier(0,0,0.2,1) infinite`,
                        }} />
                      )}
                      <div style={{
                        width: agent.status === 'idle' ? 12 : 15, height: agent.status === 'idle' ? 12 : 15,
                        borderRadius: '50%', background: agent.status === 'idle' ? '#9ca3af' : color,
                        border: '3px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        position: 'relative', zIndex: 1,
                      }} />
                    </div>
                  </OverlayView>
                );
              })}

              {/* Visit markers — small diamond pins */}
              {showVisits && visits.map(visit => (
                <OverlayView
                  key={`visit-${visit.id}`}
                  position={{ lat: visit.latitude, lng: visit.longitude }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={centerOffset}
                >
                  <div
                    style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setSelected({ type: 'visit', data: visit })}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L14 8L8 15L2 8Z" fill={visit.isActive ? '#f59e0b' : '#6366f1'} stroke="white" strokeWidth="1.5" />
                    </svg>
                  </div>
                </OverlayView>
              ))}

              {/* Popup */}
              {selected && (
                <InfoWindow
                  position={{ lat: selected.data.latitude, lng: selected.data.longitude }}
                  options={{ pixelOffset: new google.maps.Size(0, selected.type === 'agent' ? -18 : -12) }}
                  onCloseClick={() => setSelected(null)}
                >
                  {selected.type === 'agent' ? (
                    <div style={{ fontFamily: 'system-ui', padding: '2px 0' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{selected.data.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColors[selected.data.status], display: 'inline-block' }} />
                        <span style={{ fontSize: 11, color: '#666' }}>{statusLabels[selected.data.status]}</span>
                      </div>
                      {selected.data.accuracy ? (
                        <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Accuracy: {Math.round(selected.data.accuracy)}m</div>
                      ) : null}
                      <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>Updated {format(new Date(selected.data.updatedAt), 'hh:mm a')}</div>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'system-ui', padding: '2px 0' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#111' }}>{selected.data.agentName}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{selected.data.purpose || 'Visit'}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                        {format(new Date(selected.data.checkInTime), 'hh:mm a')}
                        {selected.data.checkOutTime ? ' - ' + format(new Date(selected.data.checkOutTime), 'hh:mm a') : ' (ongoing)'}
                      </div>
                    </div>
                  )}
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        {/* Legend — one colour per rep, so each route line is identifiable at a glance */}
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur rounded-lg px-3 py-2 text-[10px] shadow-sm border max-w-[60%]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {agents.map(a => (
              <span key={a.userId} className="flex items-center gap-1.5">
                <span className="inline-block h-1 w-4 rounded-full" style={{ background: agentColor(a.userId) }} />
                <span className="font-medium">{a.name.split(' ')[0]}</span>
                <span className="text-muted-foreground">· {statusLabels[a.status]}</span>
              </span>
            ))}
            {showVisits && (
              <span className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 16 16"><path d="M8 1L14 8L8 15L2 8Z" fill="#f59e0b" /></svg>
                Visit
              </span>
            )}
          </div>
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
