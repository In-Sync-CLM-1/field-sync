import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export default function NewVisit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');

  const { leads, syncing: loadingLeads } = useLeads();
  const { createVisit, isCreating } = useVisits();

  const [leadId, setLeadId] = useState(preselectedLeadId || '');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const selectedLead = leads.find(l => l.id === leadId);
  const leadHasLocation = selectedLead?.latitude && selectedLead?.longitude;

  // Calculate distances for all leads with locations
  const leadsWithDistance = useMemo(() => {
    return leads.map(lead => {
      let distance: number | null = null;
      if (location && lead.latitude && lead.longitude) {
        distance = calculateDistance(
          location.latitude,
          location.longitude,
          lead.latitude,
          lead.longitude
        );
      }
      return { ...lead, distance };
    }).sort((a, b) => {
      // Sort by distance (leads with distance first, then by distance value)
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });
  }, [leads, location]);

  useEffect(() => {
    // Get location on mount
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get location. Please enable location services.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleStartVisit = () => {
    if (!leadId) {
      toast.error('Please select a lead');
      return;
    }

    if (!location) {
      toast.error('Location not available. Please try again.');
      getCurrentLocation();
      return;
    }

    createVisit(
      {
        customer_id: leadId,
        check_in_latitude: location.latitude,
        check_in_longitude: location.longitude,
        notes: notes || undefined,
        updateLeadLocation: !leadHasLocation,
      },
      {
        onSuccess: (visit) => {
          navigate(`/visits/${visit.id}`);
        },
      }
    );
  };

  return (
    <div className="container py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Visit</h1>
        <p className="text-muted-foreground">Select lead and check in</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lead *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={loadingLeads}
                >
                  {selectedLead ? selectedLead.name : "Select lead..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search leads..." />
                  <CommandEmpty>No lead found.</CommandEmpty>
                  <CommandGroup>
                    {leadsWithDistance.map((lead) => (
                      <CommandItem
                        key={lead.id}
                        value={lead.name}
                        onSelect={() => {
                          setLeadId(lead.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            leadId === lead.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">{lead.name}</span>
                        {lead.latitude && lead.longitude ? (
                          <>
                            <MapPin className="ml-2 h-3 w-3 text-green-500" />
                            {lead.distance !== null && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                {formatDistance(lead.distance)}
                              </span>
                            )}
                          </>
                        ) : (
                          <MapPin className="ml-2 h-3 w-3 text-amber-500" />
                        )}
                        {lead.villageCity && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {lead.villageCity}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Lead location status info */}
          {selectedLead && !leadHasLocation && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>This lead doesn't have a location. Your current location will be saved to the lead record.</span>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any visit notes..."
              rows={4}
            />
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {gettingLocation && (
              <span className="text-muted-foreground">Getting location...</span>
            )}
            {location && !gettingLocation && (
              <span className="text-green-600">
                Location acquired: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            )}
            {!location && !gettingLocation && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={getCurrentLocation}
              >
                Retry getting location
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleStartVisit}
          disabled={!leadId || !location || isCreating || gettingLocation}
          className="flex-1"
          size="lg"
        >
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Visit
        </Button>
        <Button
          onClick={() => navigate('/visits')}
          variant="outline"
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
