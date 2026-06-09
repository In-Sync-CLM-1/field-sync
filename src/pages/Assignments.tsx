import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { useOrgMembers } from '@/hooks/useBeats';
import {
  useAssignedList, usePriorAssignmentDate, useAssignmentActions, CsvRow,
} from '@/hooks/useAssignments';

import {
  Send, Plus, Search, MapPin, Phone, X, Upload, RotateCcw, Download,
  Loader2, CalendarIcon, Users, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

/** Tiny CSV parser — header row + comma-separated values, matches the template we hand out. */
function parseCsv(text: string): CsvRow[] {
  const lines = text.replace(/\r/g, '').trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const iName = headers.findIndex((h) => h === 'name' || h === 'customer');
  const iPhone = headers.findIndex((h) => h === 'phone' || h === 'mobile' || h === 'mobile_no');
  const iAddr = headers.findIndex((h) => h === 'address' || h === 'area' || h === 'city');
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const v = lines[i].split(',').map((c) => c.trim());
    const name = iName >= 0 ? v[iName] : v[0];
    if (!name) continue;
    rows.push({
      name,
      phone: iPhone >= 0 ? v[iPhone] : undefined,
      address: iAddr >= 0 ? v[iAddr] : undefined,
    });
  }
  return rows;
}

export default function Assignments() {
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const { data: members = [] } = useOrgMembers();

  const [agentId, setAgentId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Default to the first rep so the page shows a list on open instead of being empty.
  useEffect(() => {
    if (!agentId && members.length) setAgentId(members[0].id);
  }, [members, agentId]);

  const { data: assigned = [], isLoading } = useAssignedList(agentId || undefined, dateStr);
  const { data: priorDate } = usePriorAssignmentDate(agentId || undefined, dateStr);
  const { assign, remove, repeatFrom, uploadCsv } = useAssignmentActions(agentId || undefined, dateStr);

  const [pickOpen, setPickOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [csvPreview, setCsvPreview] = useState<CsvRow[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const agentName = members.find((m) => m.id === agentId)?.full_name || '';
  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.customerId)), [assigned]);

  // Local customer cache for the manual picker.
  const leads = useLiveQuery(async () => {
    if (!currentOrganization) return [];
    return db.leads.where('organizationId').equals(currentOrganization.id).toArray();
  }, [currentOrganization?.id]) || [];

  const pickable = useMemo(() => {
    const base = leads.filter((l) => !assignedIds.has(l.id) && (l.status || 'active') !== 'lost');
    if (!search) return base.slice(0, 50);
    const q = search.toLowerCase();
    return base
      .filter((l) => l.name.toLowerCase().includes(q) || l.villageCity?.toLowerCase().includes(q) || l.mobileNo?.includes(search))
      .slice(0, 50);
  }, [leads, assignedIds, search]);

  const downloadTemplate = () => {
    const csv = 'name,phone,address\nRavi Kumar,9876543210,MG Road\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assign-visits-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      setCsvPreview([]);
      return;
    }
    setCsvPreview(rows);
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold leading-none">Assign Visits</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Hand a rep a directed list for the day — it lands on their Today's Plan.
          </p>
        </div>
      </div>

      {/* Who + when */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Rep</label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select a rep" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-base">{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Day</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 w-full justify-start gap-2 text-base font-normal">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'EEE, MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {!agentId ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground space-y-2">
            <Users className="h-10 w-10 mx-auto opacity-40" />
            <p className="text-sm font-medium">Pick a rep to build their list</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Build methods */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              size="lg"
              className="h-12 gap-2"
              onClick={() => { setSearch(''); setPickOpen(true); }}
            >
              <Plus className="h-5 w-5" /> Add customers
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5" /> Upload CSV
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2"
              disabled={!priorDate || repeatFrom.isPending}
              onClick={() => priorDate && repeatFrom.mutate(priorDate)}
            >
              {repeatFrom.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
              {priorDate ? `Repeat ${format(new Date(priorDate + 'T00:00:00'), 'MMM d')}` : 'No earlier list'}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
          <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Download className="h-3 w-3" /> Download CSV template
          </button>

          {/* Current list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">
                {agentName ? `${agentName}'s list` : 'Assigned list'} · {format(selectedDate, 'MMM d')}
              </h2>
              <Badge variant="secondary" className="text-xs">{assigned.length} stops</Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : assigned.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground space-y-1">
                  <Send className="h-9 w-9 mx-auto opacity-40" />
                  <p className="text-sm font-medium">Nothing assigned yet</p>
                  <p className="text-xs">Add customers, upload a CSV, or repeat an earlier list.</p>
                </CardContent>
              </Card>
            ) : (
              assigned.map((a, idx) => {
                const done = a.status === 'visited';
                return (
                  <Card key={a.id} className={done ? 'opacity-70' : ''}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-sm font-semibold text-muted-foreground w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${done ? 'line-through' : ''}`}>{a.customerName}</p>
                          {done && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {a.area && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {a.area}</span>}
                          {a.mobileNo && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {a.mobileNo}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive flex-shrink-0"
                        disabled={done || remove.isPending}
                        onClick={() => remove.mutate(a.id)}
                        title={done ? 'Already visited' : 'Remove'}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Manual add picker */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add customers to {agentName || 'the rep'}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-base"
            />
          </div>
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {pickable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No customers found.</p>
            ) : (
              pickable.map((l) => (
                <button
                  key={l.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-muted/50 disabled:opacity-50"
                  disabled={assign.isPending}
                  onClick={() => assign.mutate([l.id])}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    {l.villageCity && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {l.villageCity}
                      </p>
                    )}
                  </div>
                  <Plus className="h-5 w-5 text-primary flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV preview / confirm */}
      <Dialog open={csvPreview !== null} onOpenChange={(o) => !o && setCsvPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign from file</DialogTitle>
          </DialogHeader>
          {csvPreview && csvPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Couldn't read any rows. Use the template — a header row of <code>name,phone,address</code>.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{csvPreview?.length}</span> customers in the file.
                Known ones are matched; new ones are added to your customer list, then all are assigned to{' '}
                <span className="font-medium text-foreground">{agentName}</span>.
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto border rounded-md p-2">
                {csvPreview?.slice(0, 30).map((r, i) => (
                  <div key={i} className="text-sm flex items-center justify-between gap-2">
                    <span className="truncate">{r.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{r.phone || '—'}</span>
                  </div>
                ))}
                {csvPreview && csvPreview.length > 30 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+ {csvPreview.length - 30} more</p>
                )}
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvPreview(null)}>Cancel</Button>
            {csvPreview && csvPreview.length > 0 && (
              <Button
                disabled={uploadCsv.isPending}
                onClick={() => {
                  const rows = csvPreview;
                  uploadCsv.mutate(rows, { onSuccess: () => setCsvPreview(null) });
                }}
              >
                {uploadCsv.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign {csvPreview.length}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
