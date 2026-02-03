import { useParams, useNavigate } from 'react-router-dom';
import { useLead } from '@/hooks/useLeads';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AssignUserDialog } from '@/components/AssignUserDialog';
import {
  ArrowLeft,
  Phone,
  MapPin,
  MessageSquare,
  Navigation,
  Calendar,
  ExternalLink,
  IndianRupee,
  Building2,
  User,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lead, isLoading } = useLead(id);

  // Get assigned user name
  const { data: assignedUser } = useQuery({
    queryKey: ['user', lead?.assigned_user_id],
    queryFn: async () => {
      if (!lead?.assigned_user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', lead.assigned_user_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!lead?.assigned_user_id,
  });

  const handleCall = () => {
    if (!lead?.mobile_no) return;
    window.location.href = `tel:${lead.mobile_no}`;
    toast.info('Opening phone dialer...');
  };

  const handleWhatsApp = () => {
    if (!lead?.mobile_no) return;
    const cleanPhone = lead.mobile_no.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
    toast.info('Opening WhatsApp...');
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'policy_issued': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'quoted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'lead': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'proposal_submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
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
        <Button variant="ghost" onClick={() => navigate('/dashboard/leads')}>
          <ArrowLeft />
          Back to Prospects
        </Button>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Prospect not found</p>
            <p className="text-sm text-muted-foreground">
              This prospect may have been deleted or doesn't exist
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/leads')}>
          <ArrowLeft />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <AssignUserDialog
            entityType="lead"
            entityId={id!}
            currentAssigneeId={lead.assigned_user_id}
            currentAssigneeName={assignedUser?.full_name}
            onAssigned={() => queryClient.invalidateQueries({ queryKey: ['lead', id] })}
          />
          <Badge className={getStatusColor(lead.status)}>
            {lead.status}
          </Badge>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{lead.name}</CardTitle>
          {lead.policy_type_category && (
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {lead.policy_type_category}
            </CardDescription>
          )}
          {(lead.village_city || lead.district || lead.state) && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {[lead.village_city, lead.district, lead.state].filter(Boolean).join(', ')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IDs */}
          <div className="grid grid-cols-2 gap-4">
            {lead.proposal_number && (
              <div>
                <p className="text-xs text-muted-foreground">Proposal Number</p>
                <p className="text-sm font-medium">{lead.proposal_number}</p>
              </div>
            )}
            {lead.customer_id && (
              <div>
                <p className="text-xs text-muted-foreground">Customer ID</p>
                <p className="text-sm font-medium">{lead.customer_id}</p>
              </div>
            )}
            {lead.branch && (
              <div>
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="text-sm font-medium">{lead.branch}</p>
              </div>
            )}
            {lead.lead_source && (
              <div>
                <p className="text-xs text-muted-foreground">Lead Source</p>
                <p className="text-sm font-medium">{lead.lead_source}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Policy Details */}
          {(lead.premium_amount || lead.policy_type) && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Policy Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {lead.premium_amount && (
                    <div>
                      <p className="text-xs text-muted-foreground">Premium Amount (Annual)</p>
                      <p className="text-sm font-medium">₹{Number(lead.premium_amount).toLocaleString()}</p>
                    </div>
                  )}
                  {lead.policy_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Policy Type</p>
                      <p className="text-sm font-medium">{lead.policy_type}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Contact Info */}
          <div className="space-y-2">
            {lead.mobile_no && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.mobile_no}</span>
              </div>
            )}
            {lead.follow_up_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Follow-up: {format(new Date(lead.follow_up_date), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>

          {/* Customer Response */}
          {lead.customer_response && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Customer Response
                </h3>
                <p className="text-sm text-muted-foreground">{lead.customer_response}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="icon" onClick={handleCall} disabled={!lead.mobile_no}>
              <Phone />
            </Button>
            <Button variant="outline" size="icon" onClick={handleWhatsApp} disabled={!lead.mobile_no}>
              <MessageSquare />
            </Button>
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

      {/* Audit Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {lead.created_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created On</p>
                  <p>{format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
            )}
            {lead.approved_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Approved On</p>
                  <p>{format(new Date(lead.approved_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
            )}
          </div>
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
