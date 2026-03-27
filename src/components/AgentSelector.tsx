import { useState, useEffect, useMemo } from 'react';
import { User, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';

interface OrgMember {
  id: string;
  full_name: string;
}

interface AgentSelectorProps {
  /** Called when the selected agent changes. null means "myself". */
  onAgentChange: (userId: string | null, userName: string | null) => void;
}

/**
 * Renders an agent/team-member selector for managers and admins.
 * Hidden entirely for regular agents.
 */
export function AgentSelector({ onAgentChange }: AgentSelectorProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<OrgMember | null>(null);
  const [open, setOpen] = useState(false);

  // Check role
  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      const is = userRoles.some(r =>
        ['admin', 'super_admin', 'platform_admin', 'manager', 'branch_manager'].includes(r)
      );
      setIsManagerOrAdmin(is);
    }
    checkRole();
  }, [user]);

  // Fetch org members
  useEffect(() => {
    async function fetchMembers() {
      if (!isManagerOrAdmin || !currentOrganization) return;

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

      setOrgMembers(
        (profiles || [])
          .filter(p => p.id !== user?.id)
          .map(p => ({ id: p.id, full_name: p.full_name || 'Unknown' }))
      );
    }
    fetchMembers();
  }, [isManagerOrAdmin, currentOrganization, user]);

  // Don't render for non-managers
  if (!isManagerOrAdmin) return null;

  const handleSelect = (member: OrgMember | null) => {
    setSelectedAgent(member);
    setOpen(false);
    onAgentChange(member?.id || null, member?.full_name || null);
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
      <Users className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap">On behalf of:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 justify-between gap-2">
            <span className="truncate">
              {selectedAgent ? selectedAgent.full_name : 'Myself'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search team members..." />
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="myself"
                onSelect={() => handleSelect(null)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Myself</span>
                {!selectedAgent && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
              </CommandItem>
              {orgMembers.map(member => (
                <CommandItem
                  key={member.id}
                  value={member.full_name}
                  onSelect={() => handleSelect(member)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{member.full_name}</span>
                  {selectedAgent?.id === member.id && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Hook version: returns role info and selected agent state.
 * Use when you need finer control than the component provides.
 */
export function useAgentSelector() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      setIsManagerOrAdmin(
        userRoles.some(r =>
          ['admin', 'super_admin', 'platform_admin', 'manager', 'branch_manager'].includes(r)
        )
      );
    }
    checkRole();
  }, [user]);

  useEffect(() => {
    async function fetchMembers() {
      if (!isManagerOrAdmin || !currentOrganization) return;

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

      setOrgMembers(
        (profiles || [])
          .filter(p => p.id !== user?.id)
          .map(p => ({ id: p.id, full_name: p.full_name || 'Unknown' }))
      );
    }
    fetchMembers();
  }, [isManagerOrAdmin, currentOrganization, user]);

  /** The effective user ID to use when saving records */
  const effectiveUserId = selectedAgentId || user?.id || null;

  return {
    isManagerOrAdmin,
    orgMembers,
    selectedAgentId,
    selectedAgentName,
    effectiveUserId,
    setAgent: (id: string | null, name: string | null) => {
      setSelectedAgentId(id);
      setSelectedAgentName(name);
    },
  };
}
