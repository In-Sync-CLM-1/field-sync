import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, CalendarIcon, Loader2, Save } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLeads } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  mobileNo: z.string().optional(),
  policyTypeCategory: z.string().optional(),
  policyType: z.string().optional(),
  premiumAmount: z.coerce.number().optional(),
  villageCity: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  leadSource: z.string().optional(),
  customerResponse: z.string().optional(),
  followUpDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

const POLICY_CATEGORIES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'motor', label: 'Motor Insurance' },
  { value: 'general', label: 'General Insurance' },
];

const LEAD_SOURCES = [
  { value: 'direct', label: 'Direct/Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'digital', label: 'Digital/Online' },
  { value: 'campaign', label: 'Branch Campaign' },
  { value: 'other', label: 'Other' },
];

const NewLead = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addLead } = useLeads();
  const { currentOrganization, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      mobileNo: '',
      policyTypeCategory: '',
      policyType: '',
      premiumAmount: undefined,
      villageCity: '',
      district: '',
      state: '',
      leadSource: '',
      customerResponse: '',
      followUpDate: undefined,
    },
  });

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

      setCoordinates({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      toast.success('Location captured successfully');
    } catch (error) {
      console.error('Error capturing location:', error);
      toast.error('Failed to capture location. Please check your permissions.');
    } finally {
      setIsCapturingLocation(false);
    }
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
        policyTypeCategory: data.policyTypeCategory || undefined,
        policyType: data.policyType || undefined,
        premiumAmount: data.premiumAmount || undefined,
        villageCity: data.villageCity || undefined,
        district: data.district || undefined,
        state: data.state || undefined,
        leadSource: data.leadSource || undefined,
        customerResponse: data.customerResponse || undefined,
        followUpDate: data.followUpDate ? format(data.followUpDate, 'yyyy-MM-dd') : undefined,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        organizationId: currentOrganization.id,
        status: 'lead',
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
      console.error('Error saving lead:', error);
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
          Back to Prospects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Lead</CardTitle>
          <CardDescription>Create a new prospect/lead</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Personal Details</h3>
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
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Policy Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Sales Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="policyTypeCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POLICY_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="policyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter sales type" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="premiumAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premium Amount (Annual)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="₹ Enter amount"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="villageCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village/City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter village or city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter district" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    Capture Current Location
                  </Button>
                  {coordinates && (
                    <span className="text-xs text-muted-foreground">
                      📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_SOURCES.map((src) => (
                              <SelectItem key={src.value} value={src.value}>
                                {src.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Follow-up Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Select date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="customerResponse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes or customer response..."
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
                Save Lead
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewLead;
