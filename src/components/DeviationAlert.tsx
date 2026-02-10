import { AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Deviation {
  id: string;
  latitude: number;
  longitude: number;
  distance_from_route_km: number;
  detected_at: string;
  acknowledged: boolean;
  user_id: string;
  profiles?: { full_name: string | null } | null;
}

interface DeviationAlertProps {
  deviations: Deviation[];
}

export function DeviationAlert({ deviations }: DeviationAlertProps) {
  const queryClient = useQueryClient();

  const acknowledge = async (id: string) => {
    const { error } = await supabase
      .from('route_deviations' as any)
      .update({ acknowledged: true })
      .eq('id', id);
    if (error) {
      toast.error('Failed to acknowledge deviation');
    } else {
      toast.success('Deviation acknowledged');
      queryClient.invalidateQueries({ queryKey: ['route_deviations'] });
    }
  };

  const unacknowledged = deviations.filter((d) => !d.acknowledged);
  if (unacknowledged.length === 0) return null;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-destructive font-medium text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{unacknowledged.length} Route Deviation{unacknowledged.length > 1 ? 's' : ''}</span>
        </div>
        {unacknowledged.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-[10px]">
                {d.distance_from_route_km.toFixed(1)} km off
              </Badge>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(d.detected_at), { addSuffix: true })}
              </span>
              {d.profiles && (
                <span className="text-foreground font-medium">{(d.profiles as any).full_name}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => acknowledge(d.id)}
            >
              <Check className="h-3 w-3 mr-1" /> Dismiss
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
