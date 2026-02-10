import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisit, useVisits, ChecklistItem } from '@/hooks/useVisits';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AssignUserDialog } from '@/components/AssignUserDialog';
import { VisitChecklist } from '@/components/VisitChecklist';
import { RescheduleDialog } from '@/components/RescheduleDialog';
import { CancelVisitDialog } from '@/components/CancelVisitDialog';
import { toast } from 'sonner';
import { MapPin, Clock, Loader2, ArrowLeft, Navigation, CalendarClock, Ban } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'SCHEDULED', className: 'bg-blue-500 text-white border-0' },
  in_progress: { label: 'IN PROGRESS', className: 'bg-amber-500 text-white border-0' },
  completed: { label: 'COMPLETED', className: 'bg-green-500 text-white border-0' },
  cancelled: { label: 'CANCELLED', className: 'bg-destructive text-destructive-foreground border-0' },
  rescheduled: { label: 'RESCHEDULED', className: 'bg-purple-500 text-white border-0' },
};

export default function VisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { visit, isLoading } = useVisit(id);
  const { checkOutVisit, isCheckingOut, updateVisit } = useVisits();
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { data: assignedUser } = useQuery({
    queryKey: ['user', visit?.user_id],
    queryFn: async () => {
      if (!visit?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', visit.user_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!visit?.user_id,
  });

  useEffect(() => {
    if (visit?.notes) setNotes(visit.notes);
  }, [visit]);

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
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get location. Please enable location services.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckOut = () => {
    if (!visit || !id) return;
    if (!location) {
      toast.error('Getting location...');
      getCurrentLocation();
      return;
    }
    checkOutVisit(
      { id, latitude: location.latitude, longitude: location.longitude, notes: notes || undefined },
      { onSuccess: () => navigate('/dashboard/visits') }
    );
  };

  const handleChecklistToggle = (index: number) => {
    if (!visit?.checklist || !id) return;
    const updated = [...visit.checklist];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    updateVisit({ id, checklist: updated } as any);
  };

  const handleNavigate = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  useEffect(() => {
    if (visit && !visit.check_out_time && visit.status !== 'cancelled' && visit.status !== 'rescheduled') {
      getCurrentLocation();
    }
  }, [visit]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container py-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/visits')}>
          <ArrowLeft /> Back to Visits
        </Button>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Visit not found</p>
            <p className="text-sm text-muted-foreground">This visit may have been deleted or doesn't exist</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[visit.status] || statusConfig.in_progress;
  const isActive = visit.status === 'in_progress' || visit.status === 'scheduled';
  const isCompleted = visit.status === 'completed';
  const duration = isCompleted && visit.check_out_time
    ? Math.round((new Date(visit.check_out_time).getTime() - new Date(visit.check_in_time).getTime()) / 60000)
    : null;

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/visits')}>
          <ArrowLeft /> Back
        </Button>
        <div className="flex items-center gap-2">
          <AssignUserDialog
            entityType="visit"
            entityId={id!}
            currentAssigneeId={visit.user_id}
            currentAssigneeName={assignedUser?.full_name}
            onAssigned={() => queryClient.invalidateQueries({ queryKey: ['visit', id] })}
          />
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{visit.lead?.name || 'Unknown Lead'}</CardTitle>
          {visit.purpose && (
            <p className="text-sm text-muted-foreground capitalize">{visit.purpose}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scheduled info */}
          {visit.scheduled_date && (
            <div className="flex items-center gap-2 text-sm border-b pb-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span>Scheduled: {format(new Date(visit.scheduled_date), 'PP')}</span>
              {visit.scheduled_time && <span>at {visit.scheduled_time}</span>}
            </div>
          )}

          {/* Cancel info */}
          {visit.status === 'cancelled' && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-medium text-destructive">Cancelled{visit.cancelled_at ? ` on ${format(new Date(visit.cancelled_at), 'PP')}` : ''}</p>
              {visit.cancel_reason && <p className="text-muted-foreground mt-1">{visit.cancel_reason}</p>}
            </div>
          )}

          {/* Lead Details */}
          {visit.lead && (visit.lead.village_city || visit.lead.district) && (
            <div className="space-y-2 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{[visit.lead.village_city, visit.lead.district].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          )}

          {/* Check-in Info */}
          {visit.check_in_latitude !== 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Check-in</span>
                </div>
                <span className="text-sm text-muted-foreground">{format(new Date(visit.check_in_time), 'PPp')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono">
                    {Number(visit.check_in_latitude).toFixed(6)}, {Number(visit.check_in_longitude).toFixed(6)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleNavigate(Number(visit.check_in_latitude), Number(visit.check_in_longitude))}>
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Check-out Info */}
          {isCompleted && visit.check_out_time && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Check-out</span>
                </div>
                <span className="text-sm text-muted-foreground">{format(new Date(visit.check_out_time), 'PPp')}</span>
              </div>
              {visit.check_out_latitude && visit.check_out_longitude && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-mono">
                      {Number(visit.check_out_latitude).toFixed(6)}, {Number(visit.check_out_longitude).toFixed(6)}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleNavigate(Number(visit.check_out_latitude!), Number(visit.check_out_longitude!))}>
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {duration !== null && (
                <div className="mt-2 text-sm text-muted-foreground">Duration: {duration} minutes</div>
              )}
            </div>
          )}

          {/* Checklist */}
          {visit.checklist && visit.checklist.length > 0 && (
            <div className="pt-4 border-t">
              <VisitChecklist
                items={visit.checklist}
                onToggle={isActive ? handleChecklistToggle : undefined}
                readOnly={!isActive}
              />
            </div>
          )}

          {/* Notes */}
          {isActive && (
            <div>
              <label className="text-sm font-medium mb-2 block">Visit Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this visit..."
                rows={4}
              />
            </div>
          )}

          {!isActive && visit.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Visit Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{visit.notes}</p>
            </div>
          )}

          {/* Location Status for Active Visits */}
          {visit.status === 'in_progress' && (
            <div className="flex items-center gap-2 text-sm pt-4 border-t">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {gettingLocation && <span className="text-muted-foreground">Getting location...</span>}
              {location && !gettingLocation && <span className="text-green-600">Location ready for check-out</span>}
              {!location && !gettingLocation && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={getCurrentLocation}>
                  Get location for check-out
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isActive && (
        <div className="space-y-2">
          {visit.status === 'in_progress' && (
            <Button
              onClick={handleCheckOut}
              disabled={!location || isCheckingOut || gettingLocation}
              className="w-full"
              size="lg"
            >
              {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Visit
            </Button>
          )}
          <div className="flex gap-2">
            <RescheduleDialog visitId={id!} onRescheduled={() => navigate('/dashboard/visits')}>
              <Button variant="outline" className="flex-1 gap-2">
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </Button>
            </RescheduleDialog>
            <CancelVisitDialog visitId={id!} onCancelled={() => navigate('/dashboard/visits')}>
              <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
                <Ban className="h-4 w-4" />
                Cancel
              </Button>
            </CancelVisitDialog>
          </div>
        </div>
      )}
    </div>
  );
}
