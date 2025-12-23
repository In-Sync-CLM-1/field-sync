import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Users, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useTeamPlans, useCorrectPlan, useMyPlan, useCreatePlan, useUpdatePlan, DailyPlan } from '@/hooks/useDailyPlans';
import { useAuth } from '@/hooks/useAuth';

export default function TeamPlanning() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  const { user } = useAuth();
  
  const { data: teamPlans, isLoading } = useTeamPlans(planDate);
  const { data: myPlan } = useMyPlan(planDate);
  const correctPlan = useCorrectPlan();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  // Manager's own FI/DB values
  const [managerTargets, setManagerTargets] = useState({
    fi_target: 0,
    db_target: 0,
  });

  // Calculate aggregates
  const aggregates = useMemo(() => {
    if (!teamPlans) return { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 };
    
    return teamPlans.reduce((acc, plan) => ({
      leads: acc.leads + plan.leads_target,
      logins: acc.logins + plan.logins_target,
      enroll: acc.enroll + plan.enroll_target,
      fi: acc.fi + (plan.fi_target || 0),
      db: acc.db + (plan.db_target || 0),
    }), { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 });
  }, [teamPlans]);

  const handleStartEdit = (plan: DailyPlan) => {
    setEditingPlanId(plan.id);
    setEditValues({
      leads_target: plan.leads_target,
      logins_target: plan.logins_target,
      enroll_target: plan.enroll_target,
    });
  };

  const handleSaveEdit = async (plan: DailyPlan) => {
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

  const getUserName = (plan: DailyPlan) => {
    if (plan.user?.full_name) return plan.user.full_name;
    if (plan.user?.first_name || plan.user?.last_name) {
      return `${plan.user.first_name || ''} ${plan.user.last_name || ''}`.trim();
    }
    return 'Unknown Agent';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'corrected':
        return <Badge variant="secondary">Corrected</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Planning</h1>
          <p className="text-muted-foreground">Review and adjust your team's daily plans</p>
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

      {/* Manager's FI/DB Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Your Targets (FI & DB)</CardTitle>
          <CardDescription>Set your additional targets for FI and DB</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fi">FI Target</Label>
              <Input
                id="fi"
                type="number"
                min="0"
                className="w-32"
                value={myPlan?.fi_target ?? managerTargets.fi_target}
                onChange={(e) => setManagerTargets(prev => ({ ...prev, fi_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db">DB Target</Label>
              <Input
                id="db"
                type="number"
                min="0"
                className="w-32"
                value={myPlan?.db_target ?? managerTargets.db_target}
                onChange={(e) => setManagerTargets(prev => ({ ...prev, db_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <Button onClick={handleSaveManagerTargets} disabled={updatePlan.isPending || createPlan.isPending}>
              Save FI/DB
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aggregates */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-2xl">{aggregates.leads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logins</CardDescription>
            <CardTitle className="text-2xl">{aggregates.logins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Enroll</CardDescription>
            <CardTitle className="text-2xl">{aggregates.enroll}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total FI</CardDescription>
            <CardTitle className="text-2xl">{aggregates.fi + (myPlan?.fi_target || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total DB</CardDescription>
            <CardTitle className="text-2xl">{aggregates.db + (myPlan?.db_target || 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Team Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Plans
          </CardTitle>
          <CardDescription>
            {teamPlans?.length || 0} plans submitted for {format(selectedDate, 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : teamPlans && teamPlans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Logins</TableHead>
                  <TableHead className="text-right">Enroll</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{getUserName(plan)}</TableCell>
                    <TableCell className="text-right">
                      {editingPlanId === plan.id ? (
                        <Input
                          type="number"
                          min="0"
                          className="w-20 ml-auto"
                          value={editValues.leads_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, leads_target: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        plan.leads_target
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingPlanId === plan.id ? (
                        <Input
                          type="number"
                          min="0"
                          className="w-20 ml-auto"
                          value={editValues.logins_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, logins_target: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        plan.logins_target
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingPlanId === plan.id ? (
                        <Input
                          type="number"
                          min="0"
                          className="w-20 ml-auto"
                          value={editValues.enroll_target}
                          onChange={(e) => setEditValues(prev => ({ ...prev, enroll_target: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        plan.enroll_target
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell className="text-right">
                      {editingPlanId === plan.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(plan)}
                            disabled={correctPlan.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(plan)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No plans submitted by team members</p>
              <p className="text-sm">Plans will appear here once agents submit them</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
