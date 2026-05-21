import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ban, Loader2 } from 'lucide-react';
import { useVisits } from '@/hooks/useVisits';

interface Props {
  visitId: string;
  children: React.ReactNode;
  onCancelled?: () => void;
}

export function CancelVisitDialog({ visitId, children, onCancelled }: Props) {
  const { cancelVisit, isCancelling } = useVisits();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleCancel = () => {
    cancelVisit(
      { id: visitId, reason: reason || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          onCancelled?.();
        },
      } as any
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Cancel Visit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this visit? This action cannot be undone.
          </p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why cancel?" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Keep Visit
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling} className="flex-1">
              {isCancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Visit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
