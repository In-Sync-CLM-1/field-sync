import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, Target, CheckCircle, Cloud, CloudOff, Users, ArrowLeft, PlusCircle, MapPin, Circle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import {
  useMyPlanOffline,
  useCreatePlanOffline,
  useUpdatePlanOffline
} from '@/hooks/useDailyPlansOffline';
import {
  useIsManager,
} from '@/hooks/useManagerView';
import { useVisits } from '@/hooks/useVisits';

export default function Planning() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const planDate = format(selectedDate, 'yyyy-MM-dd');

  const { data: plan, isLoading, isOnline } = useMyPlanOffline(planDate);
  const createPlan = useCreatePlanOffline();
  const updatePlan = useUpdatePlanOffline();
  const { visits } = useVisits();

  // Manager view hooks
  const { data: isManager, isLoading: isLoadingManager } = useIsManager();

  const [formData, setFormData] = useState({
    prospects_target: 0,
  });

  // Get visits for the selected date
  const scheduledVisits = visits?.filter(v => {
    if (v.scheduled_date === planDate) return true;
    if (v.check_in_time) {
      const visitDate = format(new Date(v.check_in_time), 'yyyy-MM-dd');
      return visitDate === planDate;
    }
    return false;
  }) || [];

  useEffect(() => {
    if (plan) {
      setFormData({
        prospects_target: plan.prospectsTarget,
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plan) {
      await updatePlan.mutateAsync({
        id: plan.id,
        prospects_target: formData.prospects_target,
        quotes_target: 0,
        policies_target: 0,
        prospects_market: '',
        quotes_market: '',
        life_insurance_target: 0,
        health_insurance_target: 0,
      });
    } else {
      await createPlan.mutateAsync({
        plan_date: planDate,
        prospects_target: formData.prospects_target,
        quotes_target: 0,
        policies_target: 0,
        prospects_market: '',
        quotes_market: '',
        life_insurance_target: 0,
        health_insurance_target: 0,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-xs h-5">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-primary text-primary-foreground text-xs h-5">Submitted</Badge>;
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

  // Render Manager View
  if (isManager && !isLoadingManager) {
    return (
      <div className="p-4 space-y-4 page-gradient min-h-screen">
        {/* Manager Header */}
        <div className="hero-gradient">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="icon-circle icon-circle-primary h-8 w-8">
                <Users className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold gradient-text-primary">Team Planning</h1>
            </div>

            <div className="flex items-center gap-1">
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
              {!isOnline && (
                <Badge className="status-badge-warning text-xs h-5">
                  <CloudOff className="h-3 w-3 mr-1" />Offline
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Visit Target */}
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Visit Target
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm font-medium whitespace-nowrap">Visits planned:</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.prospects_target}
                  onChange={(e) => setFormData({ prospects_target: parseInt(e.target.value) || 0 })}
                  className="h-8 w-20 text-center"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                type="submit"
                disabled={createPlan.isPending || updatePlan.isPending}
              >
                {plan ? 'Update Plan' : 'Save Plan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scheduled Visits for Date */}
        <Card className="glass-card">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Visits for {format(selectedDate, 'MMM d')}
              </span>
              <Badge variant="outline" className="text-xs">{scheduledVisits.length} visits</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {scheduledVisits.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No visits scheduled</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={() => navigate(`/dashboard/visits/new?date=${planDate}`)}
                >
                  + Schedule a visit
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {scheduledVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/dashboard/visits/${visit.id}`)}
                  >
                    {visit.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{visit.lead?.name || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{visit.purpose || 'Visit'}</p>
                    </div>
                    <Badge variant={visit.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                      {visit.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Agent View
  return (
    <div className="p-4 space-y-4 page-gradient min-h-screen">
      {/* Enhanced Header */}
      <div className="hero-gradient" data-tour="planning-date">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="icon-circle icon-circle-primary h-8 w-8">
              <Target className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold gradient-text-primary">Daily Planning</h1>
          </div>

          <div className="flex items-center gap-1">
            {plan && getStatusBadge(plan.status)}
            {plan && getSyncBadge(plan.syncStatus)}
            {!isOnline && (
              <Badge className="status-badge-warning text-xs h-5">
                <CloudOff className="h-3 w-3 mr-1" />Offline
              </Badge>
            )}
          </div>
        </div>
      </div>


      {/* Guidance Banner when no plan exists */}
      {!plan && !isLoading && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="icon-circle icon-circle-primary h-10 w-10 shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Set Your Target for {format(selectedDate, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                Enter how many visits you plan to make and tap Save Plan
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visit Target Card */}
      {isLoading ? (
        <Card className="glass-card"><CardContent className="p-3"><Skeleton className="h-24" /></CardContent></Card>
      ) : (
        <Card className="glass-card" data-tour="planning-targets">
          <CardHeader className="compact-header pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Visit Target
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
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm font-medium whitespace-nowrap">Visits planned:</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.prospects_target}
                  onChange={(e) => setFormData({ prospects_target: parseInt(e.target.value) || 0 })}
                  className="h-8 w-20 text-center"
                />
                {plan && (
                  <span className="text-sm text-muted-foreground">
                    Done: <span className="font-medium">{plan.prospectsActual ?? 0}</span>
                  </span>
                )}
              </div>

              {plan?.originalValues && (
                <div className="mb-3 p-1.5 bg-warning-bg border border-warning/20 rounded text-xs flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-warning" />
                  <span className="text-warning-foreground">Adjusted by manager</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                size="default"
                className="w-full h-9 text-sm font-medium gap-2"
                type="submit"
                disabled={createPlan.isPending || updatePlan.isPending}
              >
                {plan ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Update Plan
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    Save Plan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Visits for Date */}
      <Card className="glass-card">
        <CardHeader className="compact-header pb-1">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Visits for {format(selectedDate, 'MMM d')}
            </span>
            <Badge variant="outline" className="text-xs">{scheduledVisits.length} visits</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {scheduledVisits.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No visits scheduled</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => navigate(`/dashboard/visits/new?date=${planDate}`)}
              >
                + Schedule a visit
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {scheduledVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/dashboard/visits/${visit.id}`)}
                >
                  {visit.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{visit.lead?.name || 'Customer'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{visit.purpose || 'Visit'}</p>
                  </div>
                  <Badge variant={visit.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                    {visit.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
