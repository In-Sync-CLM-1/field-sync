import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Users, Edit2, Save, X, Cloud, CloudOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { DailyPlanLocal } from '@/lib/db';

export default function TeamPlanning() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: teamPlans, isLoading, isOnline } = useTeamPlansOffline(planDate);
  const { data: myPlan } = useMyPlanOffline(planDate);
  const correctPlan = useCorrectPlanOffline();
  const createPlan = useCreatePlanOffline();
  const updatePlan = useUpdatePlanOffline();

  const [managerTargets, setManagerTargets] = useState({ fi_target: 0, db_target: 0 });

  useEffect(() => {
    if (myPlan) {
      setManagerTargets({
        fi_target: myPlan.fiTarget || 0,
        db_target: myPlan.dbTarget || 0,
      });
    }
  }, [myPlan]);

  const aggregates = useMemo(() => {
    if (!teamPlans) return { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 };
    return teamPlans.reduce((acc, plan) => ({
      leads: acc.leads + plan.leadsTarget,
      logins: acc.logins + plan.loginsTarget,
      enroll: acc.enroll + plan.enrollTarget,
      fi: acc.fi + (plan.fiTarget || 0),
      db: acc.db + (plan.dbTarget || 0),
    }), { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 });
  }, [teamPlans]);

  const handleStartEdit = (plan: DailyPlanLocal) => {
    setEditingPlanId(plan.id);
    setEditValues({
      leads_target: plan.leadsTarget,
      logins_target: plan.loginsTarget,
      enroll_target: plan.enrollTarget,
    });
  };

  const handleSaveEdit = async (plan: DailyPlanLocal) => {
    await correctPlan.mutateAsync({
      id: plan.id,
      leads_target: editValues.leads_target,
      logins_target: editValues.logins_target,
      enroll_target: editValues.enroll_target,
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
        fi_target: managerTargets.fi_target,
        db_target: managerTargets.db_target,
      });
    } else {
      await createPlan.mutateAsync({
        plan_date: planDate,
        leads_target: 0,
        logins_target: 0,
        enroll_target: 0,
        fi_target: managerTargets.fi_target,
        db_target: managerTargets.db_target,
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

  return (
    <div className="p-4 space-y-3">
      {/* Compact Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Team Planning</h1>
          <span className="text-xs text-muted-foreground">({teamPlans?.length || 0} plans)</span>
          {!isOnline && (
            <Badge variant="outline" className="text-xs h-5 bg-muted text-muted-foreground">
              <CloudOff className="h-3 w-3 mr-1" />Offline
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Manager FI/DB inline */}
          <div className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
            <Label className="text-xs">FI:</Label>
            <Input
              type="number"
              min="0"
              className="w-14 h-6 text-xs px-1"
              value={managerTargets.fi_target}
              onChange={(e) => setManagerTargets(prev => ({ ...prev, fi_target: parseInt(e.target.value) || 0 }))}
            />
            <Label className="text-xs">DB:</Label>
            <Input
              type="number"
              min="0"
              className="w-14 h-6 text-xs px-1"
              value={managerTargets.db_target}
              onChange={(e) => setManagerTargets(prev => ({ ...prev, db_target: parseInt(e.target.value) || 0 }))}
            />
            <Button size="sm" className="h-6 px-2 text-xs" onClick={handleSaveManagerTargets} disabled={updatePlan.isPending || createPlan.isPending}>
              Save
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {format(selectedDate, 'MMM d')}
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
      </div>

      {/* Aggregates - Compact Inline Row */}
      <div className="flex items-center gap-3 p-2 bg-primary/5 rounded border border-primary/10">
        <span className="text-xs font-medium text-muted-foreground">Totals:</span>
        <div className="stats-row">
          <div className="stat-badge bg-primary/10 text-primary">Leads: {aggregates.leads}</div>
          <div className="stat-badge bg-primary/10 text-primary">Logins: {aggregates.logins}</div>
          <div className="stat-badge bg-primary/10 text-primary">Enroll: {aggregates.enroll}</div>
          <div className="stat-badge bg-success/10 text-success">FI: {aggregates.fi + (myPlan?.fiTarget || 0)}</div>
          <div className="stat-badge bg-success/10 text-success">DB: {aggregates.db + (myPlan?.dbTarget || 0)}</div>
        </div>
      </div>

      {/* Team Plans Table - Compact */}
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
                  <TableHead className="py-2 px-3 text-xs text-right">Leads</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Logins</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Enroll</TableHead>
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
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.leads_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.leadsTarget}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-right">
                      {editingPlanId === plan.id ? (
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.logins_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.loginsTarget}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-right">
                      {editingPlanId === plan.id ? (
                        <Input type="number" min="0" className="w-16 h-6 text-xs ml-auto" value={editValues.enroll_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))} />
                      ) : plan.enrollTarget}
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
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No plans submitted</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
