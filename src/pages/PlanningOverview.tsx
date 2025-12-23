import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronRight, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  totals: {
    leads: number;
    logins: number;
    enroll: number;
    fi: number;
    db: number;
  };
}

export default function PlanningOverview() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  
  const planDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: plans, isLoading } = useOrgPlans(planDate);

  // Group plans by manager
  const managerGroups = useMemo(() => {
    if (!plans) return [];

    const groups = new Map<string | null, ManagerGroup>();
    
    plans.forEach((plan) => {
      const managerId = plan.user?.reporting_manager_id || null;
      const key = managerId || 'unassigned';
      
      if (!groups.has(key)) {
        groups.set(key, {
          managerId,
          managerName: managerId ? 'Loading...' : 'Unassigned',
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

  // Calculate organization totals
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
      if (next.has(managerId)) {
        next.delete(managerId);
      } else {
        next.add(managerId);
      }
      return next;
    });
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
          <h1 className="text-2xl font-bold tracking-tight">Planning Overview</h1>
          <p className="text-muted-foreground">Organization-wide planning dashboard with drill-down</p>
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

      {/* Organization Totals */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Total
          </CardTitle>
          <CardDescription>
            Aggregated targets for {format(selectedDate, 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Leads</p>
              <p className="text-3xl font-bold">{orgTotals.leads}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Logins</p>
              <p className="text-3xl font-bold">{orgTotals.logins}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Enroll</p>
              <p className="text-3xl font-bold">{orgTotals.enroll}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">FI</p>
              <p className="text-3xl font-bold">{orgTotals.fi}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">DB</p>
              <p className="text-3xl font-bold">{orgTotals.db}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Groups with Drill-down */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : managerGroups.length > 0 ? (
        <div className="space-y-4">
          {managerGroups.map((group) => {
            const key = group.managerId || 'unassigned';
            const isExpanded = expandedManagers.has(key);
            
            return (
              <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleManager(key)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {group.managerName === 'Loading...' 
                                ? `Manager (${group.plans.length} agents)`
                                : group.managerName
                              }
                            </CardTitle>
                            <CardDescription>{group.plans.length} plans submitted</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Leads</p>
                            <p className="font-semibold">{group.totals.leads}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Logins</p>
                            <p className="font-semibold">{group.totals.logins}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Enroll</p>
                            <p className="font-semibold">{group.totals.enroll}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">FI</p>
                            <p className="font-semibold">{group.totals.fi}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">DB</p>
                            <p className="font-semibold">{group.totals.db}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">Logins</TableHead>
                            <TableHead className="text-right">Enroll</TableHead>
                            <TableHead className="text-right">FI</TableHead>
                            <TableHead className="text-right">DB</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.plans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell className="font-medium">{getUserName(plan)}</TableCell>
                              <TableCell className="text-right">{plan.leads_target}</TableCell>
                              <TableCell className="text-right">{plan.logins_target}</TableCell>
                              <TableCell className="text-right">{plan.enroll_target}</TableCell>
                              <TableCell className="text-right">{plan.fi_target || 0}</TableCell>
                              <TableCell className="text-right">{plan.db_target || 0}</TableCell>
                              <TableCell>{getStatusBadge(plan.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No plans submitted for this date</p>
              <p className="text-sm">Plans will appear here once team members submit them</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
