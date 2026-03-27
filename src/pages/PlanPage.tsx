import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db, Lead } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCreatePlanOffline } from '@/hooks/useDailyPlansOffline';
import { supabase } from '@/integrations/supabase/client';

import {
  ClipboardList, ArrowLeft, ArrowRight,
  Search, ChevronUp, ChevronDown, MapPin, Phone, User, Users,
  Plus, Send, CheckCircle2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type Step = 'list' | 'agent' | 'date' | 'select' | 'order';

interface OrgMember {
  id: string;
  full_name: string;
}

const PlanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const createPlan = useCreatePlanOffline();

  const [step, setStep] = useState<Step>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [orderedLeadIds, setOrderedLeadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<OrgMember | null>(null);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  const totalSteps = isAdmin ? 4 : 3;

  // Check user role
  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.some(r => ['admin', 'platform_admin'].includes(r)));
    }
    checkRole();
  }, [user]);

  // Fetch org members for managers/admins
  useEffect(() => {
    async function fetchMembers() {
      if (userRole === 'agent' || !currentOrganization) return;

      const { data: orgMemberIds } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', currentOrganization.id);

      if (!orgMemberIds || orgMemberIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', orgMemberIds.map(m => m.user_id))
        .eq('is_active', true)
        .order('full_name');

      // Exclude the current user
      setOrgMembers(
        (profiles || [])
          .filter(p => p.id !== user?.id)
          .map(p => ({ id: p.id, full_name: p.full_name || 'Unknown' }))
      );
    }
    fetchMembers();
  }, [userRole, currentOrganization, user]);

  // Filtered org members
  const filteredMembers = useMemo(() => {
    if (!agentSearchQuery) return orgMembers;
    const q = agentSearchQuery.toLowerCase();
    return orgMembers.filter(m => m.full_name.toLowerCase().includes(q));
  }, [orgMembers, agentSearchQuery]);

  // Get all leads from IndexedDB for current org
  const allLeads = useLiveQuery(async () => {
    if (!currentOrganization) return [];
    return db.leads
      .where('organizationId')
      .equals(currentOrganization.id)
      .toArray();
  }, [currentOrganization?.id]) || [];

  // Get existing plans — managers see org-wide, agents see their own
  const existingPlans = useLiveQuery(async () => {
    if (!user) return [];
    if (isAdmin && currentOrganization) {
      const plans = await db.dailyPlans
        .where('organizationId')
        .equals(currentOrganization.id)
        .toArray();
      return plans.sort((a, b) => b.planDate.localeCompare(a.planDate));
    }
    const plans = await db.dailyPlans
      .where('userId')
      .equals(user.id)
      .toArray();
    return plans.sort((a, b) => b.planDate.localeCompare(a.planDate));
  }, [user?.id, currentOrganization?.id, isAdmin]) || [];

  // Filtered leads for the select step
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return allLeads;
    const q = searchQuery.toLowerCase();
    return allLeads.filter(lead =>
      lead.name.toLowerCase().includes(q) ||
      lead.mobileNo?.includes(searchQuery) ||
      lead.villageCity?.toLowerCase().includes(q) ||
      lead.district?.toLowerCase().includes(q)
    );
  }, [allLeads, searchQuery]);

  // Lead lookup map
  const leadMap = useMemo(() => {
    const map = new Map<string, Lead>();
    allLeads.forEach(l => map.set(l.id, l));
    return map;
  }, [allLeads]);

  // Toggle a lead's selection
  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Move lead up/down in the ordered list
  const moveLead = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedLeadIds];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setOrderedLeadIds(newOrder);
  };

  // Remove lead from the ordered list
  const removeFromOrder = (id: string) => {
    setOrderedLeadIds(prev => prev.filter(lid => lid !== id));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Transition from select → order
  const goToOrderStep = () => {
    setOrderedLeadIds(Array.from(selectedLeadIds));
    setStep('order');
  };

  // Submit the daily plan
  const handleSubmit = async () => {
    if (!selectedDate || orderedLeadIds.length === 0) return;

    const planDate = format(selectedDate, 'yyyy-MM-dd');

    try {
      await createPlan.mutateAsync({
        plan_date: planDate,
        prospects_target: orderedLeadIds.length,
        quotes_target: 0,
        policies_target: 0,
        planned_lead_ids: orderedLeadIds,
        // If manager/admin assigned to an agent, pass target_user_id
        ...(selectedAgent && {
          target_user_id: selectedAgent.id,
          agent_full_name: selectedAgent.full_name,
        }),
      });

      resetWizard();
    } catch {
      // Error handled by mutation's onError
    }
  };

  // Reset wizard
  const resetWizard = () => {
    setStep('list');
    setSelectedDate(undefined);
    setSelectedLeadIds(new Set());
    setOrderedLeadIds([]);
    setSearchQuery('');
    setSelectedAgent(null);
    setAgentSearchQuery('');
  };

  // Step label helper
  const getStepLabel = (currentStep: number) => {
    return `Step ${currentStep} of ${totalSteps}`;
  };

  // What the "Create" button does — managers pick agent first, agents go to date
  const handleCreateClick = () => {
    if (isAdmin) {
      setStep('agent');
    } else {
      setStep('date');
    }
  };

  // Context line showing who the plan is for
  const planForLabel = selectedAgent
    ? `for ${selectedAgent.full_name}`
    : '';

  // ──────────────── STEP: LIST ────────────────
  if (step === 'list') {
    return (
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Daily Plans</h1>
          </div>
        </div>

        <Button className="w-full h-12 text-base gap-2" onClick={handleCreateClick}>
          <Plus className="h-5 w-5" />
          Create Daily Plan
        </Button>

        {existingPlans.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {isAdmin ? 'All Plans' : 'Your Plans'}
            </h2>
            {existingPlans.map(plan => {
              const leadCount = plan.plannedLeadIds?.length || 0;
              const isOwnPlan = plan.userId === user?.id;
              return (
                <Card key={plan.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(plan.planDate + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin && !isOwnPlan && plan.agentFullName && (
                          <span className="font-medium text-foreground">{plan.agentFullName} — </span>
                        )}
                        {isAdmin && isOwnPlan && (
                          <span className="font-medium text-foreground">You — </span>
                        )}
                        {leadCount} {leadCount === 1 ? 'lead' : 'leads'} planned
                        {plan.prospectsActual > 0 && ` \u00b7 ${plan.prospectsActual} visited`}
                      </p>
                    </div>
                    <Badge
                      variant={plan.status === 'submitted' ? 'default' : 'outline'}
                      className="text-xs capitalize"
                    >
                      {plan.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {existingPlans.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No plans yet. Create your first daily plan!</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ──────────────── STEP: SELECT AGENT (managers/admins only) ────────────────
  if (step === 'agent') {
    return (
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetWizard} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Select Agent</h1>
            <p className="text-xs text-muted-foreground">{getStepLabel(1)} — Who is this plan for?</p>
          </div>
        </div>

        {/* Self option */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedAgent === null
              ? 'bg-primary/5 border-primary/30'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
          onClick={() => setSelectedAgent(null)}
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Myself</p>
            <p className="text-xs text-muted-foreground">Create a plan for yourself</p>
          </div>
          {selectedAgent === null && (
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground">or assign to a team member</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Search members */}
        {orgMembers.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={agentSearchQuery}
              onChange={(e) => setAgentSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Members list */}
        <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {agentSearchQuery ? 'No members match your search' : 'No team members found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMembers.map(member => {
              const isSelected = selectedAgent?.id === member.id;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAgent(member)}
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium flex-1">{member.full_name}</p>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Next button */}
        <Button
          className="w-full h-11 gap-2"
          onClick={() => setStep('date')}
        >
          Next — Select Date {selectedAgent ? `(for ${selectedAgent.full_name})` : '(for myself)'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ──────────────── STEP: DATE SELECTION ────────────────
  if (step === 'date') {
    const dateStepNum = isAdmin ? 2 : 1;
    return (
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(isAdmin ? 'agent' : 'list')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Select Date</h1>
            <p className="text-xs text-muted-foreground">
              {getStepLabel(dateStepNum)} — Choose the day
              {planForLabel && ` ${planForLabel}`}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-3 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="pointer-events-auto"
            />
          </CardContent>
        </Card>

        <Button
          className="w-full h-11 gap-2"
          disabled={!selectedDate}
          onClick={() => setStep('select')}
        >
          Next — Select Leads
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ──────────────── STEP: SELECT LEADS ────────────────
  if (step === 'select') {
    const selectStepNum = isAdmin ? 3 : 2;
    return (
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('date')} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Select Leads</h1>
              <p className="text-xs text-muted-foreground">
                {getStepLabel(selectStepNum)} — {selectedDate && format(selectedDate, 'EEE, MMM d')}
                {planForLabel && ` ${planForLabel}`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {selectedLeadIds.size} selected
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {searchQuery ? 'No leads match your search' : 'No leads found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => {
              const isSelected = selectedLeadIds.has(lead.id);
              return (
                <div
                  key={lead.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                  onClick={() => toggleLead(lead.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleLead(lead.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {lead.villageCity && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {lead.villageCity}
                        </span>
                      )}
                      {lead.mobileNo && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {lead.mobileNo}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="sticky bottom-0 bg-background pt-2 pb-4 border-t">
          <Button
            className="w-full h-11 gap-2"
            disabled={selectedLeadIds.size === 0}
            onClick={goToOrderStep}
          >
            Next — Set Visit Order ({selectedLeadIds.size})
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ──────────────── STEP: ORDER LEADS & SUBMIT ────────────────
  if (step === 'order') {
    const orderStepNum = isAdmin ? 4 : 3;
    return (
      <div className="p-4 space-y-4 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Set Visit Order</h1>
              <p className="text-xs text-muted-foreground">
                {getStepLabel(orderStepNum)} — {selectedDate && format(selectedDate, 'EEE, MMM d')}
                {planForLabel && ` ${planForLabel}`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {orderedLeadIds.length} leads
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Arrange the leads in the order {selectedAgent ? `${selectedAgent.full_name} should` : 'you plan to'} visit them.
        </p>

        <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
          {orderedLeadIds.map((leadId, index) => {
            const lead = leadMap.get(leadId);
            if (!lead) return null;
            return (
              <div
                key={leadId}
                className="flex items-center gap-2 p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lead.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {lead.villageCity && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {lead.villageCity}
                      </span>
                    )}
                    {lead.mobileNo && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {lead.mobileNo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => moveLead(index, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === orderedLeadIds.length - 1}
                    onClick={() => moveLead(index, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => removeFromOrder(leadId)}
                >
                  &times;
                </Button>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-background pt-2 pb-4 border-t">
          <Button
            className="w-full h-11 gap-2"
            disabled={orderedLeadIds.length === 0 || createPlan.isPending}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
            {createPlan.isPending
              ? 'Saving...'
              : `Submit Plan ${planForLabel} (${orderedLeadIds.length} visits)`}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PlanPage;
