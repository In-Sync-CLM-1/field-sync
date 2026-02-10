import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, Loader2 } from 'lucide-react';
import { useVisits } from '@/hooks/useVisits';
import { toast } from 'sonner';

interface Props {
  visitId: string;
  children: React.ReactNode;
  onRescheduled?: () => void;
}

export function RescheduleDialog({ visitId, children, onRescheduled }: Props) {
  const { rescheduleVisit, isRescheduling } = useVisits();
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!newDate) {
      toast.error('Select a new date');
      return;
    }
    rescheduleVisit(
      {
        originalId: visitId,
        newDate,
        newTime: newTime || undefined,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          onRescheduled?.();
        },
      } as any
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Reschedule Visit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>New Date *</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why reschedule?" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!newDate || isRescheduling} className="flex-1">
              {isRescheduling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
