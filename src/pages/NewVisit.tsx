import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
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

export default function NewVisit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const { customers, isLoading: loadingCustomers } = useCustomers();
  const { createVisit, isCreating } = useVisits();

  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);

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
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!location) {
      toast.error('Location not available. Please try again.');
      getCurrentLocation();
      return;
    }

    createVisit(
      {
        customer_id: customerId,
        check_in_latitude: location.latitude,
        check_in_longitude: location.longitude,
        notes: notes || undefined,
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
        <p className="text-muted-foreground">Select customer and check in</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Customer *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={loadingCustomers}
                >
                  {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search customers..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => {
                          setCustomerId(customer.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.name}
                        {customer.city && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {customer.city}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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
          disabled={!customerId || !location || isCreating || gettingLocation}
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
