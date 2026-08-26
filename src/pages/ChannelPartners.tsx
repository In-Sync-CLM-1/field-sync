import { useState } from 'react';
import {
  useDSAs, useSubDSAs, useDSAMutations, DSAListItem,
} from '@/hooks/useDSAs';
import { useChannelProductivity, useChannelAlerts, useResolveChannelAlert } from '@/hooks/useChannelActivity';

import {
  Network, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, Phone,
  BarChart3, AlertTriangle, CheckCircle2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DSADraft { id?: string; name: string; contact_name: string; contact_phone: string; is_active: boolean; }
const emptyDraft = (): DSADraft => ({ name: '', contact_name: '', contact_phone: '', is_active: true });

export default function ChannelPartners() {
  const { data: dsas = [], isLoading } = useDSAs();
  const { saveDSA, deleteDSA } = useDSAMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DSADraft>(emptyDraft());
  const [deleteTarget, setDeleteTarget] = useState<DSAListItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openNew = () => { setDraft(emptyDraft()); setEditorOpen(true); };
  const openEdit = (d: DSAListItem) => {
    setDraft({ id: d.id, name: d.name, contact_name: d.contact_name || '', contact_phone: d.contact_phone || '', is_active: d.is_active });
    setEditorOpen(true);
  };

  const handleSave = () => {
    saveDSA.mutate(
      { id: draft.id, name: draft.name, contact_name: draft.contact_name, contact_phone: draft.contact_phone, is_active: draft.is_active },
      { onSuccess: () => setEditorOpen(false) },
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">DSA Channels</h1>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> New DSA
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Corporate DSAs and their Sub-DSAs. Each gets a unique code, used to source and trace visits, leads and business.
      </p>

      <Tabs defaultValue="dsas">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dsas">DSAs</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
        </TabsList>

        <TabsContent value="dsas" className="space-y-2 mt-4">
          {isLoading && (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!isLoading && dsas.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground space-y-2">
                <Network className="h-10 w-10 mx-auto opacity-40" />
                <p className="text-sm font-medium">No DSAs yet</p>
                <p className="text-xs">Add a Corporate DSA, then add its Sub-DSAs underneath.</p>
              </CardContent>
            </Card>
          )}

          {dsas.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <button
                    className="flex items-start gap-2 min-w-0 text-left flex-1"
                    onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  >
                    {expanded === d.id ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{d.name}</p>
                        <Badge variant="outline" className="text-[10px] font-mono">{d.code}</Badge>
                        {!d.is_active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.sub_dsa_count} Sub-DSA{d.sub_dsa_count === 1 ? '' : 's'}
                        {d.contact_name && ` · ${d.contact_name}`}
                        {d.contact_phone && ` · ${d.contact_phone}`}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteTarget(d)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expanded === d.id && <SubDSAPanel dsaId={d.id} />}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="productivity" className="mt-4">
          <ProductivityView />
        </TabsContent>

        <TabsContent value="escalations" className="mt-4">
          <EscalationsView />
        </TabsContent>
      </Tabs>

      {/* ───── DSA editor ───── */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? 'Edit DSA' : 'New Corporate DSA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>DSA name</Label>
              <Input
                placeholder="e.g. Prestige Financial Services"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact name</Label>
                <Input value={draft.contact_name} onChange={(e) => setDraft((p) => ({ ...p, contact_name: e.target.value }))} />
              </div>
              <div>
                <Label>Contact phone</Label>
                <Input value={draft.contact_phone} onChange={(e) => setDraft((p) => ({ ...p, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft((p) => ({ ...p, is_active: v }))} />
            </div>
            {!draft.id && <p className="text-xs text-muted-foreground">A DSA code is generated automatically on save.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!draft.name.trim() || saveDSA.isPending}>
              {saveDSA.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save DSA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this DSA?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" ({deleteTarget?.code}) will be removed. It must have no Sub-DSAs left first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteDSA.mutate(deleteTarget.id); setDeleteTarget(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SubDSAPanel({ dsaId }: { dsaId: string }) {
  const { data: subs = [], isLoading } = useSubDSAs(dsaId);
  const { addSubDSA, toggleSubDSAActive, deleteSubDSA } = useDSAMutations();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addSubDSA.mutate({ dsa_id: dsaId, name, phone }, { onSuccess: () => { setName(''); setPhone(''); } });
  };

  return (
    <div className="mt-3 pl-6 border-l-2 border-muted space-y-2">
      {isLoading && <p className="text-xs text-muted-foreground">Loading Sub-DSAs…</p>}
      {!isLoading && subs.length === 0 && <p className="text-xs text-muted-foreground">No Sub-DSAs yet.</p>}
      {subs.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-sm py-1">
          <Badge variant="outline" className="text-[10px] font-mono">{s.code}</Badge>
          <span className="flex-1 truncate">{s.name}</span>
          {s.phone && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Phone className="h-3 w-3" />{s.phone}</span>}
          <Switch
            checked={s.is_active}
            onCheckedChange={(v) => toggleSubDSAActive.mutate({ id: s.id, is_active: v })}
            className="scale-75"
          />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteSubDSA.mutate(s.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Input placeholder="New Sub-DSA name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-sm w-32" />
        <Button size="sm" className="h-8" disabled={!name.trim() || addSubDSA.isPending} onClick={handleAdd}>
          {addSubDSA.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function ProductivityView() {
  const { data: rows = [], isLoading } = useChannelProductivity();
  if (isLoading) {
    return <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground space-y-2">
          <BarChart3 className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">No DSA/Sub-DSA activity yet</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-2">Channel</th>
            <th className="py-2 px-2 text-right">Visits</th>
            <th className="py-2 px-2 text-right">Leads</th>
            <th className="py-2 px-2 text-right">Logins</th>
            <th className="py-2 px-2 text-right">Sanctions</th>
            <th className="py-2 pl-2 text-right">Disbursement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-2">
                <span className={r.kind === 'sub_dsa' ? 'pl-4 text-muted-foreground' : 'font-medium'}>{r.name}</span>
                <Badge variant="outline" className="ml-2 text-[10px] font-mono">{r.code}</Badge>
              </td>
              <td className="py-2 px-2 text-right">{r.visits}</td>
              <td className="py-2 px-2 text-right">{r.leads}</td>
              <td className="py-2 px-2 text-right">{r.logins}</td>
              <td className="py-2 px-2 text-right">{r.sanctions}{r.sanctionAmount > 0 && <span className="text-xs text-muted-foreground"> ({inr(r.sanctionAmount)})</span>}</td>
              <td className="py-2 pl-2 text-right">{r.disbursements}{r.disbursementAmount > 0 && <span className="text-xs text-muted-foreground"> ({inr(r.disbursementAmount)})</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SCENARIO_LABEL: Record<string, string> = {
  low_visit_activity: 'Low Visit Activity',
  no_visit_activity: 'No Visit Activity',
  visits_no_business: 'Visits but No Business',
  high_visits_low_conversion: 'High Visits, Low Conversion',
  inactive_channel: 'Inactive Channel',
};

function EscalationsView() {
  const { data: alerts = [], isLoading } = useChannelAlerts();
  const resolve = useResolveChannelAlert();
  const open = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved).slice(0, 20);

  if (isLoading) {
    return <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Open ({open.length})
        </p>
        {open.length === 0 ? (
          <p className="text-xs text-muted-foreground">No open escalations. Checked daily.</p>
        ) : (
          <div className="space-y-2">
            {open.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={a.level >= 3 ? 'destructive' : 'outline'} className="text-[10px]">Level {a.level}</Badge>
                      <span className="text-sm font-medium">{SCENARIO_LABEL[a.scenario] || a.scenario}</span>
                      {a.needs_review && <Badge variant="destructive" className="text-[10px]">Needs review</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0" disabled={resolve.isPending} onClick={() => resolve.mutate(a.id)}>
                    Resolve
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Recently resolved
          </p>
          <div className="space-y-1">
            {resolved.map((a) => (
              <div key={a.id} className="text-xs text-muted-foreground py-1 border-b last:border-0">
                {SCENARIO_LABEL[a.scenario] || a.scenario} — {a.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
