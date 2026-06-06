import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import {
  useBeats, useBeat, useBeatMutations, useOrgMembers,
  useCoverage, BeatListItem, BeatInput, Cadence,
} from '@/hooks/useBeats';

import {
  Route as RouteIcon, Plus, Pencil, Trash2, Search, MapPin, GripVertical,
  ArrowUp, ArrowDown, X, Users, AlertTriangle, Loader2, Navigation,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const cadenceLabel = (c: Cadence) =>
  c === 'weekly' ? 'Weekly' : c === 'fortnightly' ? 'Fortnightly' : 'Monthly';

interface DraftCustomer { id: string; name: string; area?: string; hasLocation: boolean; }

const emptyDraft = (): BeatInput & { customers: DraftCustomer[] } => ({
  name: '', agent_id: '', weekdays: [], cadence: 'weekly', week_parity: 0, week_of_month: 1,
  active: true, customer_ids: [], customers: [],
});

export default function Beats() {
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const { data: beats = [], isLoading } = useBeats();
  const { data: members = [] } = useOrgMembers();
  const { saveBeat, toggleActive, deleteBeat } = useBeatMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<BeatInput & { customers: DraftCustomer[] }>(emptyDraft());
  const [custSearch, setCustSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BeatListItem | null>(null);

  const { data: editing } = useBeat(editId);

  // Local customer cache for the search-add picker.
  const leads = useLiveQuery(async () => {
    if (!currentOrganization) return [];
    return db.leads.where('organizationId').equals(currentOrganization.id).toArray();
  }, [currentOrganization?.id]) || [];

  const openNew = () => {
    setEditId(undefined);
    setDraft(emptyDraft());
    setCustSearch('');
    setEditorOpen(true);
  };

  const openEdit = (b: BeatListItem) => {
    setEditId(b.id);
    // Seed the draft from the list row; customer list fills in once useBeat loads (effect below).
    setDraft({
      id: b.id, name: b.name, agent_id: b.agent_id, weekdays: b.weekdays || [],
      cadence: b.cadence, week_parity: b.week_parity, week_of_month: b.week_of_month,
      active: b.active, customer_ids: [], customers: [],
    });
    setCustSearch('');
    setEditorOpen(true);
  };

  // When the full beat (with customers) loads, hydrate the draft's customer list + fields.
  useEffect(() => {
    if (!editId || !editing || editing.beat.id !== editId) return;
    const customers = editing.customers.map((c) => ({
      id: c.customer_id, name: c.name, area: c.area, hasLocation: c.has_location,
    }));
    setDraft((d) => ({
      ...d,
      name: editing.beat.name,
      agent_id: editing.beat.agent_id,
      weekdays: editing.beat.weekdays || [],
      cadence: editing.beat.cadence,
      week_parity: editing.beat.week_parity,
      week_of_month: editing.beat.week_of_month,
      active: editing.beat.active,
      customers,
      customer_ids: customers.map((c) => c.id),
    }));
  }, [editId, editing]);

  const toggleWeekday = (d: number) => {
    setDraft((p) => ({
      ...p,
      weekdays: p.weekdays.includes(d) ? p.weekdays.filter((x) => x !== d) : [...p.weekdays, d].sort(),
    }));
  };

  const addCustomer = (l: any) => {
    if (draft.customers.find((c) => c.id === l.id)) return;
    const c: DraftCustomer = { id: l.id, name: l.name, area: l.villageCity || l.district, hasLocation: !!(l.latitude && l.longitude) };
    setDraft((p) => ({ ...p, customers: [...p.customers, c], customer_ids: [...p.customer_ids, l.id] }));
  };
  const removeCustomer = (id: string) => {
    setDraft((p) => ({ ...p, customers: p.customers.filter((c) => c.id !== id), customer_ids: p.customer_ids.filter((x) => x !== id) }));
  };
  const move = (idx: number, dir: -1 | 1) => {
    setDraft((p) => {
      const arr = [...p.customers];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...p, customers: arr, customer_ids: arr.map((c) => c.id) };
    });
  };

  const pickable = useMemo(() => {
    const chosen = new Set(draft.customers.map((c) => c.id));
    const base = leads.filter((l) => !chosen.has(l.id) && (l.status || 'active') !== 'lost');
    if (!custSearch) return base.slice(0, 30);
    const q = custSearch.toLowerCase();
    return base.filter((l) => l.name.toLowerCase().includes(q) || l.villageCity?.toLowerCase().includes(q)).slice(0, 30);
  }, [leads, draft.customers, custSearch]);

  const canSave = draft.name.trim() && draft.agent_id && draft.weekdays.length > 0;

  const handleSave = () => {
    saveBeat.mutate(
      {
        id: draft.id, name: draft.name, agent_id: draft.agent_id, weekdays: draft.weekdays,
        cadence: draft.cadence, week_parity: draft.week_parity, week_of_month: draft.week_of_month,
        active: draft.active, customer_ids: draft.customer_ids,
      },
      { onSuccess: () => setEditorOpen(false) },
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Beat Plan</h1>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> New Beat
        </Button>
      </div>

      <Tabs defaultValue="beats">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="beats">Beats</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>

        {/* ───── Beats list ───── */}
        <TabsContent value="beats" className="space-y-2 mt-4">
          {isLoading && (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!isLoading && beats.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground space-y-2">
                <RouteIcon className="h-10 w-10 mx-auto opacity-40" />
                <p className="text-sm font-medium">No beats yet</p>
                <p className="text-xs">Create a recurring route and assign it to a rep.</p>
              </CardContent>
            </Card>
          )}
          {beats.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{b.name}</p>
                      {!b.active && <Badge variant="outline" className="text-[10px]">Paused</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.agent_name} · {cadenceLabel(b.cadence)} · {b.customer_count} customers
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {WEEKDAYS.map((w, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            b.weekdays?.includes(i) ? 'bg-primary/15 text-primary font-medium' : 'bg-muted text-muted-foreground/50'
                          }`}
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={b.active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: b.id, active: v })}
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteTarget(b)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ───── Coverage ───── */}
        <TabsContent value="coverage" className="mt-4">
          <CoverageView />
        </TabsContent>
      </Tabs>

      {/* ───── Beat editor ───── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? 'Edit beat' : 'New beat'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Beat name</Label>
              <Input
                placeholder="e.g. Koramangala – Mon/Thu"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Assign to rep</Label>
              <Select value={draft.agent_id} onValueChange={(v) => setDraft((p) => ({ ...p, agent_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a rep" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visit days</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {WEEKDAYS.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      draft.weekdays.includes(i)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Repeats</Label>
                <Select value={draft.cadence} onValueChange={(v) => setDraft((p) => ({ ...p, cadence: v as Cadence }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Every week</SelectItem>
                    <SelectItem value="fortnightly">Every other week</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.cadence === 'fortnightly' && (
                <div>
                  <Label>Which week</Label>
                  <Select value={String(draft.week_parity)} onValueChange={(v) => setDraft((p) => ({ ...p, week_parity: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Week A</SelectItem>
                      <SelectItem value="1">Week B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {draft.cadence === 'monthly' && (
                <div>
                  <Label>Week of month</Label>
                  <Select value={String(draft.week_of_month)} onValueChange={(v) => setDraft((p) => ({ ...p, week_of_month: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{['1st', '2nd', '3rd', '4th', '5th'][n - 1]} week</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft((p) => ({ ...p, active: v }))} />
            </div>

            {/* Ordered customer list */}
            <div>
              <Label>Customers on this route ({draft.customers.length})</Label>
              <div className="space-y-1 mt-1">
                {draft.customers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{idx + 1}. {c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        {c.area}
                        {!c.hasLocation && (
                          <span className="text-amber-600 flex items-center gap-0.5">
                            <Navigation className="h-3 w-3" /> no location
                          </span>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === 0} onClick={() => move(idx, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === draft.customers.length - 1} onClick={() => move(idx, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeCustomer(c.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Search-add */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Add customers…" value={custSearch} onChange={(e) => setCustSearch(e.target.value)} className="pl-9" />
              </div>
              {custSearch && (
                <div className="space-y-1 mt-1 max-h-48 overflow-y-auto border rounded-md p-1">
                  {pickable.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No matches</p>
                  ) : (
                    pickable.map((l) => (
                      <button
                        key={l.id}
                        className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/60"
                        onClick={() => addCustomer(l)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{l.name}</p>
                          {l.villageCity && (
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {l.villageCity}
                            </p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || saveBeat.isPending}>
              {saveBeat.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save beat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this beat?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and its customer list will be removed. Plans already generated for past days are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteBeat.mutate(deleteTarget.id); setDeleteTarget(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CoverageView() {
  const { data, isLoading } = useCoverage(14);
  if (isLoading || !data) {
    return <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  const { orphans, perRep, adherence } = data;
  const pct = adherence.planned > 0 ? Math.round((adherence.visited / adherence.planned) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Adherence */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-2">Adherence · last {adherence.days} days</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-2xl font-bold">{adherence.planned}</p><p className="text-xs text-muted-foreground">Planned</p></div>
            <div><p className="text-2xl font-bold text-green-600">{adherence.visited}</p><p className="text-xs text-muted-foreground">Visited</p></div>
            <div><p className="text-2xl font-bold text-amber-600">{adherence.skipped}</p><p className="text-xs text-muted-foreground">Skipped</p></div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-green-600" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{pct}% of planned visits completed</p>
        </CardContent>
      </Card>

      {/* Per rep */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1"><Users className="h-4 w-4" /> Beats per rep</p>
          {perRep.length === 0 ? (
            <p className="text-xs text-muted-foreground">No beats assigned yet.</p>
          ) : (
            <div className="space-y-1">
              {perRep.map((r) => (
                <div key={r.agent_id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{r.agent_name}</span>
                  <span className="text-muted-foreground text-xs">{r.beats} beats · {r.customers} customers</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orphans */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Customers on no beat ({orphans.length})
          </p>
          {orphans.length === 0 ? (
            <p className="text-xs text-muted-foreground">Every active customer is covered by a beat. 🎉</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {orphans.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span className="truncate">{o.name}</span>
                  {o.area && <span className="text-muted-foreground text-xs flex-shrink-0 ml-2">{o.area}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
