import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, CheckCircle, Cloud, CloudOff, TrendingUp, IndianRupee, Sparkles, Award, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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

  // Monthly incentive hooks
  const { target: monthlyTarget, upsertTarget } = useMonthlyIncentiveTarget(selectedDate);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyEnrollments(selectedDate);

  const [formData, setFormData] = useState({
    leads_target: 0,
    logins_target: 0,
    enroll_target: 0,
  });

  const [monthlyTargetInput, setMonthlyTargetInput] = useState<number>(0);
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  const prevEnrollments = useRef<number>(0);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);

  // Get enrolled contacts for current plan
  const enrolledContacts = useLiveQuery(
    async () => {
      if (!plan?.id) return [];
      const enrollments = await db.planEnrollments
        .where('dailyPlanId')
        .equals(plan.id)
        .toArray();
      
      const contacts = [];
      for (const enrollment of enrollments) {
        const contact = await db.customers.get(enrollment.customerId);
        if (contact) contacts.push(contact);
      }
      return contacts;
    },
    [plan?.id],
    []
  );

  useEffect(() => {
    if (plan) {
      setFormData({
        leads_target: plan.leadsTarget,
        logins_target: plan.loginsTarget,
        enroll_target: plan.enrollTarget,
      });
    }
  }, [plan]);

  useEffect(() => {
    if (monthlyTarget) {
      setMonthlyTargetInput(monthlyTarget.enrollment_target);
    }
  }, [monthlyTarget]);

  // Confetti effect when reaching milestones (7, 15, 25)
  useEffect(() => {
    const currentEnrollments = monthlyData.totalEnrollments;
    const milestones = [
      { threshold: 7, colors: ['#d97706', '#b45309', '#f59e0b', '#fbbf24'] }, // Bronze - amber
      { threshold: 15, colors: ['#64748b', '#475569', '#94a3b8', '#cbd5e1'] }, // Silver - slate
      { threshold: 25, colors: ['#eab308', '#ca8a04', '#facc15', '#fde047'] }, // Gold - yellow
    ];

    milestones.forEach(({ threshold, colors }) => {
      if (currentEnrollments >= threshold && prevEnrollments.current < threshold && !shownMilestones.has(threshold)) {
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
    
    prevEnrollments.current = currentEnrollments;
  }, [monthlyData.totalEnrollments, shownMilestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (plan) {
      await updatePlan.mutateAsync({
        id: plan.id,
        leads_target: formData.leads_target,
        logins_target: formData.logins_target,
        enroll_target: formData.enroll_target,
      });
    } else {
      await createPlan.mutateAsync({
        plan_date: planDate,
        ...formData,
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
    return Math.min(100, Math.round((monthlyData.totalEnrollments / monthlyTargetInput) * 100));
  };

  // Get next tier hint
  const getNextTierHint = () => {
    const enrollments = monthlyData.totalEnrollments;
    if (enrollments < 7) {
      return { needed: 7 - enrollments, reward: '₹1,500' };
    }
    return null;
  };

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

      {/* Monthly Incentive Card - First */}
      <Card className="glass-card">
        <CardHeader className="compact-header pb-1">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-success" />
              Monthly Incentive
            </span>
            <Badge variant="outline" className="text-xs h-5">
              {format(selectedDate, 'MMM yyyy')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Target Input Row */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">My Target (Enrollments)</label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  value={monthlyTargetInput}
                  onChange={(e) => setMonthlyTargetInput(parseInt(e.target.value) || 0)}
                  className="h-5 w-14 text-xs px-1.5 py-0"
                  placeholder="0"
                />
                <Button 
                  size="sm" 
                  className="h-5 px-2 text-xs"
                  onClick={handleMonthlyTargetSave}
                  disabled={upsertTarget.isPending}
                >
                  {upsertTarget.isPending ? '...' : 'Set'}
                </Button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Achieved</div>
              <div className="text-lg font-bold">{monthlyData.totalEnrollments}</div>
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
              {monthlyData.totalEnrollments < monthlyTargetInput && (
                <div className="text-xs text-muted-foreground">
                  {monthlyTargetInput - monthlyData.totalEnrollments} more to reach your target
                </div>
              )}
            </div>
          )}

          {/* Milestone Badges */}
          <div className="flex items-center justify-between gap-2">
            {/* Bronze - 7 enrollments */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalEnrollments >= 7
                ? "bg-gradient-to-b from-amber-600/20 to-amber-700/10 border-amber-600/50"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalEnrollments >= 7 ? "text-amber-600" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalEnrollments >= 7 ? "text-amber-600" : "text-muted-foreground"
              )}>BRONZE</span>
              <span className="text-[9px] text-muted-foreground">7 Enroll</span>
            </div>

            {/* Silver - 15 enrollments */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalEnrollments >= 15
                ? "bg-gradient-to-b from-slate-300/30 to-slate-400/10 border-slate-400/60"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalEnrollments >= 15 ? "text-slate-400" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalEnrollments >= 15 ? "text-slate-400" : "text-muted-foreground"
              )}>SILVER</span>
              <span className="text-[9px] text-muted-foreground">15 Enroll</span>
            </div>

            {/* Gold - 25 enrollments */}
            <div className={cn(
              "flex-1 flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              monthlyData.totalEnrollments >= 25
                ? "bg-gradient-to-b from-yellow-400/30 to-yellow-500/10 border-yellow-500/60"
                : "bg-muted/30 border-muted-foreground/20 opacity-50"
            )}>
              <Award className={cn(
                "h-6 w-6 mb-1",
                monthlyData.totalEnrollments >= 25 ? "text-yellow-500" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-bold",
                monthlyData.totalEnrollments >= 25 ? "text-yellow-500" : "text-muted-foreground"
              )}>GOLD</span>
              <span className="text-[9px] text-muted-foreground">25 Enroll</span>
            </div>
          </div>

          {/* Incentive Earned */}
          <div className={cn(
            "p-4 rounded-xl border-2 shadow-sm",
            monthlyData.incentiveEarned > 0 
              ? "bg-gradient-to-r from-success/20 to-success/5 border-success/40" 
              : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Incentive Earned
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
                  <span className="text-muted-foreground">Base (7 enrollments)</span>
                  <span className="font-medium">₹{monthlyData.baseIncentive.toLocaleString('en-IN')}</span>
                </div>
                {monthlyData.additionalIncentive > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Additional ({monthlyData.totalEnrollments - 7} × ₹250)</span>
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
                <strong>{getNextTierHint()?.needed} more</strong> enrollment{getNextTierHint()!.needed > 1 ? 's' : ''} to earn {getNextTierHint()?.reward}!
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
                    {/* Leads Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Leads</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.leads_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.leadsActual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.leadsActual, plan.leadsTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.leadsActual, plan.leadsTarget).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Logins Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Logins</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.logins_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.loginsActual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.loginsActual, plan.loginsTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.loginsActual, plan.loginsTarget).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Enroll Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Enroll</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={formData.enroll_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                          className="h-5 w-14 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-medium">{plan?.enrollActual ?? 0}</span>
                          {plan && plan.enrollActual > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => setEnrollmentDialogOpen(true)}
                              title="View/Edit enrolled applications"
                            >
                              <FileText className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.enrollActual, plan.enrollTarget).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.enrollActual, plan.enrollTarget).percent : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Show enrolled applications */}
              {enrolledContacts.length > 0 && (
                <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Enrolled Applications</span>
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
          enrollCount={plan.enrollActual}
          onSave={() => {}}
        />
      )}
    </div>
  );
}
