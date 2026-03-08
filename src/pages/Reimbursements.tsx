import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import {
  useMyReimbursements,
  useTeamReimbursements,
  useAdminReimbursements,
  calculateTotalDistance,
  TravelReimbursement,
  ReimbursementInput,
} from '@/hooks/useReimbursements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Car, Loader2, Plus, CheckCircle2, XCircle, ThumbsUp,
  Calculator, MapPin, Calendar, IndianRupee, Users, Shield,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  recommended: { label: 'Recommended', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Agent: New Claim Form ───
function NewClaimForm({ onSubmit, isSubmitting }: {
  onSubmit: (input: ReimbursementInput) => void;
  isSubmitting: boolean;
}) {
  const { user, currentOrganization } = useAuthStore();
  const [claimDate, setClaimDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [distanceKm, setDistanceKm] = useState('');
  const [routeSummary, setRouteSummary] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [autoDistance, setAutoDistance] = useState<number | null>(null);
  const [visitIds, setVisitIds] = useState<string[]>([]);

  const ratePerKm = useMemo(() => {
    const settings = currentOrganization?.settings as Record<string, any> | null;
    return settings?.reimbursement_rate_per_km || 0;
  }, [currentOrganization]);

  const km = parseFloat(distanceKm) || 0;
  const amount = km * ratePerKm;

  const autoCalculate = async () => {
    if (!user || !currentOrganization || !claimDate) return;
    setCalculating(true);
    try {
      const { data: visits } = await supabase
        .from('visits')
        .select('id, check_in_latitude, check_in_longitude, check_in_time')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'completed')
        .gte('check_in_time', `${claimDate}T00:00:00`)
        .lte('check_in_time', `${claimDate}T23:59:59`)
        .order('check_in_time', { ascending: true });

      if (!visits || visits.length === 0) {
        toast.error('No completed visits found for this date');
        setCalculating(false);
        return;
      }

      const validVisits = visits.filter(v =>
        v.check_in_latitude && v.check_in_longitude &&
        v.check_in_latitude !== 0 && v.check_in_longitude !== 0
      );

      if (validVisits.length < 2) {
        toast.error('Need at least 2 visits with GPS data to calculate distance');
        setCalculating(false);
        return;
      }

      const dist = calculateTotalDistance(
        validVisits.map(v => ({
          check_in_latitude: Number(v.check_in_latitude),
          check_in_longitude: Number(v.check_in_longitude),
        }))
      );

      setAutoDistance(dist);
      setDistanceKm(dist.toString());
      setVisitIds(validVisits.map(v => v.id));
      toast.success(`Calculated ${dist} km from ${validVisits.length} visits`);
    } catch (err) {
      toast.error('Failed to calculate distance');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = () => {
    if (km <= 0) {
      toast.error('Please enter distance travelled');
      return;
    }
    if (ratePerKm <= 0) {
      toast.error('Rate per km is not configured. Ask your admin to set it in Settings.');
      return;
    }
    onSubmit({
      claim_date: claimDate,
      distance_km: km,
      rate_per_km: ratePerKm,
      calculated_amount: amount,
      visit_ids: visitIds,
      route_summary: routeSummary || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Reimbursement Claim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Claim Date</Label>
            <Input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} />
          </div>
          <div>
            <Label>Rate per KM</Label>
            <Input value={ratePerKm > 0 ? `₹ ${ratePerKm}` : 'Not configured'} disabled className="bg-muted/50" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Distance Travelled (KM)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={distanceKm}
              onChange={(e) => { setDistanceKm(e.target.value); setAutoDistance(null); }}
              placeholder="Enter distance in km"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={autoCalculate}
              disabled={calculating}
              className="gap-1.5 whitespace-nowrap"
            >
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Auto Calculate
            </Button>
          </div>
          {autoDistance !== null && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Calculated from {visitIds.length} visit check-in locations
            </p>
          )}
        </div>

        {km > 0 && ratePerKm > 0 && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-sm">
              {km} km × ₹{ratePerKm}/km
            </span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(amount)}</span>
          </div>
        )}

        <div>
          <Label>Route Summary (optional)</Label>
          <Textarea
            value={routeSummary}
            onChange={(e) => setRouteSummary(e.target.value)}
            placeholder="e.g. Office → Client A → Client B → Office"
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={km <= 0 || ratePerKm <= 0 || isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />}
          Submit Claim
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Claim Card (read-only) ───
function ClaimCard({ claim }: { claim: TravelReimbursement }) {
  const st = statusConfig[claim.status] || statusConfig.submitted;
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{format(new Date(claim.claim_date), 'PP')}</span>
        </div>
        <Badge variant="outline" className={st.className}>{st.label}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs block">Distance</span>
          <span className="font-medium">{claim.distance_km} km</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Rate</span>
          <span className="font-medium">₹{claim.rate_per_km}/km</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Amount</span>
          <span className="font-bold text-green-600">{formatCurrency(claim.calculated_amount)}</span>
        </div>
      </div>
      {claim.route_summary && (
        <p className="text-xs text-muted-foreground">{claim.route_summary}</p>
      )}
      {claim.status === 'rejected' && claim.rejection_reason && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">Reason: {claim.rejection_reason}</p>
      )}
      {claim.manager_remarks && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Manager: {claim.manager_remarks}</p>
      )}
    </div>
  );
}

// ─── Agent View ───
function AgentView() {
  const { reimbursements, isLoading, createReimbursement, isSubmitting } = useMyReimbursements();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2">
          <Plus className="h-4 w-4" /> New Reimbursement Claim
        </Button>
      )}

      {showForm && (
        <NewClaimForm
          onSubmit={(input) => {
            createReimbursement(input, {
              onSuccess: () => setShowForm(false),
            });
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading claims...</p>}
      {!isLoading && reimbursements.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No reimbursement claims yet</p>
      )}
      {reimbursements.map(claim => <ClaimCard key={claim.id} claim={claim} />)}
    </div>
  );
}

// ─── Manager View: Recommend ───
function ManagerView() {
  const { reimbursements, isLoading, recommendReimbursement, bulkRecommend, isRecommending, isBulkRecommending } = useTeamReimbursements();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remarks, setRemarks] = useState('');

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === reimbursements.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reimbursements.map(r => r.id)));
    }
  };

  const handleBulkRecommend = () => {
    if (selected.size === 0) return;
    bulkRecommend(Array.from(selected), {
      onSuccess: () => setSelected(new Set()),
    });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">Loading team claims...</p>;
  if (reimbursements.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No pending claims from your team</p>;

  return (
    <div className="space-y-4">
      {reimbursements.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.size === reimbursements.length}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
            </span>
          </div>
          {selected.size > 0 && (
            <Button
              size="sm"
              onClick={handleBulkRecommend}
              disabled={isBulkRecommending}
              className="gap-1.5"
            >
              {isBulkRecommending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
              Recommend {selected.size}
            </Button>
          )}
        </div>
      )}

      {reimbursements.map(claim => (
        <div key={claim.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.has(claim.id)}
              onCheckedChange={() => toggleSelect(claim.id)}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{claim.agent_name}</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(claim.calculated_amount)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(claim.claim_date), 'PP')} — {claim.distance_km} km × ₹{claim.rate_per_km}/km
              </div>
              {claim.route_summary && (
                <p className="text-xs text-muted-foreground mt-1">{claim.route_summary}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="flex-1 gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" /> Recommend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recommend Reimbursement</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <p className="text-sm">
                    {claim.agent_name} — {claim.distance_km} km — {formatCurrency(claim.calculated_amount)}
                  </p>
                  <div>
                    <Label>Remarks (optional)</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Any remarks for HQ..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      onClick={() => recommendReimbursement({ id: claim.id, remarks })}
                      disabled={isRecommending}
                    >
                      Recommend
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Admin/HQ View: Approve/Reject ───
function AdminView() {
  const {
    reimbursements, isLoading,
    approveReimbursement, rejectReimbursement,
    bulkApprove, bulkReject,
    isApproving, isRejecting, isBulkApproving, isBulkRejecting,
  } = useAdminReimbursements();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('recommended');
  const [rejectionReason, setRejectionReason] = useState('');

  const filtered = useMemo(() =>
    filterStatus === 'all'
      ? reimbursements
      : reimbursements.filter(r => r.status === filterStatus),
    [reimbursements, filterStatus]
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectableIds = filtered.filter(r => r.status === 'recommended' || r.status === 'submitted').map(r => r.id);

  const toggleAll = () => {
    if (selected.size === selectableIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  };

  const handleBulkApprove = () => {
    if (selected.size === 0) return;
    bulkApprove(Array.from(selected), {
      onSuccess: () => setSelected(new Set()),
    });
  };

  const handleBulkReject = () => {
    if (selected.size === 0) return;
    bulkReject({ ids: Array.from(selected), reason: rejectionReason || undefined }, {
      onSuccess: () => { setSelected(new Set()); setRejectionReason(''); },
    });
  };

  const totalPending = reimbursements.filter(r => r.status === 'recommended' || r.status === 'submitted').length;
  const totalApproved = reimbursements.filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.calculated_amount, 0);

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-8">Loading all claims...</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Pending Approval</div>
          <div className="text-2xl font-bold">{totalPending}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Total Approved</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['recommended', 'submitted', 'approved', 'rejected', 'all'].map(s => (
          <Button
            key={s}
            size="sm"
            variant={filterStatus === s ? 'default' : 'outline'}
            onClick={() => { setFilterStatus(s); setSelected(new Set()); }}
            className="text-xs capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium flex-1">{selected.size} selected</span>
          <Button size="sm" onClick={handleBulkApprove} disabled={isBulkApproving} className="gap-1.5">
            {isBulkApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve All
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Reject All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject {selected.size} Claims</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={2}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={handleBulkReject} disabled={isBulkRejecting}>
                    Reject {selected.size} Claims
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Select all */}
      {selectableIds.length > 1 && (filterStatus === 'recommended' || filterStatus === 'submitted') && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selected.size === selectableIds.length && selectableIds.length > 0}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>
      )}

      {/* Claims list */}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No claims in this category</p>
      )}
      {filtered.map(claim => {
        const st = statusConfig[claim.status] || statusConfig.submitted;
        const canAct = claim.status === 'recommended' || claim.status === 'submitted';
        return (
          <div key={claim.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {canAct && (
                <Checkbox
                  checked={selected.has(claim.id)}
                  onCheckedChange={() => toggleSelect(claim.id)}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{claim.agent_name}</span>
                  <Badge variant="outline" className={st.className}>{st.label}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(claim.claim_date), 'PP')} — {claim.distance_km} km × ₹{claim.rate_per_km}/km
                  </span>
                  <span className="font-bold text-green-600">{formatCurrency(claim.calculated_amount)}</span>
                </div>
                {claim.route_summary && (
                  <p className="text-xs text-muted-foreground mt-1">{claim.route_summary}</p>
                )}
                {claim.manager_remarks && (
                  <p className="text-xs text-amber-600 mt-1">Manager: {claim.manager_remarks}</p>
                )}
                {claim.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {claim.rejection_reason}</p>
                )}
              </div>
            </div>
            {canAct && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => approveReimbursement(claim.id)}
                  disabled={isApproving}
                  className="flex-1 gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive hover:text-destructive">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Reject Claim</DialogTitle></DialogHeader>
                    <div className="py-2">
                      <Label>Reason (optional)</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        rows={2}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <DialogClose asChild>
                        <Button
                          variant="destructive"
                          onClick={() => rejectReimbursement({ id: claim.id, reason: rejectionReason })}
                        >
                          Reject
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───
export default function Reimbursements() {
  const { user } = useAuthStore();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function checkAccess() {
      setLoading(true);
      const [rolesRes, reportsRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user!.id),
        supabase.from('profiles').select('id').eq('reporting_manager_id', user!.id).limit(1),
      ]);
      setUserRoles(rolesRes.data?.map(r => r.role) || []);
      setIsManager((reportsRes.data?.length || 0) > 0);
      setLoading(false);
    }
    checkAccess();
  }, [user]);

  const isAdmin = userRoles.some(r => ['admin', 'super_admin', 'platform_admin'].includes(r));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine which tabs to show
  const tabs: { value: string; label: string; icon: any }[] = [
    { value: 'my-claims', label: 'My Claims', icon: Car },
  ];
  if (isManager) tabs.push({ value: 'team', label: 'Team Claims', icon: Users });
  if (isAdmin) tabs.push({ value: 'approvals', label: 'All Approvals', icon: Shield });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          Travel Reimbursements
        </h1>
        <p className="text-muted-foreground mt-1">
          Claim travel expenses based on distance travelled
        </p>
      </div>

      <Tabs defaultValue="my-claims">
        <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="my-claims" className="pt-4">
          <AgentView />
        </TabsContent>

        {isManager && (
          <TabsContent value="team" className="pt-4">
            <ManagerView />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="approvals" className="pt-4">
            <AdminView />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
