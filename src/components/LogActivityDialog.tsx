import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Phone, MessageSquare, FileText } from 'lucide-react';
import { ActivityType } from '@/hooks/useLeadActivities';

interface LogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityType: ActivityType;
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

const activityConfig: Record<string, { title: string; icon: React.ElementType; placeholder: string }> = {
  call: { title: 'Log Call', icon: Phone, placeholder: 'What was discussed on the call?' },
  whatsapp: { title: 'Log WhatsApp', icon: MessageSquare, placeholder: 'Summary of WhatsApp conversation...' },
  note: { title: 'Add Note', icon: FileText, placeholder: 'Enter your note...' },
};

export function LogActivityDialog({ open, onOpenChange, activityType, onSubmit, isLoading }: LogActivityDialogProps) {
  const [description, setDescription] = useState('');
  const config = activityConfig[activityType] || activityConfig.note;
  const Icon = config.icon;

  const handleSubmit = () => {
    onSubmit(description);
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {config.title}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder={config.placeholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
