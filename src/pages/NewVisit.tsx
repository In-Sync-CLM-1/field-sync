import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgentSelector } from '@/components/AgentSelector';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const formatDistance = (km: number): string => {
  if (km < 0.1) return `${Math.round(km * 1000)}m`;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

const PURPOSE_OPTIONS = [
  { value: 'first_visit', label: 'First Visit' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'collection', label: 'Collection' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other', label: 'Other' },
];

export default function NewVisit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');
  const preselectedDate = searchParams.get('date');

  const { leads, syncing: loadingLeads, syncFromDatabase } = useLeads();
  const { createVisit, isCreating } = useVisits();

  const [leadId, setLeadId] = useState(preselectedLeadId || '');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(preselectedDate || '');
  const [scheduledTime, setScheduledTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [autoSelectedNearest, setAutoSelectedNearest] = useState(false);
  const [onBehalfUserId, setOnBehalfUserId] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === leadId);
  const leadHasLocation = selectedLead?.latitude && selectedLead?.longitude;
  const isScheduling = !!scheduledDate;

  const leadsWithDistance = useMemo(() => {
    return leads
      .map((lead) => {
        let distance: number | null = null;
        if (location && lead.latitude && lead.longitude) {
          distance = getDistanceKm(location.latitude, location.longitude, lead.latitude, lead.longitude);
        }
        return { ...lead, distance };
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return 0;
      });
  }, [leads, location]);

  // Auto-select nearest customer once location is acquired
  useEffect(() => {
    if (location && !preselectedLeadId && !autoSelectedNearest && leadsWithDistance.length > 0) {
      const nearest = leadsWithDistance[0];
      if (nearest.distance !== null) {
        setLeadId(nearest.id);
        setAutoSelectedNearest(true);
      }
    }
  }, [location, leadsWithDistance, preselectedLeadId, autoSelectedNearest]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Sync leads once on mount when organization is available
  const hasSynced = useRef(false);
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromDatabase();
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setGettingLocation(false);
        toast.success('Location acquired');
      },
      (error) => {
        console.error('High accuracy location failed, trying low accuracy:', error.code, error.message);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setGettingLocation(false);
            toast.success('Location acquired');
          },
          (fallbackError) => {
            console.error('Location error:', fallbackError.code, fallbackError.message);
            toast.error('Failed to get location.');
            setGettingLocation(false);
          },
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = () => {
    if (!leadId) {
      toast.error('Please select a customer');
      return;
    }

    if (!isScheduling && !location && !(useManualLocation && (manualLatitude || manualAddress))) {
      toast.error('Location not available. Please enter an address or enable GPS.');
      getCurrentLocation();
      return;
    }

    // Determine check-in coordinates
    let checkInLat = location?.latitude || 0;
    let checkInLng = location?.longitude || 0;
    const shouldUpdateLeadLocation = !isScheduling && !leadHasLocation;

    if (useManualLocation && manualLatitude && manualLongitude) {
      checkInLat = parseFloat(manualLatitude);
      checkInLng = parseFloat(manualLongitude);
    }

    createVisit(
      {
        customer_id: leadId,
        check_in_latitude: checkInLat,
        check_in_longitude: checkInLng,
        notes: manualAddress ? `${manualAddress}${notes ? `\n${notes}` : ''}` : (notes || undefined),
        purpose: purpose || undefined,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
        updateLeadLocation: shouldUpdateLeadLocation && (checkInLat !== 0 || checkInLng !== 0),
        target_user_id: onBehalfUserId || undefined,
      },
      {
        onSuccess: (visit: any) => {
          if (isScheduling) {
            navigate('/dashboard/visits');
          } else {
            navigate(`/dashboard/visits/${visit.id}`);
          }
        },
      }
    );
  };

  return (
    <div className="container py-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/visits')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Visits</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isScheduling ? 'Schedule Visit' : 'New Visit'}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isScheduling ? 'Schedule a future visit' : 'Select customer and check in'}
        </p>
      </div>

      {/* Agent selector for managers/admins */}
      <AgentSelector onAgentChange={(userId) => setOnBehalfUserId(userId)} />

      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scheduling fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Schedule Date</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer selector */}
          <div>
            <Label>Customer *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={loadingLeads}>
                  {selectedLead ? (
                    <span className="flex items-center gap-2">
                      {selectedLead.name}
                      {selectedLead && location && selectedLead.latitude && selectedLead.longitude && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDistance(getDistanceKm(location.latitude, location.longitude, selectedLead.latitude, selectedLead.longitude))}
                        </Badge>
                      )}
                    </span>
                  ) : 'Select customer...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search customers..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
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
                        <Check className={cn('mr-2 h-4 w-4', leadId === lead.id ? 'opacity-100' : 'opacity-0')} />
                        <span className="flex-1">{lead.name}</span>
                        {lead.latitude && lead.longitude ? (
                          <>
                            <MapPin className="ml-2 h-3 w-3 text-green-500" />
                            {lead.distance !== null && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {formatDistance(lead.distance)}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <MapPin className="ml-2 h-3 w-3 text-amber-500" />
                        )}
                        {lead.villageCity && (
                          <span className="ml-2 text-sm text-muted-foreground">{lead.villageCity}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2 text-sm mt-2">
              <span className="text-muted-foreground">Can't find the customer?</span>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-primary font-medium"
                onClick={() => navigate('/dashboard/leads/new?returnTo=new-visit')}
              >
                <Plus className="h-3 w-3 mr-1" /> Add New Customer
              </Button>
            </div>
          </div>

          {selectedLead && !leadHasLocation && !isScheduling && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>
                  {useManualLocation
                    ? 'Enter the address or coordinates manually below.'
                    : 'This customer doesn\'t have a location. Your current location will be saved to the customer record.'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseManualLocation(!useManualLocation)}
              >
                {useManualLocation ? 'Use GPS location instead' : 'Enter address manually'}
              </Button>
              {useManualLocation && (
                <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                  <div>
                    <Label>Address</Label>
                    <Input
                      placeholder="e.g. 123 Main St, City, State"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Latitude (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 28.6139"
                        value={manualLatitude}
                        onChange={(e) => setManualLatitude(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Longitude (optional)</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 77.2090"
                        value={manualLongitude}
                        onChange={(e) => setManualLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If you provide coordinates, they will be saved to the customer record. Otherwise only the address is saved.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any visit notes..." rows={4} />
          </div>

          {/* Location Status */}
          {!isScheduling && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {gettingLocation && <span className="text-muted-foreground">Getting location...</span>}
              {location && !gettingLocation && (
                <span className="text-green-600">
                  Location acquired: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </span>
              )}
              {!location && !gettingLocation && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={getCurrentLocation}>
                  Retry getting location
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSubmit}
          disabled={!leadId || (!isScheduling && !location && !(useManualLocation && (manualLatitude || manualAddress))) || isCreating}
          className="flex-1"
          size="lg"
        >
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isScheduling ? 'Schedule Visit' : 'Start Visit'}
        </Button>
        <Button onClick={() => navigate('/dashboard/visits')} variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
}
