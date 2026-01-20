import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, CheckCircle, Cloud, CloudOff, TrendingUp, IndianRupee, Sparkles, Award, FileText, Users, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  useMyPlanOffline, 
  useCreatePlanOffline, 
  useUpdatePlanOffline 
} from '@/hooks/useDailyPlansOffline';
import { 
  useMonthlyIncentiveTarget, 
  useMonthlyEnrollments, 
  calculateIncentive 
} from '@/hooks/useMonthlyIncentive';
import { 
  useIsManager, 
  useTeamAggregates, 
  useTeamIncentiveToppers 
} from '@/hooks/useManagerView';
import { EnrollmentDialog } from '@/components/EnrollmentDialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';

export default function Planning() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: plan, isLoading, isOnline } = useMyPlanOffline(planDate);
  const createPlan = useCreatePlanOffline();
  const updatePlan = useUpdatePlanOffline();

  // Manager view hooks
  const { data: isManager, isLoading: isLoadingManager } = useIsManager();
  const { data: teamAggregates, isLoading: isLoadingAggregates } = useTeamAggregates(planDate);
  const { data: teamToppers, isLoading: isLoadingToppers } = useTeamIncentiveToppers(selectedDate);

  // Monthly incentive hooks
  const { target: monthlyTarget, upsertTarget } = useMonthlyIncentiveTarget(selectedDate);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyEnrollments(selectedDate);

  const [formData, setFormData] = useState({
    prospects_target: 0,
    quotes_target: 0,
    policies_target: 0,
    prospects_market: '',
    quotes_market: '',
  });

  // Manager's own Life/Health targets
  const [managerTargets, setManagerTargets] = useState({
    life_insurance_target: 0,
    health_insurance_target: 0,
  });

  const [monthlyTargetInput, setMonthlyTargetInput] = useState<number>(0);
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  const prevPolicies = useRef<number>(0);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);

  // Get enrolled leads for current plan
  const enrolledContacts = useLiveQuery(
    async () => {
      if (!plan?.id) return [];
      const enrollments = await db.planEnrollments
        .where('dailyPlanId')
        .equals(plan.id)
        .toArray();
      
      const leads = [];
      for (const enrollment of enrollments) {
        const lead = await db.leads.get(enrollment.customerId);
        if (lead) leads.push(lead);
      }
      return leads;
    },
    [plan?.id],
    []
  );

  useEffect(() => {
    if (plan) {
      setFormData({
        prospects_target: plan.prospectsTarget,
        quotes_target: plan.quotesTarget,
        policies_target: plan.policiesTarget,
        prospects_market: plan.prospectsMarket || '',
        quotes_market: plan.quotesMarket || '',
      });
      setManagerTargets({
        life_insurance_target: plan.lifeInsuranceTarget || 0,
        health_insurance_target: plan.healthInsuranceTarget || 0,
      });
    }
  }, [plan]);

  useEffect(() => {
    if (monthlyTarget) {
      setMonthlyTargetInput(monthlyTarget.policy_target);
    }
  }, [monthlyTarget]);

  // Confetti effect when reaching milestones (7, 15, 25 policies)
  useEffect(() => {
    const currentPolicies = monthlyData.totalPoliciesIssued;
    const milestones = [
      { threshold: 7, colors: ['#d97706', '#b45309', '#f59e0b', '#fbbf24'] }, // Bronze - amber
      { threshold: 15, colors: ['#64748b', '#475569', '#94a3b8', '#cbd5e1'] }, // Silver - slate
      { threshold: 25, colors: ['#eab308', '#ca8a04', '#facc15', '#fde047'] }, // Gold - yellow
    ];

    milestones.forEach(({ threshold, colors }) => {
      if (currentPolicies >= threshold && prevPolicies.current < threshold && !shownMilestones.has(threshold)) {
        // Fire confetti celebration
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();
        setShownMilestones(prev => new Set([...prev, threshold]));
      }
    });
    
    prevPolicies.current = currentPolicies;
  }, [monthlyData.totalPoliciesIssued, shownMilestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (plan) {
      await updatePlan.mutateAsync({
        id: plan.id,
        prospects_target: formData.prospects_target,
        quotes_target: formData.quotes_target,
        policies_target: formData.policies_target,
        prospects_market: formData.prospects_market,
        quotes_market: formData.quotes_market,
        life_insurance_target: managerTargets.life_insurance_target,
        health_insurance_target: managerTargets.health_insurance_target,
      });
    } else {
      await createPlan.mutateAsync({
        plan_date: planDate,
        ...formData,
        life_insurance_target: managerTargets.life_insurance_target,
        health_insurance_target: managerTargets.health_insurance_target,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-xs h-5">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-primary text-primary-foreground text-xs h-5">Submitted</Badge>;
      case 'corrected':
        return <Badge className="bg-warning text-warning-foreground text-xs h-5">Corrected</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground text-xs h-5">Approved</Badge>;
      default:
        return <Badge variant="outline" className="text-xs h-5">{status}</Badge>;
    }
  };

  const getSyncBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return <Badge variant="outline" className="text-xs h-5 bg-success/10 text-success border-success/20"><Cloud className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs h-5 bg-warning/10 text-warning border-warning/20"><CloudOff className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-xs h-5 bg-destructive/10 text-destructive border-destructive/20"><CloudOff className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return null;
    }
  };

  const getProgress = (actual: number, target: number) => {
    if (target === 0) return { percent: 0, color: 'text-muted-foreground' };
    const percent = Math.round((actual / target) * 100);
    if (percent >= 100) return { percent, color: 'text-success' };
    if (percent >= 75) return { percent, color: 'text-primary' };
    if (percent >= 50) return { percent, color: 'text-warning' };
    return { percent, color: 'text-accent' };
  };

  const handleMonthlyTargetSave = async () => {
    if (monthlyTargetInput >= 0) {
      await upsertTarget.mutateAsync(monthlyTargetInput);
    }
  };

  // Calculate progress towards personal target
  const getTargetProgress = () => {
    if (!monthlyTargetInput || monthlyTargetInput === 0) return 0;
    return Math.min(100, Math.round((monthlyData.totalPoliciesIssued / monthlyTargetInput) * 100));
  };

  // Get next tier hint
  const getNextTierHint = () => {
    const policies = monthlyData.totalPoliciesIssued;
    if (policies < 7) {
      return { needed: 7 - policies, reward: '₹1,500' };
    }
    return null;
  };

  // Render Manager View
  if (isManager && !isLoadingManager) {
    return (
      <div className="p-4 space-y-3">
        {/* Manager Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Branch Planning</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {!isOnline && (
              <Badge variant="outline" className="text-xs h-5 bg-muted text-muted-foreground">
                <CloudOff className="h-3 w-3 mr-1" />Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Team Aggregates Card */}
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Team Targets (Aggregated)
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-5 text-xs px-2">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isLoadingAggregates ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-1.5 px-3 text-xs font-medium text-muted-foreground">Metric</th>
                      <th className="text-center py-1.5 px-3 text-xs font-medium text-muted-foreground">Target</th>
                      <th className="text-center py-1.5 px-3 text-xs font-medium text-muted-foreground">Actual</th>
                      <th className="text-right py-1.5 px-3 text-xs font-medium text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Prospects */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Prospects</td>
                      <td className="py-1.5 px-3 text-center text-xs">{teamAggregates?.prospects_target || 0}</td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">{teamAggregates?.prospects_actual || 0}</td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", 
                        teamAggregates ? getProgress(teamAggregates.prospects_actual, teamAggregates.prospects_target).color : 'text-muted-foreground')}>
                        {teamAggregates ? getProgress(teamAggregates.prospects_actual, teamAggregates.prospects_target).percent : 0}%
                      </td>
                    </tr>
                    {/* Quotes */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Quotes</td>
                      <td className="py-1.5 px-3 text-center text-xs">{teamAggregates?.quotes_target || 0}</td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">{teamAggregates?.quotes_actual || 0}</td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", 
                        teamAggregates ? getProgress(teamAggregates.quotes_actual, teamAggregates.quotes_target).color : 'text-muted-foreground')}>
                        {teamAggregates ? getProgress(teamAggregates.quotes_actual, teamAggregates.quotes_target).percent : 0}%
                      </td>
                    </tr>
                    {/* Policies */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Policies</td>
                      <td className="py-1.5 px-3 text-center text-xs">{teamAggregates?.policies_target || 0}</td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">{teamAggregates?.policies_actual || 0}</td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", 
                        teamAggregates ? getProgress(teamAggregates.policies_actual, teamAggregates.policies_target).color : 'text-muted-foreground')}>
                        {teamAggregates ? getProgress(teamAggregates.policies_actual, teamAggregates.policies_target).percent : 0}%
                      </td>
                    </tr>
                    {/* Life Insurance - Manager specific */}
                    <tr className="border-t border-border/50 bg-primary/5">
                      <td className="py-1.5 px-3 text-xs font-medium">Life Ins</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={managerTargets.life_insurance_target}
                          onChange={(e) => setManagerTargets(prev => ({ ...prev, life_insurance_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">{plan?.lifeInsuranceActual ?? 0}</td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", 
                        plan ? getProgress(plan.lifeInsuranceActual || 0, managerTargets.life_insurance_target).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.lifeInsuranceActual || 0, managerTargets.life_insurance_target).percent : 0}%
                      </td>
                    </tr>
                    {/* Health Insurance - Manager specific */}
                    <tr className="border-t border-border/50 bg-primary/5">
                      <td className="py-1.5 px-3 text-xs font-medium">Health Ins</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={managerTargets.health_insurance_target}
                          onChange={(e) => setManagerTargets(prev => ({ ...prev, health_insurance_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">{plan?.healthInsuranceActual ?? 0}</td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", 
                        plan ? getProgress(plan.healthInsuranceActual || 0, managerTargets.health_insurance_target).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.healthInsuranceActual || 0, managerTargets.health_insurance_target).percent : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Save Button for Manager Targets */}
            <div className="mt-3 flex justify-end">
              <Button 
                size="sm"
                className="h-6 px-4 text-xs"
                onClick={handleSubmit}
                disabled={createPlan.isPending || updatePlan.isPending}
              >
                Save Targets
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Incentive Toppers Card */}
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Team Commission - {format(selectedDate, 'MMM yyyy')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isLoadingToppers ? (
              <Skeleton className="h-40" />
            ) : teamToppers && teamToppers.length > 0 ? (
              <div className="border rounded overflow-hidden">
                <Table className="compact-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2 px-3 text-xs w-8">#</TableHead>
                      <TableHead className="py-2 px-3 text-xs">Agent</TableHead>
                      <TableHead className="py-2 px-3 text-xs text-center">Policies</TableHead>
                      <TableHead className="py-2 px-3 text-xs text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamToppers.map((member, idx) => (
                      <TableRow key={member.user_id} className={cn(
                        "hover:bg-muted/30",
                        idx === 0 && member.incentive_earned > 0 && "bg-yellow-500/10",
                        idx === 1 && member.incentive_earned > 0 && "bg-slate-400/10",
                        idx === 2 && member.incentive_earned > 0 && "bg-amber-600/10",
                      )}>
                        <TableCell className="py-1.5 px-3 text-sm font-medium">
                          {idx === 0 && member.incentive_earned > 0 ? (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          ) : idx === 1 && member.incentive_earned > 0 ? (
                            <Trophy className="h-4 w-4 text-slate-400" />
                          ) : idx === 2 && member.incentive_earned > 0 ? (
                            <Trophy className="h-4 w-4 text-amber-600" />
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-sm font-medium">{member.full_name}</TableCell>
                        <TableCell className="py-1.5 px-3 text-sm text-center">{member.total_policies}</TableCell>
                        <TableCell className={cn(
                          "py-1.5 px-3 text-sm text-right font-semibold",
                          member.incentive_earned > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          ₹{member.incentive_earned.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No team members found</p>
              </div>
            )}

            {/* Total Team Commission */}
            {teamToppers && teamToppers.length > 0 && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded flex items-center justify-between">
                <span className="text-sm font-medium">Total Team Commission</span>
                <span className="text-lg font-bold text-success">
                  ₹{teamToppers.reduce((sum, m) => sum + m.incentive_earned, 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Agent View (existing code)
  return (
    <div className="p-4 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Daily Planning</h1>
        </div>
        
        <div className="flex items-center gap-1">
          {plan && getStatusBadge(plan.status)}
          {plan && getSyncBadge(plan.syncStatus)}
          {!isOnline && (
            <Badge variant="outline" className="text-xs h-5 bg-muted text-muted-foreground">
              <CloudOff className="h-3 w-3 mr-1" />Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Monthly Commission Card - First */}
      <Card className="glass-card">
        <CardHeader className="compact-header pb-1">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-success" />
              Monthly Commission
            </span>
            <Badge variant="outline" className="text-xs h-5">
              {format(selectedDate, 'MMM yyyy')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Target Input Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground mb-1 block truncate">Target</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={monthlyTargetInput}
                  onChange={(e) => setMonthlyTargetInput(parseInt(e.target.value) || 0)}
                  className="h-5 w-20 text-xs px-2"
                  placeholder="0"
                />
                <Button 
                  size="sm" 
                  className="h-5 px-3 text-xs"
                  onClick={handleMonthlyTargetSave}
                  disabled={upsertTarget.isPending}
                >
                  {upsertTarget.isPending ? '...' : 'Set'}
                </Button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Achieved</div>
              <div className="text-xl font-bold">{monthlyData.totalPoliciesIssued}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {monthlyTargetInput > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to target</span>
                <span>{getTargetProgress()}%</span>
              </div>
              <Progress value={getTargetProgress()} className="h-2" />
              {monthlyData.totalPoliciesIssued < monthlyTargetInput && (
                <div className="text-xs text-muted-foreground">
                  {monthlyTargetInput - monthlyData.totalPoliciesIssued} more to reach your target
                </div>
              )}
            </div>
          )}

          {/* Milestone Badges */}
          <div className="flex items-center justify-between gap-2">
            {/* Bronze - 7 policies */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalPoliciesIssued >= 7
                ? "bg-gradient-to-b from-amber-600/20 to-amber-700/10 border-amber-600/50"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalPoliciesIssued >= 7 ? "text-amber-600" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalPoliciesIssued >= 7 ? "text-amber-600" : "text-muted-foreground"
              )}>BRONZE</span>
              <span className="text-[9px] text-muted-foreground">7 Policies</span>
            </div>

            {/* Silver - 15 policies */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalPoliciesIssued >= 15
                ? "bg-gradient-to-b from-slate-300/30 to-slate-400/10 border-slate-400/60"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalPoliciesIssued >= 15 ? "text-slate-400" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalPoliciesIssued >= 15 ? "text-slate-400" : "text-muted-foreground"
              )}>SILVER</span>
              <span className="text-[9px] text-muted-foreground">15 Policies</span>
            </div>

            {/* Gold - 25 policies */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalPoliciesIssued >= 25
                ? "bg-gradient-to-b from-yellow-400/30 to-yellow-500/10 border-yellow-500/60"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalPoliciesIssued >= 25 ? "text-yellow-500" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalPoliciesIssued >= 25 ? "text-yellow-500" : "text-muted-foreground"
              )}>GOLD</span>
              <span className="text-[9px] text-muted-foreground">25 Policies</span>
            </div>
          </div>

          {/* Commission Earned */}
          <div className={cn(
            "p-4 rounded-xl border-2 shadow-sm",
            monthlyData.incentiveEarned > 0 
              ? "bg-gradient-to-r from-success/20 to-success/5 border-success/40" 
              : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Commission Earned
                {monthlyData.incentiveEarned > 0 && (
                  <Sparkles className="h-4 w-4 text-success animate-pulse" />
                )}
              </span>
              <span className={cn(
                "text-2xl font-bold",
                monthlyData.incentiveEarned > 0 ? "text-success" : "text-primary"
              )}>
                ₹{monthlyData.incentiveEarned.toLocaleString('en-IN')}
              </span>
            </div>
            
            {/* Breakdown */}
            {monthlyData.incentiveEarned > 0 && (
              <div className="mt-3 pt-3 border-t border-success/30 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Base (7 policies)</span>
                  <span className="font-medium">₹{monthlyData.baseIncentive.toLocaleString('en-IN')}</span>
                </div>
                {monthlyData.additionalIncentive > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Additional ({monthlyData.totalPoliciesIssued - 7} × ₹250)</span>
                    <span className="font-medium">₹{monthlyData.additionalIncentive.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Next Tier Hint */}
          {getNextTierHint() && (
            <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>
                <strong>{getNextTierHint()?.needed} more</strong> polic{getNextTierHint()!.needed > 1 ? 'ies' : 'y'} to earn {getNextTierHint()?.reward}!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target vs Achievement Card - Second */}
      {isLoading ? (
        <Card className="glass-card"><CardContent className="p-3"><Skeleton className="h-24" /></CardContent></Card>
      ) : (
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Target vs Achievement
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-5 text-xs px-2">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <form onSubmit={handleSubmit}>
              {/* Target vs Achievement Table */}
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-1.5 px-3 text-xs font-medium text-muted-foreground">Metric</th>
                      <th className="text-center py-1.5 px-3 text-xs font-medium text-muted-foreground">Target</th>
                      <th className="text-center py-1.5 px-3 text-xs font-medium text-muted-foreground">Actual</th>
                      <th className="text-right py-1.5 px-3 text-xs font-medium text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Prospects Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Prospects</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.prospects_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, prospects_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.prospectsActual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.prospectsActual, plan.prospectsTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.prospectsActual, plan.prospectsTarget).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Quotes Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Quotes</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.quotes_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, quotes_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.quotesActual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.quotesActual, plan.quotesTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.quotesActual, plan.quotesTarget).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Policies Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Policies</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.policies_target}
                          onChange={(e) => {
                            const newTarget = parseInt(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, policies_target: newTarget }));
                            if (newTarget > 0) {
                              setEnrollmentDialogOpen(true);
                            }
                          }}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-medium">{plan?.policiesActual ?? 0}</span>
                          {plan && plan.policiesActual > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => setEnrollmentDialogOpen(true)}
                              title="View/Edit planned policies"
                            >
                              <FileText className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.policiesActual, plan.policiesTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.policiesActual, plan.policiesTarget).percent : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Market Selection */}
              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Markets to Visit</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">For Prospects</label>
                    <Input
                      type="text"
                      value={formData.prospects_market}
                      onChange={(e) => setFormData(prev => ({ ...prev, prospects_market: e.target.value }))}
                      placeholder="e.g., Main Market, Sector 5"
                      className="h-6 text-xs px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">For Quotes</label>
                    <Input
                      type="text"
                      value={formData.quotes_market}
                      onChange={(e) => setFormData(prev => ({ ...prev, quotes_market: e.target.value }))}
                      placeholder="e.g., Industrial Area, Block B"
                      className="h-6 text-xs px-2"
                    />
                  </div>
                </div>
              </div>

              {enrolledContacts.length > 0 && (
                <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Planned Policies</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs px-2"
                      onClick={() => setEnrollmentDialogOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {enrolledContacts.map(contact => (
                      <Badge key={contact.id} variant="secondary" className="text-xs">
                        {contact.applicationId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {plan?.originalValues && (
                <div className="mt-2 p-1.5 bg-warning-bg border border-warning/20 rounded text-xs flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-warning" />
                  <span className="text-warning-foreground">Adjusted by manager</span>
                </div>
              )}

              {/* Submit Button at bottom */}
              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm"
                  className="h-6 px-4 text-xs"
                  type="submit"
                  disabled={createPlan.isPending || updatePlan.isPending}
                >
                  {plan ? 'Update' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Dialog */}
      {plan && (
        <EnrollmentDialog
          open={enrollmentDialogOpen}
          onOpenChange={setEnrollmentDialogOpen}
          dailyPlanId={plan.id}
          enrollCount={formData.policies_target}
          onSave={() => {}}
        />
      )}
    </div>
  );
}
