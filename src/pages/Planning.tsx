import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMyPlan, useCreatePlan, useUpdatePlan } from '@/hooks/useDailyPlans';

export default function Planning() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: plan, isLoading } = useMyPlan(planDate);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const [formData, setFormData] = useState({
    leads_target: 0,
    logins_target: 0,
    enroll_target: 0,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        leads_target: plan.leads_target,
        logins_target: plan.logins_target,
        enroll_target: plan.enroll_target,
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (plan) {
      await updatePlan.mutateAsync({
        id: plan.id,
        ...formData,
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
        return <Badge variant="outline" className="text-xs">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-primary text-primary-foreground text-xs">Submitted</Badge>;
      case 'corrected':
        return <Badge className="bg-warning text-warning-foreground text-xs">Corrected</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground text-xs">Approved</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const calculateProgress = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-success';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-warning';
    return 'bg-accent';
  };

  return (
    <div className="p-4 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Daily Planning</h1>
          {plan && getStatusBadge(plan.status)}
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

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="glass-card"><CardContent className="p-3"><Skeleton className="h-32" /></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3"><Skeleton className="h-32" /></CardContent></Card>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Targets Form - Compact */}
          <Card className="glass-card">
            <CardHeader className="compact-header pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Set Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="leads" className="text-xs">Leads</Label>
                    <Input
                      id="leads"
                      type="number"
                      min="0"
                      value={plan?.leads_target ?? formData.leads_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                      className="compact-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="logins" className="text-xs">Logins</Label>
                    <Input
                      id="logins"
                      type="number"
                      min="0"
                      value={plan?.logins_target ?? formData.logins_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                      className="compact-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="enroll" className="text-xs">Enroll</Label>
                    <Input
                      id="enroll"
                      type="number"
                      min="0"
                      value={plan?.enroll_target ?? formData.enroll_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                      className="compact-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="sm"
                  className="w-full h-8 text-sm btn-press bg-primary hover:bg-primary-dark"
                  disabled={createPlan.isPending || updatePlan.isPending}
                >
                  {plan ? 'Update Plan' : 'Submit Plan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progress Card - Compact */}
          <Card className="glass-card">
            <CardHeader className="compact-header pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {plan ? (
                <div className="space-y-3">
                  {/* Leads */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Leads</span>
                      <span className="font-medium">{plan.leads_actual}/{plan.leads_target}</span>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressColor(calculateProgress(plan.leads_actual, plan.leads_target)))}
                        style={{ width: `${calculateProgress(plan.leads_actual, plan.leads_target)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Logins */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Logins</span>
                      <span className="font-medium">{plan.logins_actual}/{plan.logins_target}</span>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressColor(calculateProgress(plan.logins_actual, plan.logins_target)))}
                        style={{ width: `${calculateProgress(plan.logins_actual, plan.logins_target)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Enroll */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Enroll</span>
                      <span className="font-medium">{plan.enroll_actual}/{plan.enroll_target}</span>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressColor(calculateProgress(plan.enroll_actual, plan.enroll_target)))}
                        style={{ width: `${calculateProgress(plan.enroll_actual, plan.enroll_target)}%` }}
                      />
                    </div>
                  </div>

                  {plan.original_values && (
                    <div className="p-2 bg-warning-bg border border-warning/20 rounded text-xs flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-warning" />
                      <span className="text-warning-foreground">Adjusted by manager</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No plan set for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
