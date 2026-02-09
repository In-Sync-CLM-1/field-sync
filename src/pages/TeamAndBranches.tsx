import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarIcon, Users, Edit2, Save, X, Cloud, CloudOff, ArrowLeft, 
  Building2, Plus, MapPin, Phone, Mail, Trash2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { 
  useTeamPlansOffline, 
  useCorrectPlanOffline, 
  useMyPlanOffline, 
  useCreatePlanOffline, 
  useUpdatePlanOffline 
} from '@/hooks/useDailyPlansOffline';
import { useTeamStats } from '@/hooks/useDashboardData';
import { DailyPlanLocal } from '@/lib/db';
import { useBranches } from '@/hooks/useBranches';
import { Switch } from '@/components/ui/switch';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendingUp, CheckCircle } from 'lucide-react';

export default function TeamAndBranches() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('team');

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Team & Branches</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-12 p-1 bg-muted">
          <TabsTrigger 
            value="team" 
            className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4" />
            Team Planning
          </TabsTrigger>
          <TabsTrigger 
            value="branches" 
            className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="h-4 w-4" />
            Branches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <TeamPlanningTab />
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          <BranchesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Team Planning Tab Component
function TeamPlanningTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: teamPlans, isLoading, isOnline } = useTeamPlansOffline(planDate);
  const { data: myPlan } = useMyPlanOffline(planDate);
  const { data: teamStats } = useTeamStats();
  const correctPlan = useCorrectPlanOffline();
  const createPlan = useCreatePlanOffline();
  const updatePlan = useUpdatePlanOffline();

  const [managerTargets, setManagerTargets] = useState({ life_insurance_target: 0, health_insurance_target: 0 });

  const aggregates = teamPlans?.reduce((acc, plan) => ({
    prospects: acc.prospects + plan.prospectsTarget,
    quotes: acc.quotes + plan.quotesTarget,
    policies: acc.policies + plan.policiesTarget,
  }), { prospects: 0, quotes: 0, policies: 0 }) || { prospects: 0, quotes: 0, policies: 0 };

  const handleStartEdit = (plan: DailyPlanLocal) => {
    setEditingPlanId(plan.id);
    setEditValues({
      prospects_target: plan.prospectsTarget,
      quotes_target: plan.quotesTarget,
      policies_target: plan.policiesTarget,
    });
  };

  const handleSaveEdit = async (plan: DailyPlanLocal) => {
    await correctPlan.mutateAsync({
      id: plan.id,
      prospects_target: editValues.prospects_target,
      quotes_target: editValues.quotes_target,
      policies_target: editValues.policies_target,
      original: plan,
    });
    setEditingPlanId(null);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditValues({});
  };

  const handleSaveManagerTargets = async () => {
    if (myPlan) {
      await updatePlan.mutateAsync({
        id: myPlan.id,
        life_insurance_target: managerTargets.life_insurance_target,
        health_insurance_target: managerTargets.health_insurance_target,
      });
    } else {
      await createPlan.mutateAsync({
        plan_date: planDate,
        prospects_target: 0,
        quotes_target: 0,
        policies_target: 0,
        life_insurance_target: managerTargets.life_insurance_target,
        health_insurance_target: managerTargets.health_insurance_target,
      });
    }
  };

  const getUserName = (plan: DailyPlanLocal) => {
    // For now use userId - in a full implementation we'd store user info locally
    return plan.userId.substring(0, 8) + '...';
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "text-xs";
    switch (status) {
      case 'draft': return <Badge variant="outline" className={baseClass}>Draft</Badge>;
      case 'submitted': return <Badge className={cn(baseClass, "bg-primary text-primary-foreground")}>Submitted</Badge>;
      case 'corrected': return <Badge className={cn(baseClass, "bg-warning text-warning-foreground")}>Corrected</Badge>;
      case 'approved': return <Badge className={cn(baseClass, "bg-success text-success-foreground")}>Approved</Badge>;
      default: return <Badge variant="outline" className={baseClass}>{status}</Badge>;
    }
  };

  const getSyncBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return <Cloud className="h-3 w-3 text-success" />;
      case 'pending': return <CloudOff className="h-3 w-3 text-warning" />;
      case 'failed': return <CloudOff className="h-3 w-3 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Team Stats */}
      {teamStats && (
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Visits Today" value={teamStats.totalVisitsToday} icon={MapPin} subtitle="Team total" />
          <MetricCard title="Active Agents" value={teamStats.activeAgents} icon={Users} subtitle="Working" />
          <MetricCard title="Completion" value={`${teamStats.completionRate}%`} icon={CheckCircle} subtitle="All time" />
          <MetricCard title="Last 30 Days" value={teamStats.visitsLast30Days} icon={TrendingUp} subtitle="Total" />
        </div>
      )}

      {/* Planning Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Plans: {teamPlans?.length || 0}</span>
          {!isOnline && (
            <Badge variant="outline" className="text-xs h-5 bg-muted text-muted-foreground">
              <CloudOff className="h-3 w-3 mr-1" />Offline
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {format(selectedDate, 'MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Aggregates */}
      <div className="flex items-center gap-3 p-2 bg-primary/5 rounded border border-primary/10">
        <span className="text-xs font-medium text-muted-foreground">Totals:</span>
        <div className="stats-row">
          <div className="stat-badge bg-primary/10 text-primary">Prospects: {aggregates.prospects}</div>
          <div className="stat-badge bg-primary/10 text-primary">Quotes: {aggregates.quotes}</div>
          <div className="stat-badge bg-primary/10 text-primary">Sales: {aggregates.policies}</div>
        </div>
      </div>

      {/* Team Plans Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : teamPlans && teamPlans.length > 0 ? (
            <Table className="compact-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-2 px-3 text-xs">Agent</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Prospects</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Quotes</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Policies</TableHead>
                  <TableHead className="py-2 px-3 text-xs">Status</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-center">Sync</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPlans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-muted/30">
                    <TableCell className="py-1.5 px-3 text-sm font-medium">{getUserName(plan)}</TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-right">
                      {editingPlanId === plan.id ? (
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.prospects_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, prospects_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.prospectsTarget}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-right">
                      {editingPlanId === plan.id ? (
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.quotes_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quotes_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.quotesTarget}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-right">
                      {editingPlanId === plan.id ? (
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.policies_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, policies_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.policiesTarget}
                    </TableCell>
                    <TableCell className="py-1.5 px-3">{getStatusBadge(plan.status)}</TableCell>
                    <TableCell className="py-1.5 px-3 text-center">{getSyncBadge(plan.syncStatus)}</TableCell>
                    <TableCell className="py-1.5 px-3 text-right">
                      {editingPlanId === plan.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(plan)} disabled={correctPlan.isPending}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(plan)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium mb-1">No plans submitted</p>
              <p className="text-xs max-w-sm mx-auto">
                Team plans appear here when agents reporting to you submit their daily plans.
                To build your team, go to <span className="font-medium text-primary">Users</span> and assign yourself as Reporting Manager.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Branches Tab Component
function BranchesTab() {
  const { branches, isLoading, createBranch, updateBranch, deleteBranch, canManageBranches } = useBranches();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', city: '', state: '', phone: '', email: '' });
    setEditingBranch(null);
  };

  const handleSubmit = async () => {
    if (editingBranch) {
      await updateBranch.mutateAsync({ id: editingBranch.id, ...formData });
    } else {
      await createBranch.mutateAsync(formData);
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      phone: branch.phone || '',
      email: branch.email || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleToggleActive = async (branch: any) => {
    await updateBranch.mutateAsync({ id: branch.id, is_active: !branch.is_active });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      {canManageBranches && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Main Branch" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Branch Code</Label>
                    <Input id="code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="MB001" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="branch@example.com" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={!formData.name || createBranch.isPending || updateBranch.isPending}>
                  {editingBranch ? 'Update' : 'Create'} Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Branches List */}
      {branches && branches.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={cn("transition-opacity", !branch.is_active && "opacity-60")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{branch.name}</CardTitle>
                  </div>
                  {branch.code && <Badge variant="outline" className="text-xs">{branch.code}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{branch.address}{branch.city && `, ${branch.city}`}{branch.state && `, ${branch.state}`}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{branch.email}</span>
                  </div>
                )}
                
                {canManageBranches && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={branch.is_active} onCheckedChange={() => handleToggleActive(branch)} />
                      <span className="text-xs">{branch.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(branch)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{branch.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBranch.mutateAsync(branch.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No branches yet</p>
            {canManageBranches && <p className="text-xs mt-1">Click "Add Branch" to create your first branch</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
