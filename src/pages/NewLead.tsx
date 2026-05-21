import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Loader2, Save, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLeads } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  mobileNo: z.string().optional(),
  address: z.string().optional(),
  village_city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const NewLead = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addLead } = useLeads();
  const { currentOrganization, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      mobileNo: '',
      address: '',
      village_city: '',
      state: '',
      notes: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { setValue, watch } = form;
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsCapturingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      setValue('latitude', position.coords.latitude);
      setValue('longitude', position.coords.longitude);
      toast.success('Location captured successfully');
    } catch (error) {
      console.error('Error capturing location:', error);
      toast.error('Failed to capture location. Please check your permissions.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleUseMyLocation = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      setValue('latitude', lat);
      setValue('longitude', lng);
      // Reverse geocode via Nominatim (free, no API key)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'FieldSync/1.0' } }
        );
        const data = await res.json();
        if (data.address) {
          setValue('village_city', data.address.city || data.address.town || data.address.village || '');
          setValue('state', data.address.state || '');
          setValue('address', data.display_name?.split(',').slice(0, 3).join(', ') || '');
        }
        toast.success('Location and address filled');
      } catch (e) {
        console.log('Reverse geocode failed:', e);
        toast.info('Location captured but address lookup failed');
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      toast.error('Failed to get location');
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!currentOrganization) {
      toast.error('Please select an organization first');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLead = await addLead({
        name: data.name,
        mobileNo: data.mobileNo || undefined,
        district: data.address || undefined,
        villageCity: data.village_city || undefined,
        state: data.state || undefined,
        customerResponse: data.notes || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        organizationId: currentOrganization.id,
        status: 'active',
        createdBy: user?.id,
      });

      // Handle returnTo param for New Visit flow
      const returnTo = searchParams.get('returnTo');
      if (returnTo === 'new-visit' && newLead) {
        navigate(`/dashboard/visits/new?leadId=${newLead.id}`);
      } else {
        navigate('/dashboard/leads');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/leads')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Customer</CardTitle>
          <CardDescription>Add a new customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Customer Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobileNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    className="gap-1"
                  >
                    <Navigation className="h-3 w-3" />
                    Use My Location
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="village_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureLocation}
                    disabled={isCapturingLocation}
                  >
                    {isCapturingLocation ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-1" />
                    )}
                    Capture GPS
                  </Button>
                  {latitude && longitude && (
                    <span className="text-xs text-muted-foreground">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full btn-gradient-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Customer
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewLead;
