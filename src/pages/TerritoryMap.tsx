import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, MapPin } from 'lucide-react';
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
  const [isManager, setIsManager] = useState(false);

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

    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!mapboxToken) {
      toast.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

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

  // Update markers on map
  useEffect(() => {
    if (!map.current || !visits.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    const bounds = new mapboxgl.LngLatBounds();

    visits.forEach((visit) => {
      if (!visit.check_in_latitude || !visit.check_in_longitude) return;

      const el = document.createElement('div');
      el.className = 'visit-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = visit.check_out_time ? '#10b981' : '#f59e0b';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
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
    });

    // Fit map to markers
    if (visits.length > 0) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [visits]);

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-background">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Visit Map
        </h1>
        
        <div className="flex flex-wrap gap-3">
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'To date'}
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Visit Count */}
          <div className="flex items-center px-3 py-2 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {loading ? 'Loading...' : `${visits.length} visits`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
}