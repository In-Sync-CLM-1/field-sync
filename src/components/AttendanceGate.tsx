import { useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, LogIn, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceGateProps {
  children: ReactNode;
}

const GATED_ROLES = ['sales_officer', 'branch_manager'];

export function AttendanceGate({ children }: AttendanceGateProps) {
  const user = useAuthStore((s) => s.user);
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const queryClient = useQueryClient();

  const [checking, setChecking] = useState(true);
  const [needsPunchIn, setNeedsPunchIn] = useState(false);
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    if (!user || !currentOrganization) return;

    const check = async () => {
      setChecking(true);
      try {
        // Check role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const userRoles = roles?.map(r => r.role) || [];
        const isGated = userRoles.some(r => GATED_ROLES.includes(r));

        if (!isGated) {
          setNeedsPunchIn(false);
          setChecking(false);
          return;
        }

        // Check today's attendance
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: attendance } = await supabase
          .from('attendance')
          .select('id, punch_in_time')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        setNeedsPunchIn(!attendance?.punch_in_time);
      } catch (err) {
        console.error('AttendanceGate check failed:', err);
        setNeedsPunchIn(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user?.id, currentOrganization?.id]);

  const handlePunchIn = async () => {
    if (!user || !currentOrganization) return;
    setPunching(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      const today = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase.from('attendance').insert({
        user_id: user.id,
        organization_id: currentOrganization.id,
        date: today,
        punch_in_time: new Date().toISOString(),
        punch_in_latitude: latitude,
        punch_in_longitude: longitude,
        punch_in_accuracy: accuracy,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Attendance marked successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setNeedsPunchIn(false);
    } catch (err: any) {
      if (err.code === 1) {
        toast.error('Location permission denied. Please enable GPS.');
      } else {
        toast.error(err.message || 'Failed to mark attendance');
      }
    } finally {
      setPunching(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!needsPunchIn) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-lg">Mark Your Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please punch in with your GPS location before accessing the app.
          </p>
          <Button
            size="lg"
            onClick={handlePunchIn}
            disabled={punching}
            className="w-full gap-2"
          >
            {punching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Punch In
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" /> GPS location will be recorded
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
