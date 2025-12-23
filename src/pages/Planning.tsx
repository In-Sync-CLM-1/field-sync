import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Update form when plan loads
  useState(() => {
    if (plan) {
      setFormData({
        leads_target: plan.leads_target,
        logins_target: plan.logins_target,
        enroll_target: plan.enroll_target,
      });
    }
  });

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
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'corrected':
        return <Badge variant="secondary">Corrected by Manager</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Planning</h1>
          <p className="text-muted-foreground">Set your daily targets for leads, logins, and enrollments</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Plan Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set Targets
              </CardTitle>
              <CardDescription>
                Plan for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leads">Leads Target</Label>
                  <Input
                    id="leads"
                    type="number"
                    min="0"
                    value={plan?.leads_target ?? formData.leads_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter leads target"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logins">Logins Target</Label>
                  <Input
                    id="logins"
                    type="number"
                    min="0"
                    value={plan?.logins_target ?? formData.logins_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter logins target"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enroll">Enroll Target</Label>
                  <Input
                    id="enroll"
                    type="number"
                    min="0"
                    value={plan?.enroll_target ?? formData.enroll_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter enroll target"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createPlan.isPending || updatePlan.isPending}
                >
                  {plan ? 'Update Plan' : 'Submit Plan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress
                </CardTitle>
                {plan && getStatusBadge(plan.status)}
              </div>
              <CardDescription>
                Track your achievements against targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {plan ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Leads</span>
                      <span className="font-medium">{plan.leads_actual} / {plan.leads_target}</span>
                    </div>
                    <Progress value={calculateProgress(plan.leads_actual, plan.leads_target)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Logins</span>
                      <span className="font-medium">{plan.logins_actual} / {plan.logins_target}</span>
                    </div>
                    <Progress value={calculateProgress(plan.logins_actual, plan.logins_target)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enrollments</span>
                      <span className="font-medium">{plan.enroll_actual} / {plan.enroll_target}</span>
                    </div>
                    <Progress value={calculateProgress(plan.enroll_actual, plan.enroll_target)} />
                  </div>

                  {plan.original_values && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        Original values adjusted by manager
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No plan set for this date</p>
                  <p className="text-sm">Submit your targets to track progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
