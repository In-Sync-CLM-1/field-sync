import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarIcon, Users, Edit2, Save, X, CloudOff, ArrowLeft, MapPin 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendingUp, CheckCircle } from 'lucide-react';

export default function Teams() {
  const navigate = useNavigate();
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
    return plan.agentFullName || plan.userId.substring(0, 8) + '...';
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
          <h1 className="text-xl font-bold">Teams</h1>
        </div>
      </div>

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
            <TooltipProvider>
            <Table className="compact-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-2 px-3 text-xs">Agent</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Prospects</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Quotes</TableHead>
                  <TableHead className="py-2 px-3 text-xs text-right">Sales</TableHead>
                  <TableHead className="py-2 px-3 text-xs">Status</TableHead>
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
                    <TableCell className="py-1.5 px-3 text-right">
                      {editingPlanId === plan.id ? (
                        <div className="flex justify-end gap-1">
                          <Tooltip><TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(plan)} disabled={correctPlan.isPending}>
                              <Save className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger><TooltipContent>Save changes</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger><TooltipContent>Cancel editing</TooltipContent></Tooltip>
                        </div>
                      ) : (
                        <Tooltip><TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(plan)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger><TooltipContent>Edit plan</TooltipContent></Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TooltipProvider>
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
