import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronRight, Building2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useOrgPlans, DailyPlan } from '@/hooks/useDailyPlans';

interface ManagerGroup {
  managerId: string | null;
  managerName: string;
  plans: DailyPlan[];
  totals: { leads: number; logins: number; enroll: number; fi: number; db: number };
}

export default function PlanningOverview() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: plans, isLoading } = useOrgPlans(planDate);

  const managerGroups = useMemo(() => {
    if (!plans) return [];
    const groups = new Map<string | null, ManagerGroup>();
    
    plans.forEach((plan) => {
      const managerId = plan.user?.reporting_manager_id || null;
      const key = managerId || 'unassigned';
      
      if (!groups.has(key)) {
        groups.set(key, {
          managerId,
          managerName: managerId ? 'Manager' : 'Unassigned',
          plans: [],
          totals: { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 },
        });
      }
      
      const group = groups.get(key)!;
      group.plans.push(plan);
      group.totals.leads += plan.leads_target;
      group.totals.logins += plan.logins_target;
      group.totals.enroll += plan.enroll_target;
      group.totals.fi += plan.fi_target || 0;
      group.totals.db += plan.db_target || 0;
    });

    return Array.from(groups.values());
  }, [plans]);

  const orgTotals = useMemo(() => {
    return managerGroups.reduce(
      (acc, group) => ({
        leads: acc.leads + group.totals.leads,
        logins: acc.logins + group.totals.logins,
        enroll: acc.enroll + group.totals.enroll,
        fi: acc.fi + group.totals.fi,
        db: acc.db + group.totals.db,
      }),
      { leads: 0, logins: 0, enroll: 0, fi: 0, db: 0 }
    );
  }, [managerGroups]);

  const toggleManager = (managerId: string) => {
    setExpandedManagers((prev) => {
      const next = new Set(prev);
      if (next.has(managerId)) next.delete(managerId);
      else next.add(managerId);
      return next;
    });
  };

  const getUserName = (plan: DailyPlan) => {
    if (plan.user?.full_name) return plan.user.full_name;
    if (plan.user?.first_name || plan.user?.last_name) {
      return `${plan.user.first_name || ''} ${plan.user.last_name || ''}`.trim();
    }
    return 'Unknown';
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
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Planning Overview</h1>
          <span className="text-xs text-muted-foreground">({plans?.length || 0} plans)</span>
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

      {/* Org Totals - Compact Inline Row */}
      <div className="flex items-center gap-3 p-2 bg-primary/5 rounded border border-primary/10">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Org Total:</span>
        <div className="stats-row">
          <div className="stat-badge bg-primary/10 text-primary">Leads: {orgTotals.leads}</div>
          <div className="stat-badge bg-primary/10 text-primary">Logins: {orgTotals.logins}</div>
          <div className="stat-badge bg-primary/10 text-primary">Enroll: {orgTotals.enroll}</div>
          <div className="stat-badge bg-success/10 text-success">FI: {orgTotals.fi}</div>
          <div className="stat-badge bg-success/10 text-success">DB: {orgTotals.db}</div>
        </div>
      </div>

      {/* Manager Groups - Compact Collapsibles */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : managerGroups.length > 0 ? (
        <div className="space-y-2">
          {managerGroups.map((group) => {
            const key = group.managerId || 'unassigned';
            const isExpanded = expandedManagers.has(key);
            
            return (
              <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleManager(key)}>
                <Card className="glass-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{group.managerName}</span>
                        <span className="text-xs text-muted-foreground">({group.plans.length})</span>
                      </div>
                      <div className="stats-row">
                        <span className="stat-badge bg-muted text-muted-foreground">L:{group.totals.leads}</span>
                        <span className="stat-badge bg-muted text-muted-foreground">Lo:{group.totals.logins}</span>
                        <span className="stat-badge bg-muted text-muted-foreground">E:{group.totals.enroll}</span>
                        <span className="stat-badge bg-success/10 text-success">FI:{group.totals.fi}</span>
                        <span className="stat-badge bg-success/10 text-success">DB:{group.totals.db}</span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-border/50">
                      <Table className="compact-table">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="py-1.5 px-3 text-xs">Agent</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Leads</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Logins</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">Enroll</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">FI</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs text-right">DB</TableHead>
                            <TableHead className="py-1.5 px-3 text-xs">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.plans.map((plan) => (
                            <TableRow key={plan.id} className="hover:bg-muted/20">
                              <TableCell className="py-1 px-3 text-xs">{getUserName(plan)}</TableCell>
                              <TableCell className="py-1 px-3 text-xs text-right">{plan.leads_target}</TableCell>
                              <TableCell className="py-1 px-3 text-xs text-right">{plan.logins_target}</TableCell>
                              <TableCell className="py-1 px-3 text-xs text-right">{plan.enroll_target}</TableCell>
                              <TableCell className="py-1 px-3 text-xs text-right">{plan.fi_target || 0}</TableCell>
                              <TableCell className="py-1 px-3 text-xs text-right">{plan.db_target || 0}</TableCell>
                              <TableCell className="py-1 px-3">{getStatusBadge(plan.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No plans submitted for this date</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
