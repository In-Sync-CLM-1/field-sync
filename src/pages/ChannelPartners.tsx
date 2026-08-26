import { useState } from 'react';
import {
  useDSAs, useSubDSAs, useDSAMutations, DSAListItem,
} from '@/hooks/useDSAs';

import {
  Network, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, Phone,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
