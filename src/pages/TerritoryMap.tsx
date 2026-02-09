import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, MapPin, Route, ArrowLeft } from 'lucide-react';
import { NearbyPlacesPanel } from '@/components/NearbyPlacesPanel';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Visit {
  id: string;
  customer_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  notes: string | null;
  user_name?: string;
}


interface TeamMember {
  id: string;
  full_name: string;
}

export default function TerritoryMap() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const { user, currentOrganization } = useAuthStore();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'sales_officer' | 'branch_manager' | 'admin'>('sales_officer');
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check user role for hierarchy-based visibility
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
      
      // Determine effective role for map visibility
      if (userRoles.includes('platform_admin') || userRoles.includes('super_admin') || userRoles.includes('admin')) {
        setUserRole('admin');
      } else if (userRoles.includes('branch_manager') || userRoles.includes('manager') || userRoles.includes('sales_manager')) {
        setUserRole('branch_manager');
      } else {
        setUserRole('sales_officer');
      }
    };

    checkUserRole();
  }, [user]);

  // Fetch team members based on role
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (userRole === 'sales_officer' || !user || !currentOrganization) return;

      let query = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', currentOrganization.id);

      // Branch managers see their direct reports, admins see everyone
      if (userRole === 'branch_manager') {
        query = query.eq('reporting_manager_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      setTeamMembers(data || []);
    };

    fetchTeamMembers();
  }, [userRole, user, currentOrganization]);

  // Initialize map with user location
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = 'MAPBOX_TOKEN_REMOVED';

    mapboxgl.accessToken = mapboxToken;

    // Default center (will be updated with user location)
    let initialCenter: [number, number] = [78.9629, 20.5937]; // India center as fallback
    let initialZoom = 4;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true
    });
    map.current.addControl(geolocateControl, 'top-right');

    // Trigger geolocate after map is fully loaded
    geolocateControl.on('geolocate', (e: GeolocationPosition) => {
      map.current?.flyTo({
        center: [e.coords.longitude, e.coords.latitude],
        zoom: 12, // ~20km radius visible
        duration: 1500
      });
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      // Trigger geolocation automatically after a short delay
      setTimeout(() => {
        geolocateControl.trigger();
      }, 100);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Fetch visits based on filters
  useEffect(() => {
    const fetchVisits = async () => {
      if (!user || !currentOrganization) return;

      setLoading(true);

      let query = supabase
        .from('visits')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .not('check_in_latitude', 'is', null)
        .not('check_in_longitude', 'is', null);

      if (dateFrom) {
        query = query.gte('check_in_time', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('check_in_time', endOfDay.toISOString());
      }

      // Filter by user based on role hierarchy
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      } else if (userRole === 'sales_officer') {
        // Sales officers only see their own visits
        query = query.eq('user_id', user.id);
      } else if (userRole === 'branch_manager') {
        // Branch managers see their team + their own visits
        const teamIds = teamMembers.map(m => m.id);
        teamIds.push(user.id);
        query = query.in('user_id', teamIds);
      }
      // Admins see all visits in the organization (no additional filter needed)

      const { data: visitsData, error } = await query;

      if (error) {
        console.error('Error fetching visits:', error);
        toast.error('Failed to load visits');
        setLoading(false);
        return;
      }

      // Fetch user names for the visits
      if (visitsData && visitsData.length > 0) {
        const userIds = [...new Set(visitsData.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]));

        const visitsWithNames = visitsData.map(visit => ({
          ...visit,
          user_name: profilesMap.get(visit.user_id) || 'Unknown User'
        }));

        setVisits(visitsWithNames);
      } else {
        setVisits([]);
      }

      setLoading(false);
    };

    fetchVisits();
  }, [user, currentOrganization, selectedUser, dateFrom, dateTo, userRole, teamMembers]);


  // Set up map event handlers once when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Click on cluster to zoom
    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id;
      const source = mapInstance.getSource('visits-cluster') as mapboxgl.GeoJSONSource;
      if (!source) return;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        mapInstance.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom ?? 14
        });
      });
    };

    // Click on unclustered visit to show popup
    const handleVisitClick = (e: mapboxgl.MapMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = feature.properties;
      
      new mapboxgl.Popup({ offset: 15 })
        .setLngLat(coords)
        .setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <div style="font-size: 10px; color: ${props?.completed ? '#10b981' : '#f59e0b'}; font-weight: 600; margin-bottom: 4px;">VISIT</div>
            <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${props?.userName}</h3>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
              <strong>Check-in:</strong> ${props?.checkInTime ? format(new Date(props.checkInTime), 'PPp') : 'N/A'}
            </div>
            ${props?.checkOutTime ? `
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                <strong>Check-out:</strong> ${format(new Date(props.checkOutTime), 'PPp')}
              </div>
            ` : '<div style="font-size: 14px; color: #f59e0b; margin-bottom: 4px;">Still in progress</div>'}
            ${props?.notes ? `<div style="font-size: 14px; color: #6b7280; margin-top: 8px;"><strong>Notes:</strong> ${props.notes}</div>` : ''}
          </div>
        `)
        .addTo(mapInstance);
    };

    const setCursorPointer = () => { mapInstance.getCanvas().style.cursor = 'pointer'; };
    const setCursorDefault = () => { mapInstance.getCanvas().style.cursor = ''; };

    mapInstance.on('click', 'clusters', handleClusterClick);
    mapInstance.on('click', 'unclustered-visits', handleVisitClick);
    mapInstance.on('mouseenter', 'clusters', setCursorPointer);
    mapInstance.on('mouseleave', 'clusters', setCursorDefault);
    mapInstance.on('mouseenter', 'unclustered-visits', setCursorPointer);
    mapInstance.on('mouseleave', 'unclustered-visits', setCursorDefault);

    return () => {
      mapInstance.off('click', 'clusters', handleClusterClick);
      mapInstance.off('click', 'unclustered-visits', handleVisitClick);
      mapInstance.off('mouseenter', 'clusters', setCursorPointer);
      mapInstance.off('mouseleave', 'clusters', setCursorDefault);
      mapInstance.off('mouseenter', 'unclustered-visits', setCursorPointer);
      mapInstance.off('mouseleave', 'unclustered-visits', setCursorDefault);
    };
  }, [mapLoaded]);

  // Update markers and clusters on map (data only)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing DOM markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Remove existing cluster layers and sources
    const layersToRemove = ['clusters', 'cluster-count', 'unclustered-visits'];
    const sourcesToRemove = ['visits-cluster'];

    try {
      layersToRemove.forEach(layer => {
        if (map.current?.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      sourcesToRemove.forEach(source => {
        if (map.current?.getSource(source)) {
          map.current.removeSource(source);
        }
      });
    } catch (e) {
      // Map not ready
      return;
    }

    // Create visit GeoJSON features
    const visitFeatures: GeoJSON.Feature<GeoJSON.Point>[] = visits
      .filter(v => v.check_in_latitude && v.check_in_longitude)
      .map(visit => ({
        type: 'Feature',
        properties: {
          id: visit.id,
          type: 'visit',
          userName: visit.user_name || 'Unknown User',
          checkInTime: visit.check_in_time,
          checkOutTime: visit.check_out_time,
          notes: visit.notes,
          completed: !!visit.check_out_time
        },
        geometry: {
          type: 'Point',
          coordinates: [visit.check_in_longitude, visit.check_in_latitude]
        }
      }));

    // Add clustered visits source
    if (visitFeatures.length > 0) {
      map.current.addSource('visits-cluster', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: visitFeatures
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'visits-cluster',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#10b981',
            10,
            '#f59e0b',
            30,
            '#ef4444'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            25,
            30,
            30
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'visits-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Unclustered visit points
      map.current.addLayer({
        id: 'unclustered-visits',
        type: 'circle',
        source: 'visits-cluster',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['get', 'completed'],
            '#10b981',
            '#f59e0b'
          ],
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      visitFeatures.forEach(f => {
        bounds.extend(f.geometry.coordinates as [number, number]);
        hasMarkers = true;
      });
    }

    // Fit map to all markers
    if (hasMarkers && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [visits, mapLoaded]);

  // Draw routes connecting visits chronologically
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = 'visit-routes';
    const layerId = 'visit-routes-layer';

    // Safety check - ensure map style is loaded
    try {
      // Remove existing layer and source
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    } catch (e) {
      // Map not ready yet, skip
      return;
    }

    if (!showRoutes || visits.length < 2) return;

    // Sort visits by check_in_time and group by user
    const visitsByUser = new Map<string, Visit[]>();
    visits.forEach(visit => {
      if (!visit.check_in_latitude || !visit.check_in_longitude) return;
      const userVisits = visitsByUser.get(visit.user_id) || [];
      userVisits.push(visit);
      visitsByUser.set(visit.user_id, userVisits);
    });

    // Create line features for each user's route
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#06b6d4'];
    let colorIndex = 0;

    visitsByUser.forEach((userVisits, userId) => {
      if (userVisits.length < 2) return;

      // Sort by check_in_time
      const sorted = [...userVisits].sort((a, b) => 
        new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime()
      );

      const coordinates = sorted.map(v => [v.check_in_longitude, v.check_in_latitude]);

      features.push({
        type: 'Feature',
        properties: { 
          userId,
          color: colors[colorIndex % colors.length]
        },
        geometry: {
          type: 'LineString',
          coordinates
        }
      });
      colorIndex++;
    });

    if (features.length === 0) return;

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      }
    });

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-opacity': 0.7,
        'line-dasharray': [2, 1]
      }
    });
  }, [visits, showRoutes, mapLoaded]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-background">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visit Map
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Date From Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1" />
                {dateFrom ? format(dateFrom, 'MMM d') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Date To Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1" />
                {dateTo ? format(dateTo, 'MMM d') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* User Filter (for managers and admins) */}
          {userRole !== 'sales_officer' && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[100px] h-5 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {userRole === 'admin' ? 'All Users' : 'My Team'}
                </SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}


          {/* Toggle routes */}
          <div className="flex items-center gap-1.5">
            <Switch
              id="show-routes"
              checked={showRoutes}
              onCheckedChange={setShowRoutes}
              className="scale-75"
            />
            <Label htmlFor="show-routes" className="text-[10px] text-muted-foreground cursor-pointer">
              <Route className="h-3 w-3 inline mr-0.5" />
              Routes
            </Label>
          </div>

          {/* Visit Count */}
          <div className="flex items-center px-1.5 py-0.5 bg-muted rounded text-[10px]">
            {loading ? '...' : `${visits.length} visits`}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        <NearbyPlacesPanel map={map.current} mapLoaded={mapLoaded} />
      </div>
    </div>
  );
}