import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
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

  const getProgress = (actual: number, target: number) => {
    if (target === 0) return { percent: 0, color: 'text-muted-foreground' };
    const percent = Math.round((actual / target) * 100);
    if (percent >= 100) return { percent, color: 'text-success' };
    if (percent >= 75) return { percent, color: 'text-primary' };
    if (percent >= 50) return { percent, color: 'text-warning' };
    return { percent, color: 'text-accent' };
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
            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
              <CalendarIcon className="mr-1 h-3 w-3" />
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
        <Card className="glass-card"><CardContent className="p-3"><Skeleton className="h-24" /></CardContent></Card>
      ) : (
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Target vs Achievement
              </span>
              <Button 
                size="sm"
                className="h-6 px-3 text-xs btn-press bg-primary hover:bg-primary-dark"
                onClick={handleSubmit}
                disabled={createPlan.isPending || updatePlan.isPending}
              >
                {plan ? 'Update' : 'Submit'}
              </Button>
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
                          value={plan?.leads_target ?? formData.leads_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                          className="h-6 w-16 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.leads_actual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.leads_actual, plan.leads_target).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.leads_actual, plan.leads_target).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Logins Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Logins</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={plan?.logins_target ?? formData.logins_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                          className="h-6 w-16 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.logins_actual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.logins_actual, plan.logins_target).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.logins_actual, plan.logins_target).percent : 0}%
                      </td>
                    </tr>
                    
                    {/* Enroll Row */}
                    <tr className="border-t border-border/50">
                      <td className="py-1.5 px-3 text-xs font-medium">Enroll</td>
                      <td className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          value={plan?.enroll_target ?? formData.enroll_target}
                          onChange={(e) => setFormData(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                          className="h-6 w-16 text-xs text-center mx-auto px-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center text-xs font-medium">
                        {plan?.enroll_actual ?? 0}
                      </td>
                      <td className={cn("py-1.5 px-3 text-right text-xs font-semibold", plan ? getProgress(plan.enroll_actual, plan.enroll_target).color : 'text-muted-foreground')}>
                        {plan ? getProgress(plan.enroll_actual, plan.enroll_target).percent : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {plan?.original_values && (
                <div className="mt-2 p-1.5 bg-warning-bg border border-warning/20 rounded text-xs flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-warning" />
                  <span className="text-warning-foreground">Adjusted by manager</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
