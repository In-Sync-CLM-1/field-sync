import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Target, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
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
        return <Badge variant="outline" className="bg-muted/50">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-primary text-primary-foreground">Submitted</Badge>;
      case 'corrected':
        return <Badge className="bg-warning text-warning-foreground">Corrected</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto py-6 space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Daily Planning</h1>
            </div>
            <p className="text-muted-foreground text-sm pl-11">
              Set your daily targets for leads, logins, and enrollments
            </p>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  "border-border/50 bg-card/80 backdrop-blur-sm",
                  "hover:bg-muted/80 hover:border-primary/50",
                  "transition-all duration-fast"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-border/50" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
        </div>

        {isLoading ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
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
            {/* Plan Form Card */}
            <Card className={cn(
              "border-border/50 bg-card/80 backdrop-blur-sm",
              "card-hover shadow-sm"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  Set Targets
                </CardTitle>
                <CardDescription className="text-muted-foreground pl-11">
                  Plan for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="leads" className="text-sm font-medium text-foreground">
                      Leads Target
                    </Label>
                    <Input
                      id="leads"
                      type="number"
                      min="0"
                      value={plan?.leads_target ?? formData.leads_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter leads target"
                      className={cn(
                        "border-border/50 bg-background/50",
                        "focus:border-primary focus:ring-primary/20",
                        "transition-all duration-fast"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logins" className="text-sm font-medium text-foreground">
                      Logins Target
                    </Label>
                    <Input
                      id="logins"
                      type="number"
                      min="0"
                      value={plan?.logins_target ?? formData.logins_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter logins target"
                      className={cn(
                        "border-border/50 bg-background/50",
                        "focus:border-primary focus:ring-primary/20",
                        "transition-all duration-fast"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enroll" className="text-sm font-medium text-foreground">
                      Enroll Target
                    </Label>
                    <Input
                      id="enroll"
                      type="number"
                      min="0"
                      value={plan?.enroll_target ?? formData.enroll_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter enroll target"
                      className={cn(
                        "border-border/50 bg-background/50",
                        "focus:border-primary focus:ring-primary/20",
                        "transition-all duration-fast"
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full btn-press",
                      "bg-primary hover:bg-primary-dark text-primary-foreground",
                      "shadow-sm hover:shadow-md",
                      "transition-all duration-fast"
                    )}
                    disabled={createPlan.isPending || updatePlan.isPending}
                  >
                    {plan ? 'Update Plan' : 'Submit Plan'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className={cn(
              "border-border/50 bg-card/80 backdrop-blur-sm",
              "card-hover shadow-sm"
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <div className="p-2 rounded-lg bg-success/10">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    Progress
                  </CardTitle>
                  {plan && getStatusBadge(plan.status)}
                </div>
                <CardDescription className="text-muted-foreground pl-11">
                  Track your achievements against targets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {plan ? (
                  <>
                    {/* Leads Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Leads</span>
                        <span className="font-semibold text-foreground">
                          {plan.leads_actual} / {plan.leads_target}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={calculateProgress(plan.leads_actual, plan.leads_target)} 
                          className="h-2 bg-muted"
                        />
                        <div 
                          className={cn(
                            "absolute top-0 left-0 h-2 rounded-full transition-all duration-medium",
                            getProgressColor(calculateProgress(plan.leads_actual, plan.leads_target))
                          )}
                          style={{ width: `${calculateProgress(plan.leads_actual, plan.leads_target)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Logins Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Logins</span>
                        <span className="font-semibold text-foreground">
                          {plan.logins_actual} / {plan.logins_target}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={calculateProgress(plan.logins_actual, plan.logins_target)} 
                          className="h-2 bg-muted"
                        />
                        <div 
                          className={cn(
                            "absolute top-0 left-0 h-2 rounded-full transition-all duration-medium",
                            getProgressColor(calculateProgress(plan.logins_actual, plan.logins_target))
                          )}
                          style={{ width: `${calculateProgress(plan.logins_actual, plan.logins_target)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Enrollments Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Enrollments</span>
                        <span className="font-semibold text-foreground">
                          {plan.enroll_actual} / {plan.enroll_target}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={calculateProgress(plan.enroll_actual, plan.enroll_target)} 
                          className="h-2 bg-muted"
                        />
                        <div 
                          className={cn(
                            "absolute top-0 left-0 h-2 rounded-full transition-all duration-medium",
                            getProgressColor(calculateProgress(plan.enroll_actual, plan.enroll_target))
                          )}
                          style={{ width: `${calculateProgress(plan.enroll_actual, plan.enroll_target)}%` }}
                        />
                      </div>
                    </div>

                    {plan.original_values && (
                      <div className="mt-4 p-4 bg-warning-bg border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning-foreground flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-warning" />
                          Original values adjusted by manager
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <Target className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-foreground font-medium">No plan set for this date</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submit your targets to track progress
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
