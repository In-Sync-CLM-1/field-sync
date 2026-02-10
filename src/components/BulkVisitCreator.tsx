import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useVisits, useChecklistTemplates, ChecklistItem } from '@/hooks/useVisits';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: React.ReactNode;
}

export function BulkVisitCreator({ children }: Props) {
  const { leads } = useLeads();
  const { bulkCreateVisits, isBulkCreating } = useVisits();
  const { templates } = useChecklistTemplates();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState('');

  const filteredLeads = leads.filter(
    (l) => !search || l.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLead = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one lead');
      return;
    }
    if (!scheduledDate) {
      toast.error('Select a date');
      return;
    }

    let checklist: ChecklistItem[] | undefined;
    if (templateId) {
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        checklist = tpl.items.map((item) => ({ ...item, completed: false }));
      }
    }

    bulkCreateVisits(
      {
        customer_ids: selectedIds,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || undefined,
        purpose: purpose || undefined,
        notes: notes || undefined,
        checklist,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedIds([]);
          setSearch('');
          setScheduledDate('');
          setScheduledTime('');
          setPurpose('');
          setNotes('');
          setTemplateId('');
        },
      } as any
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Bulk Schedule Visits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checklist Template */}
          {templates.length > 0 && (
            <div>
              <Label>Checklist Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Common notes..." rows={2} />
          </div>

          {/* Lead Selection */}
          <div>
            <Label className="mb-1 block">
              Select Leads ({selectedIds.length} selected)
            </Label>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedIds.map((id) => {
                  const lead = leads.find((l) => l.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 text-xs">
                      {lead?.name || id}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLead(id)} />
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y">
              {filteredLeads.map((lead) => (
                <label
                  key={lead.id}
                  className="flex items-center gap-2 p-2 hover:bg-accent/50 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedIds.includes(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                  <span className="truncate">{lead.name}</span>
                  {lead.villageCity && (
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {lead.villageCity}
                    </span>
                  )}
                </label>
              ))}
              {filteredLeads.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground text-center">No leads found</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || !scheduledDate || isBulkCreating}
            className="flex-1"
          >
            {isBulkCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule {selectedIds.length} Visit{selectedIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
