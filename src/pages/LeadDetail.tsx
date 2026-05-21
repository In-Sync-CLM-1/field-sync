import { useParams, useNavigate } from 'react-router-dom';
import { useLead } from '@/hooks/useLeads';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Phone,
  MapPin,
  MessageSquare,
  Navigation,
  Calendar,
  ExternalLink,
  FileText,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-500 text-white' },
  { value: 'converted', label: 'Converted', color: 'bg-blue-500 text-white' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500 text-white' },
];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lead, isLoading } = useLead(id);

  // Get visits for this customer
  const { data: customerVisits = [] } = useQuery({
    queryKey: ['customer-visits', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('customer_id', id)
        .order('check_in_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id || !lead) return;
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const handleCall = () => {
    if (!lead?.mobile_no) return;
    window.location.href = `tel:${lead.mobile_no}`;
  };

  const handleWhatsApp = () => {
    if (!lead?.mobile_no) return;
    const cleanPhone = lead.mobile_no.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleNavigate = () => {
    if (!lead?.latitude || !lead?.longitude) {
      toast.error('Location not available');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`;
    window.open(url, '_blank');
  };

  const handleStartVisit = () => {
    navigate(`/dashboard/visits/new?leadId=${id}`);
  };


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container py-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/customers')}>
          <ArrowLeft />
          Back to Customers
        </Button>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Customer not found</p>
            <p className="text-sm text-muted-foreground">
              This customer may have been deleted or doesn't exist
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = lead.status || 'active';

  return (
    <div className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/customers')}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{lead.name}</CardTitle>
          {(lead.village_city || lead.district || lead.state) && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[lead.village_city, lead.district, lead.state].filter(Boolean).join(', ')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {lead.mobile_no && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.mobile_no}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.customer_response && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground">{lead.customer_response}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Quick Actions - Call, WhatsApp */}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCall} disabled={!lead.mobile_no} className="gap-1">
              <Phone className="h-3 w-3" /> Call
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} disabled={!lead.mobile_no} className="gap-1">
              <MessageSquare className="h-3 w-3" /> WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={currentStatus === opt.value ? 'default' : 'outline'}
                size="sm"
                className={currentStatus === opt.value ? opt.color : ''}
                onClick={() => statusMutation.mutate(opt.value)}
                disabled={statusMutation.isPending}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Card */}
      {(lead.latitude && lead.longitude) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
            <CardDescription>
              {Number(lead.latitude).toFixed(6)}, {Number(lead.longitude).toFixed(6)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleNavigate}>
              <Navigation />
              Get Directions
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          {customerVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No visits yet</p>
          ) : (
            <div className="space-y-2">
              {customerVisits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/dashboard/visits/${visit.id}`)}
                >
                  {visit.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{visit.purpose || 'Visit'}</p>
                    <p className="text-xs text-muted-foreground">
                      {visit.check_in_time && format(new Date(visit.check_in_time), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <Badge variant={visit.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                    {visit.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Visit Button */}
      <Button className="w-full" size="lg" onClick={handleStartVisit}>
        <Calendar />
        Start Visit
      </Button>

    </div>
  );
}
