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
import { CalendarIcon, MapPin, Users, Route } from 'lucide-react';
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

interface Customer {
  id: string;
  name: string;
  company_name: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
}

export default function TerritoryMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const { user, currentOrganization } = useAuthStore();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check if user is a manager
  useEffect(() => {
    const checkManagerStatus = async () => {
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasManagerRole = roles?.some(r => 
        r.role === 'manager' || r.role === 'sales_manager' || r.role === 'support_manager'
      );
      setIsManager(hasManagerRole || false);
    };

    checkManagerStatus();
  }, [user]);

  // Fetch team members if user is a manager
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!isManager || !user || !currentOrganization) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', currentOrganization.id)
        .eq('reporting_manager_id', user.id);

      if (error) {
        console.error('Error fetching team members:', error);
        return;
      }

      setTeamMembers(data || []);
    };

    fetchTeamMembers();
  }, [isManager, user, currentOrganization]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = 'MAPBOX_TOKEN_REMOVED';

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
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

      // Filter by user if not "all"
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      } else if (!isManager) {
        // If not a manager, only show own visits
        query = query.eq('user_id', user.id);
      }

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
  }, [user, currentOrganization, selectedUser, dateFrom, dateTo, isManager]);

  // Fetch customers with locations
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company_name, latitude, longitude, address, phone')
        .eq('organization_id', currentOrganization.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      setCustomers(data || []);
    };

    fetchCustomers();
  }, [currentOrganization]);

  // Update markers on map
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Add customer markers (blue squares)
    if (showCustomers) {
      customers.forEach((customer) => {
        if (!customer.latitude || !customer.longitude) return;

        const el = document.createElement('div');
        el.className = 'customer-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '4px';
        el.style.backgroundColor = '#3b82f6';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 180px;">
            <div style="font-size: 10px; color: #3b82f6; font-weight: 600; margin-bottom: 4px;">CUSTOMER</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">
              ${customer.name}
            </h3>
            ${customer.company_name ? `<div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${customer.company_name}</div>` : ''}
            ${customer.address ? `<div style="font-size: 12px; color: #9ca3af;">${customer.address}</div>` : ''}
            ${customer.phone ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">📞 ${customer.phone}</div>` : ''}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([Number(customer.longitude), Number(customer.latitude)])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
        bounds.extend([Number(customer.longitude), Number(customer.latitude)]);
        hasMarkers = true;
      });
    }

    // Add visit markers (circles)
    visits.forEach((visit) => {
      if (!visit.check_in_latitude || !visit.check_in_longitude) return;

      const el = document.createElement('div');
      el.className = 'visit-marker';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = visit.check_out_time ? '#10b981' : '#f59e0b';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-size: 10px; color: ${visit.check_out_time ? '#10b981' : '#f59e0b'}; font-weight: 600; margin-bottom: 4px;">VISIT</div>
          <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">
            ${visit.user_name || 'Unknown User'}
          </h3>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
            <strong>Check-in:</strong> ${format(new Date(visit.check_in_time), 'PPp')}
          </div>
          ${visit.check_out_time ? `
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
              <strong>Check-out:</strong> ${format(new Date(visit.check_out_time), 'PPp')}
            </div>
          ` : '<div style="font-size: 14px; color: #f59e0b; margin-bottom: 4px;">Still in progress</div>'}
          ${visit.notes ? `
            <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
              <strong>Notes:</strong> ${visit.notes}
            </div>
          ` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([visit.check_in_longitude, visit.check_in_latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
      bounds.extend([visit.check_in_longitude, visit.check_in_latitude]);
      hasMarkers = true;
    });

    // Fit map to markers
    if (hasMarkers) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [visits, customers, showCustomers]);

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
        <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Visit Map
        </h1>
        
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

          {/* User Filter (only for managers) */}
          {isManager && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[100px] h-5 text-xs">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Toggle customers */}
          <div className="flex items-center gap-1.5 ml-1">
            <Switch
              id="show-customers"
              checked={showCustomers}
              onCheckedChange={setShowCustomers}
              className="scale-75"
            />
            <Label htmlFor="show-customers" className="text-[10px] text-muted-foreground cursor-pointer">
              <Users className="h-3 w-3 inline mr-0.5" />
              {customers.length}
            </Label>
          </div>

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
      </div>
    </div>
  );
}