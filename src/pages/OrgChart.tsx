import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Building2, User, Users, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingStates';

interface ProfileData {
  id: string;
  full_name: string | null;
  branch_id: string | null;
  reporting_manager_id: string | null;
  is_active: boolean;
}

interface BranchData {
  id: string;
  name: string;
  is_active: boolean;
}

interface RoleData {
  user_id: string;
  role: string;
}

interface TreeNode {
  profile: ProfileData;
  role: string;
  children: TreeNode[];
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  branch_manager: 'Branch Manager',
  sales_officer: 'Sales Officer',
  field_agent: 'Field Agent',
  manager: 'Manager',
  sales_manager: 'Sales Manager',
  sales_agent: 'Sales Agent',
  support_manager: 'Support Manager',
  support_agent: 'Support Agent',
  analyst: 'Analyst',
  platform_admin: 'Platform Admin',
};

const roleColorMap: Record<string, string> = {
  admin: 'bg-primary/15 text-primary border-primary/30',
  super_admin: 'bg-primary/15 text-primary border-primary/30',
  branch_manager: 'bg-accent/50 text-accent-foreground border-accent',
  sales_officer: 'bg-secondary text-secondary-foreground border-secondary',
};

function UserNode({ profile, role, isLeaf }: { profile: ProfileData; role: string; isLeaf?: boolean }) {
  const initials = (profile.full_name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colorClass = roleColorMap[role] || 'bg-muted text-muted-foreground border-border';

  return (
    <Card className={`px-3 py-2 flex items-center gap-2 min-w-[160px] border shadow-sm transition-opacity ${!profile.is_active ? 'opacity-50' : ''}`}>
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
        {initials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate text-foreground">{profile.full_name || 'Unnamed'}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 w-fit ${colorClass}`}>
          {roleLabelMap[role] || role}
        </Badge>
      </div>
    </Card>
  );
}

function BranchNode({ branch, managers, profiles, roles }: {
  branch: BranchData;
  managers: TreeNode[];
  profiles: ProfileData[];
  roles: Map<string, string>;
}) {
  return (
    <div className="flex flex-col items-center gap-0">
      {/* Branch card */}
      <Card className={`px-4 py-2 flex items-center gap-2 border-2 border-primary/30 bg-primary/5 shadow-sm ${!branch.is_active ? 'opacity-50' : ''}`}>
        <Building2 className="h-5 w-5 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">{branch.name}</span>
      </Card>

      {/* Connector down */}
      {managers.length > 0 && <div className="w-px h-6 bg-border" />}

      {/* Managers row */}
      {managers.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Horizontal line spanning managers */}
          {managers.length > 1 && <div className="h-px bg-border self-stretch" />}
          <div className="flex gap-8">
            {managers.map(mgr => (
              <div key={mgr.profile.id} className="flex flex-col items-center gap-0">
                {managers.length > 1 && <div className="w-px h-4 bg-border" />}
                <UserNode profile={mgr.profile} role={mgr.role} />

                {/* Agents under this manager */}
                {mgr.children.length > 0 && <div className="w-px h-5 bg-border" />}
                {mgr.children.length > 0 && (
                  <div className="flex flex-col items-center">
                    {mgr.children.length > 1 && <div className="h-px bg-border self-stretch" />}
                    <div className="flex gap-4">
                      {mgr.children.map(agent => (
                        <div key={agent.profile.id} className="flex flex-col items-center">
                          {mgr.children.length > 1 && <div className="w-px h-4 bg-border" />}
                          <UserNode profile={agent.profile} role={agent.role} isLeaf />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const { currentOrganization: organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [roles, setRoles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!organization?.id) return;

    async function fetchData() {
      setLoading(true);
      const [profilesRes, branchesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, branch_id, reporting_manager_id, is_active').eq('organization_id', organization!.id),
        supabase.from('branches').select('id, name, is_active').eq('organization_id', organization!.id),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      setProfiles((profilesRes.data || []) as ProfileData[]);
      setBranches((branchesRes.data || []) as BranchData[]);

      const roleMap = new Map<string, string>();
      (rolesRes.data || []).forEach((r: RoleData) => {
        // Keep highest-priority role
        const current = roleMap.get(r.user_id);
        if (!current || rolePriority(r.role) > rolePriority(current)) {
          roleMap.set(r.user_id, r.role);
        }
      });
      setRoles(roleMap);
      setLoading(false);
    }

    fetchData();
  }, [organization?.id]);

  if (loading) return <LoadingScreen />;

  // Build tree per branch
  const managerRoles = new Set(['branch_manager', 'manager', 'sales_manager', 'admin', 'super_admin']);

  const branchTrees = branches.map(branch => {
    const branchUsers = profiles.filter(p => p.branch_id === branch.id);
    const managers = branchUsers.filter(p => managerRoles.has(roles.get(p.id) || ''));
    const managerIds = new Set(managers.map(m => m.id));

    const managerNodes: TreeNode[] = managers.map(mgr => {
      const agents = branchUsers.filter(p => p.reporting_manager_id === mgr.id && !managerIds.has(p.id));
      return {
        profile: mgr,
        role: roles.get(mgr.id) || 'unknown',
        children: agents.map(a => ({ profile: a, role: roles.get(a.id) || 'unknown', children: [] })),
      };
    });

    // Agents in this branch with no manager or manager not in this branch
    const assignedAgentIds = new Set(managerNodes.flatMap(m => m.children.map(c => c.profile.id)));
    const unassignedInBranch = branchUsers.filter(p => !managerIds.has(p.id) && !assignedAgentIds.has(p.id));

    return { branch, managers: managerNodes, unassignedInBranch };
  });

  // Users with no branch at all
  const allBranchUserIds = new Set(profiles.filter(p => p.branch_id).map(p => p.id));
  const unassignedUsers = profiles.filter(p => !p.branch_id);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Org Chart</h1>
        <p className="text-sm text-muted-foreground">Visual hierarchy of your organization</p>
      </div>

      <ScrollArea className="w-full">
        <div className="flex flex-col items-center gap-0 min-w-max pb-8">
          {/* Organization root */}
          <Card className="px-5 py-3 flex items-center gap-2 border-2 border-primary bg-primary/10 shadow-md">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-base font-bold text-foreground">{organization?.name || 'Organization'}</span>
          </Card>

          {branches.length > 0 && <div className="w-px h-8 bg-border" />}

          {/* Horizontal connector for branches */}
          {branchTrees.length > 1 && <div className="h-px bg-border" style={{ width: `${Math.max(200, branchTrees.length * 280)}px` }} />}

          {/* Branches row */}
          <div className="flex gap-12">
            {branchTrees.map(({ branch, managers, unassignedInBranch }) => (
              <div key={branch.id} className="flex flex-col items-center">
                {branchTrees.length > 1 && <div className="w-px h-4 bg-border" />}
                <BranchNode branch={branch} managers={managers} profiles={profiles} roles={roles} />
                
                {/* Unassigned within branch */}
                {unassignedInBranch.length > 0 && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> No Manager
                    </span>
                    <div className="flex gap-3 flex-wrap justify-center">
                      {unassignedInBranch.map(p => (
                        <UserNode key={p.id} profile={p} role={roles.get(p.id) || 'unknown'} isLeaf />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Fully unassigned users */}
      {unassignedUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> Unassigned Users (No Branch)
          </h2>
          <div className="flex gap-3 flex-wrap">
            {unassignedUsers.map(p => (
              <UserNode key={p.id} profile={p} role={roles.get(p.id) || 'unknown'} isLeaf />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function rolePriority(role: string): number {
  const order: Record<string, number> = {
    platform_admin: 10,
    super_admin: 9,
    admin: 8,
    branch_manager: 7,
    manager: 6,
    sales_manager: 5,
    sales_officer: 4,
    field_agent: 3,
    sales_agent: 2,
    support_manager: 1,
    support_agent: 0,
    analyst: 0,
  };
  return order[role] ?? -1;
}
