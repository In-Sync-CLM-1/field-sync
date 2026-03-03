import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { BranchPerformance } from '@/hooks/usePerformanceReview';

interface MapViewTabProps {
  branches: BranchPerformance[];
}

export function MapViewTab({ branches }: MapViewTabProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { currentOrganization } = useAuthStore();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [78.9629, 20.5937],
      zoom: 4,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', () => loadData());

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      loadData();
    }
  }, [selectedBranch, showHeatmap, showPins]);

  async function loadData() {
    if (!map.current || !currentOrganization) return;
    setLoading(true);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch visits with coordinates
    let query = supabase
      .from('visits')
      .select('id, user_id, check_in_latitude, check_in_longitude, status, check_in_time')
      .eq('organization_id', currentOrganization.id)
      .not('check_in_latitude', 'is', null)
      .not('check_in_longitude', 'is', null)
      .gte('check_in_time', monthStart);

    const { data: visits } = await query;

    // Filter by branch if needed
    let filteredVisits = visits || [];
    if (selectedBranch !== 'all') {
      const { data: branchUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('branch_id', selectedBranch)
        .eq('organization_id', currentOrganization.id);
      const branchUserIds = new Set((branchUsers || []).map(u => u.id));
      filteredVisits = filteredVisits.filter(v => branchUserIds.has(v.user_id));
    }

    const mapInstance = map.current;

    // Clean existing layers
    ['visit-heatmap', 'visit-pins', 'visit-pins-label'].forEach(id => {
      if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
    });
    if (mapInstance.getSource('visit-points')) mapInstance.removeSource('visit-points');

    // Build GeoJSON
    const features: GeoJSON.Feature[] = filteredVisits.map(v => ({
      type: 'Feature',
      properties: { status: v.status },
      geometry: { type: 'Point', coordinates: [v.check_in_longitude!, v.check_in_latitude!] },
    }));

    mapInstance.addSource('visit-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    if (showHeatmap) {
      mapInstance.addLayer({
        id: 'visit-heatmap',
        type: 'heatmap',
        source: 'visit-points',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(1,184,170,0)',
            0.2, 'rgba(1,184,170,0.3)',
            0.4, 'rgba(53,153,184,0.5)',
            0.6, 'rgba(242,200,15,0.7)',
            0.8, 'rgba(166,105,153,0.85)',
            1, 'rgba(187,74,74,1)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 15, 30],
          'heatmap-opacity': 0.8,
        },
      });
    }

    if (showPins) {
      mapInstance.addLayer({
        id: 'visit-pins',
        type: 'circle',
        source: 'visit-points',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'completed'], 'hsl(174, 99%, 36%)',
            ['==', ['get', 'status'], 'cancelled'], 'hsl(0, 43%, 51%)',
            'hsl(48, 93%, 50%)',
          ],
          'circle-radius': 5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': showHeatmap ? 0.6 : 1,
        },
      });
    }

    // Add branch markers
    branches.forEach(branch => {
      const cityCoords: Record<string, [number, number]> = {
        'Mumbai': [72.8777, 19.076],
        'New Delhi': [77.209, 28.6139],
        'Bangalore': [77.5946, 12.9716],
      };
      const coords = cityCoords[branch.city || ''] || [78.9629, 20.5937];

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding:6px;min-width:140px;">
          <h4 style="font-weight:600;font-size:13px;margin-bottom:4px;">${branch.branchName}</h4>
          <div style="font-size:11px;color:#666;">
            <div>Agents: ${branch.activeAgents}</div>
            <div>Visits: ${branch.visitsMonth}</div>
            <div>Sales: ${branch.achievementPct}%</div>
            <div>Attendance: ${branch.attendanceRate}%</div>
          </div>
        </div>
      `);

      const el = document.createElement('div');
      el.style.cssText = 'width:24px;height:24px;background:hsl(174,99%,36%);border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;';

      new mapboxgl.Marker(el).setLngLat(coords).setPopup(popup).addTo(mapInstance);
    });

    // Fit bounds
    if (features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(f => bounds.extend((f.geometry as any).coordinates));
      mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-4">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.branchId} value={b.branchId}>{b.branchName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} id="heatmap" />
            <Label htmlFor="heatmap" className="text-xs">Heatmap</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={showPins} onCheckedChange={setShowPins} id="pins" />
            <Label htmlFor="pins" className="text-xs">Pins</Label>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <Skeleton className="h-8 w-32" />
            </div>
          )}
          <div ref={mapContainer} className="h-[450px] rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
