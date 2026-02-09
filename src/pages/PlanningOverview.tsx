import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronRight, Building2, Users, Cloud, CloudOff, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useOrgPlansOffline, useCorrectPlanOffline, useDeletePlanOffline } from '@/hooks/useDailyPlansOffline';
import { DailyPlanLocal } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ManagerGroup {
  managerId: string | null;
  managerName: string;
  plans: DailyPlanLocal[];
  totals: { prospects: number; quotes: number; policies: number; lifeIns: number; healthIns: number };
}

interface EditValues {
  prospectsTarget: number;
  quotesTarget: number;
  policiesTarget: number;
}

export default function PlanningOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ prospectsTarget: 0, quotesTarget: 0, policiesTarget: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<DailyPlanLocal | null>(null);
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: plans, isLoading, isOnline } = useOrgPlansOffline(planDate);
  const correctPlan = useCorrectPlanOffline();
  const deletePlan = useDeletePlanOffline();

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!error && data) {
          setIsAdmin(true);
          return;
        }

        // Check for super_admin
        const { data: superAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'super_admin'
        });

        if (superAdmin) {
          setIsAdmin(true);
          return;
        }

        // Check for platform_admin
        const { data: platformAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'platform_admin'
        });

        setIsAdmin(!!platformAdmin);
      } catch (err) {
        console.error('Failed to check admin role:', err);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const managerGroups = useMemo(() => {
    if (!plans) return [];
    const groups = new Map<string | null, ManagerGroup>();
    
    plans.forEach((plan) => {
      // For offline, we don't have user info - group by organization
      const managerId = null;
      const key = 'all';
      
      if (!groups.has(key)) {
        groups.set(key, {
          managerId,
          managerName: 'All Team Members',
          plans: [],
          totals: { prospects: 0, quotes: 0, policies: 0, lifeIns: 0, healthIns: 0 },
        });
      }
      
      const group = groups.get(key)!;
      group.plans.push(plan);
      group.totals.prospects += plan.prospectsTarget;
      group.totals.quotes += plan.quotesTarget;
      group.totals.policies += plan.policiesTarget;
      group.totals.lifeIns += plan.lifeInsuranceTarget || 0;
      group.totals.healthIns += plan.healthInsuranceTarget || 0;
    });

    return Array.from(groups.values());
  }, [plans]);

  const orgTotals = useMemo(() => {
    return managerGroups.reduce(
      (acc, group) => ({
        prospects: acc.prospects + group.totals.prospects,
        quotes: acc.quotes + group.totals.quotes,
        policies: acc.policies + group.totals.policies,
        lifeIns: acc.lifeIns + group.totals.lifeIns,
        healthIns: acc.healthIns + group.totals.healthIns,
      }),
      { prospects: 0, quotes: 0, policies: 0, lifeIns: 0, healthIns: 0 }
    );
  }, [managerGroups]);

  const toggleManager = (managerId: string) => {
    setExpandedManagers((prev) => {
      const next = new Set(prev);
      if (next.has(managerId)) next.delete(managerId);
      else next.add(managerId);
      return next;
    });
  };

  const getUserName = (plan: DailyPlanLocal) => {
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
      case 'synced':
        return <Cloud className="h-3 w-3 text-success" />;
      case 'pending':
        return <CloudOff className="h-3 w-3 text-warning" />;
      case 'failed':
        return <CloudOff className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const startEdit = (plan: DailyPlanLocal) => {
    setEditingPlanId(plan.id);
    setEditValues({
      prospectsTarget: plan.prospectsTarget,
      quotesTarget: plan.quotesTarget,
      policiesTarget: plan.policiesTarget,
    });
  };

  const cancelEdit = () => {
    setEditingPlanId(null);
    setEditValues({ prospectsTarget: 0, quotesTarget: 0, policiesTarget: 0 });
  };

  const saveEdit = (plan: DailyPlanLocal) => {
    correctPlan.mutate({
      id: plan.id,
      prospects_target: editValues.prospectsTarget,
      quotes_target: editValues.quotesTarget,
      policies_target: editValues.policiesTarget,
      original: plan,
    }, {
      onSuccess: () => {
        setEditingPlanId(null);
        setEditValues({ prospectsTarget: 0, quotesTarget: 0, policiesTarget: 0 });
      }
    });
  };

  const confirmDelete = (plan: DailyPlanLocal) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (planToDelete) {
      deletePlan.mutate({
        id: planToDelete.id,
        odataId: planToDelete.odataId,
      }, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPlanToDelete(null);
        }
      });
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/planning')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Planning</span>
          </Button>
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Planning Overview</h1>
          <span className="text-xs text-muted-foreground">({plans?.length || 0} plans)</span>
          {!isOnline && (
            <Badge variant="outline" className="text-xs h-5 bg-muted text-muted-foreground">
              <CloudOff className="h-3 w-3 mr-1" />Offline
            </Badge>
          )}
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm">
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {format(selectedDate, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Org Totals - Compact Inline Row */}
      <div className="flex items-center gap-3 p-2 bg-primary/5 rounded border border-primary/10">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Org Total:</span>
        <div className="stats-row">
          <div className="stat-badge bg-primary/10 text-primary">Prospects: {orgTotals.prospects}</div>
          <div className="stat-badge bg-primary/10 text-primary">Quotes: {orgTotals.quotes}</div>
          <div className="stat-badge bg-primary/10 text-primary">Sales: {orgTotals.policies}</div>
          <div className="stat-badge bg-success/10 text-success">Life: {orgTotals.lifeIns}</div>
          <div className="stat-badge bg-success/10 text-success">Health: {orgTotals.healthIns}</div>
        </div>
      </div>

      {/* Manager Groups - Compact Collapsibles */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : managerGroups.length > 0 ? (
        <div className="space-y-2">
          {managerGroups.map((group) => {
            const key = group.managerId || 'all';
            const isExpanded = expandedManagers.has(key);
            
            return (
              <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleManager(key)}>
                <Card className="glass-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{group.managerName}</span>
                        <span className="text-xs text-muted-foreground">({group.plans.length})</span>
                      </div>
                      <div className="stats-row">
                        <span className="stat-badge bg-muted text-muted-foreground">P:{group.totals.prospects}</span>
                        <span className="stat-badge bg-muted text-muted-foreground">Q:{group.totals.quotes}</span>
                        <span className="stat-badge bg-muted text-muted-foreground">S:{group.totals.policies}</span>
                        <span className="stat-badge bg-success/10 text-success">Life:{group.totals.lifeIns}</span>
                        <span className="stat-badge bg-success/10 text-success">Health:{group.totals.healthIns}</span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-border/50">
                      <Table className="compact-table">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="py-1.5 px-3 text-xs">Agent</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Prospects</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Quotes</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Sales</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Life</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Health</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs">Status</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-center">Sync</TableHead>
                            {isAdmin && <TableHead className="py-1.5 px-3 text-xs text-center">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.plans.map((plan) => {
                            const isEditing = editingPlanId === plan.id;
                            
                            return (
                              <TableRow key={plan.id} className="hover:bg-muted/20">
                                <TableCell className="py-1 px-3 text-xs">{getUserName(plan)}</TableCell>
                                <TableCell className="py-1 px-3 text-xs text-right">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      value={editValues.prospectsTarget}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, prospectsTarget: parseInt(e.target.value) || 0 }))}
                                      className="h-6 w-16 text-xs text-right"
                                    />
                                  ) : (
                                    plan.prospectsTarget
                                  )}
                                </TableCell>
                                <TableCell className="py-1 px-3 text-xs text-right">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      value={editValues.quotesTarget}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, quotesTarget: parseInt(e.target.value) || 0 }))}
                                      className="h-6 w-16 text-xs text-right"
                                    />
                                  ) : (
                                    plan.quotesTarget
                                  )}
                                </TableCell>
                                <TableCell className="py-1 px-3 text-xs text-right">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      value={editValues.policiesTarget}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, policiesTarget: parseInt(e.target.value) || 0 }))}
                                      className="h-6 w-16 text-xs text-right"
                                    />
                                  ) : (
                                    plan.policiesTarget
                                  )}
                                </TableCell>
                                <TableCell className="py-1 px-3 text-xs text-right">{plan.lifeInsuranceTarget || 0}</TableCell>
                                <TableCell className="py-1 px-3 text-xs text-right">{plan.healthInsuranceTarget || 0}</TableCell>
                                <TableCell className="py-1 px-3">{getStatusBadge(plan.status)}</TableCell>
                                <TableCell className="py-1 px-3 text-center">{getSyncBadge(plan.syncStatus)}</TableCell>
                                {isAdmin && (
                                  <TableCell className="py-1 px-3">
                                    <div className="flex items-center justify-center gap-1">
                                      {isEditing ? (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => saveEdit(plan)}
                                            disabled={correctPlan.isPending}
                                          >
                                            <Save className="h-3 w-3 text-success" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={cancelEdit}
                                          >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => startEdit(plan)}
                                          >
                                            <Edit2 className="h-3 w-3 text-primary" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => confirmDelete(plan)}
                                          >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No plans submitted for this date</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan?
              {planToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <div><strong>Agent:</strong> {getUserName(planToDelete)}</div>
                  <div><strong>Date:</strong> {planToDelete.planDate}</div>
                  <div><strong>Targets:</strong> Prospects: {planToDelete.prospectsTarget}, Quotes: {planToDelete.quotesTarget}, Policies: {planToDelete.policiesTarget}</div>
                </div>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}