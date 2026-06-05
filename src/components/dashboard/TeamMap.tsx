import { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow, Polyline } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Maximize2, Minimize2, Layers } from 'lucide-react';
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

// Dark theme to match the previous Mapbox dark style
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: DARK_MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 /* RIGHT_BOTTOM */ },
  clickableIcons: false,
  gestureHandling: 'greedy',
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
        map.fitBounds(bounds, 60);
        if (agents.length + (showVisits ? visits.length : 0) === 1) {
          map.setZoom(14);
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
              {/* Movement trails — each agent's path today */}
              {trails.map(trail => (
                <Polyline
                  key={`trail-${trail.userId}`}
                  path={trail.path.map(p => ({ lat: p.lat, lng: p.lng }))}
                  options={{
                    strokeColor: statusColors[trail.status],
                    strokeOpacity: 0.9,
                    strokeWeight: 3,
                    geodesic: true,
                    icons: [{
                      icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2, strokeColor: statusColors[trail.status] },
                      offset: '100%', repeat: '120px',
                    }],
                  }}
                />
              ))}

              {/* Agent markers — pulsing dots */}
              {agents.map(agent => {
                const color = statusColors[agent.status];
                return (
                  <OverlayView
                    key={`agent-${agent.id}`}
                    position={{ lat: agent.latitude, lng: agent.longitude }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={centerOffset}
                  >
                    <div
                      style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      onClick={() => setSelected({ type: 'agent', data: agent })}
                    >
                      {agent.status === 'on-visit' && (
                        <div style={{ position: 'absolute', width: 36, height: 36, borderRadius: '50%', background: color, opacity: 0.25, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                      )}
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, border: '2.5px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.35)', position: 'relative', zIndex: 1 }} />
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
