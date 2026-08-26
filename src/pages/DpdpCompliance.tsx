import { useState } from 'react';
import {
  usePiiAccessLog, useDataRequests, useDataRequestMutations,
  useBreachNotifications, useReportBreach, useConsentRecords, DataRequest,
} from '@/hooks/useDpdp';

import {
  ShieldCheck, Download, Eye, Users, CalendarDays, Loader2, AlertTriangle,
  ShieldAlert, CheckCircle2, Plus, FileText,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function DpdpCompliance() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <span className="text-xs font-medium text-primary uppercase tracking-wider">Admin</span>
        <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          DPDP Compliance
        </h1>
        <p className="text-sm text-muted-foreground">Personal data protection — audit trail, data-principal requests, and breach reporting under the DPDP Act 2023.</p>
      </div>

      <Tabs defaultValue="audit">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="breach">Breach Reporting</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="mt-4"><AuditLogView /></TabsContent>
        <TabsContent value="requests" className="mt-4"><DataRequestsView /></TabsContent>
        <TabsContent value="breach" className="mt-4"><BreachView /></TabsContent>
      </Tabs>
    </div>
  );
}

function AuditLogView() {
  const { data: logs = [], isLoading } = usePiiAccessLog();
  const { data: consents = [] } = useConsentRecords();

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = logs.filter((l) => l.accessed_at.startsWith(today)).length;
  const uniqueUsers = new Set(logs.map((l) => l.user_id)).size;

  const statCards = [
    { label: 'Total PII Accesses', value: logs.length, icon: Eye },
    { label: 'Today', value: todayCount, icon: CalendarDays },
    { label: 'Staff Involved', value: uniqueUsers, icon: Users },
    { label: 'Consents on Record', value: consents.length, icon: ShieldCheck },
  ];

  const exportCsv = () => {
    if (!logs.length) return;
    const rows = logs.map((l) => ({
      'Accessed At': format(new Date(l.accessed_at), 'dd MMM yyyy HH:mm:ss'),
      Table: l.table_name, Column: l.column_name, Record: l.record_id || '-', Purpose: l.purpose,
    }));
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => (r as any)[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dpdp-audit-log-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <Card key={c.label} className="border-l-4 border-l-primary">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                  <p className="text-2xl font-display font-semibold mt-0.5">{c.value}</p>
                </div>
                <c.icon className="h-5 w-5 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> PII Access Log ({logs.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={isLoading || !logs.length} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 px-3">Accessed At</th>
                    <th className="py-2 px-3">Table</th>
                    <th className="py-2 px-3">Column</th>
                    <th className="py-2 px-3">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-xs whitespace-nowrap">{format(new Date(l.accessed_at), 'dd MMM yyyy HH:mm')}</td>
                      <td className="py-2 px-3 font-mono text-xs">{l.table_name}</td>
                      <td className="py-2 px-3 font-mono text-xs">{l.column_name}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]">{l.purpose}</Badge></td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No PII access recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const REQUEST_TYPE_LABEL: Record<string, string> = {
  access: 'Right to Access', correction: 'Right to Correction', erasure: 'Right to Erasure',
  withdraw_consent: 'Withdraw Consent', nominate: 'Right to Nominate',
};

function DataRequestsView() {
  const { data: requests = [], isLoading } = useDataRequests();
  const { logRequest, updateStatus } = useDataRequestMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ request_type: DataRequest['request_type']; subject_name: string; subject_contact: string; details: string }>({
    request_type: 'access', subject_name: '', subject_contact: '', details: '',
  });

  const handleLog = () => {
    logRequest.mutate(form, { onSuccess: () => { setOpen(false); setForm({ request_type: 'access', subject_name: '', subject_contact: '', details: '' }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">A data principal's request, logged by staff, must be resolved within 90 days per the DPDP Act.</p>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Log Request</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground space-y-2">
          <FileText className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">No data requests logged</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => {
            const overdue = r.status !== 'completed' && r.status !== 'rejected' && new Date(r.due_date) < new Date();
            return (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{REQUEST_TYPE_LABEL[r.request_type]}</span>
                      <Badge variant={r.status === 'completed' ? 'default' : overdue ? 'destructive' : 'outline'} className="text-[10px]">
                        {overdue ? 'Overdue' : r.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.subject_name} · {r.subject_contact}</p>
                    {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">Due {format(new Date(r.due_date), 'dd MMM yyyy')}</p>
                  </div>
                  {r.status !== 'completed' && r.status !== 'rejected' && (
                    <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as DataRequest['status'] })}>
                      <SelectTrigger className="h-8 w-32 text-xs flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log a Data Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Request type</Label>
              <Select value={form.request_type} onValueChange={(v) => setForm((p) => ({ ...p, request_type: v as DataRequest['request_type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REQUEST_TYPE_LABEL).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Name</Label><Input placeholder="Full name" value={form.subject_name} onChange={(e) => setForm((p) => ({ ...p, subject_name: e.target.value }))} /></div>
            <div><Label>Contact (phone/email)</Label><Input placeholder="Mobile number or email" value={form.subject_contact} onChange={(e) => setForm((p) => ({ ...p, subject_contact: e.target.value }))} /></div>
            <div><Label>Details (optional)</Label><Textarea placeholder="Any additional context" value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleLog} disabled={!form.subject_name || !form.subject_contact || logRequest.isPending}>
              {logRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Log Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BreachView() {
  const { data: notifications = [], isLoading } = useBreachNotifications();
  const reportBreach = useReportBreach();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', impact: '', remedial_steps: '', contact_info: 'dpo@in-sync.co.in' });

  const canSubmit = form.title && form.description && form.impact && form.remedial_steps;

  return (
    <div className="space-y-4 max-w-2xl">
      {!showForm ? (
        <Button variant="destructive" onClick={() => setShowForm(true)} className="gap-1.5">
          <ShieldAlert className="h-4 w-4" /> Report a Data Breach
        </Button>
      ) : (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Report Data Breach</CardTitle>
            <CardDescription>As per the DPDP Act 2023, breach notifications must be in clear, plain language.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Brief title of the breach" /></div>
            <div><Label>What happened *</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Impact on data principals *</Label><Textarea value={form.impact} onChange={(e) => setForm((p) => ({ ...p, impact: e.target.value }))} /></div>
            <div><Label>Remedial steps taken *</Label><Textarea value={form.remedial_steps} onChange={(e) => setForm((p) => ({ ...p, remedial_steps: e.target.value }))} /></div>
            <div><Label>Contact for queries *</Label><Input value={form.contact_info} onChange={(e) => setForm((p) => ({ ...p, contact_info: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="destructive" disabled={!canSubmit || reportBreach.isPending} onClick={() => reportBreach.mutate(form, { onSuccess: () => setShowForm(false) })}>
                {reportBreach.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Breach Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <h3 className="font-semibold text-sm mt-6">Past Breach Notifications</h3>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> No breach notifications recorded</p>
      ) : (
        notifications.map((n) => (
          <Card key={n.id}>
            <CardContent className="p-3 space-y-1">
              <p className="font-semibold text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(n.triggered_at), 'dd MMM yyyy HH:mm')}</p>
              <p className="text-sm">{n.description}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
