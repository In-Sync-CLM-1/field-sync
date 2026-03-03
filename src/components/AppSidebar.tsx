import { Home, LayoutDashboard, BarChart3, Globe, Award, Users, ClipboardList, LogOut, CreditCard, Building2, Clock, MapPin, TrendingUp, UserCheck, GitBranch } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import insyncLogoColor from '@/assets/insync-logo-color.png';

type RoleType = 'platform_admin' | 'super_admin' | 'admin' | 'branch_manager' | 'sales_officer';

interface NavSection {
  label: string;
  items: { icon: any; label: string; path: string }[];
}

function getSectionsForRole(role: RoleType): NavSection[] {
  switch (role) {
    case 'sales_officer':
      return [
        {
          label: 'MY WORK',
          items: [
            { icon: Home, label: 'Dashboard', path: '/dashboard' },
            { icon: ClipboardList, label: 'Daily Plan', path: '/dashboard/planning' },
            { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
            { icon: UserCheck, label: 'Leads', path: '/dashboard/leads' },
            { icon: Clock, label: 'Attendance', path: '/dashboard/attendance' },
            { icon: BarChart3, label: 'Attendance Summary', path: '/dashboard/attendance-summary' },
            { icon: Globe, label: 'Territory', path: '/dashboard/territory' },
          ],
        },
      ];

    case 'branch_manager':
      return [
        {
          label: 'MY WORK',
          items: [
            { icon: Home, label: 'Dashboard', path: '/dashboard' },
            { icon: ClipboardList, label: 'Daily Plan', path: '/dashboard/planning' },
            { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
            { icon: UserCheck, label: 'Leads', path: '/dashboard/leads' },
            { icon: Clock, label: 'Attendance', path: '/dashboard/attendance' },
            { icon: Globe, label: 'Territory Map', path: '/dashboard/territory' },
          ],
        },
        {
          label: 'TEAM',
          items: [
            { icon: Users, label: 'Teams', path: '/dashboard/teams' },
            { icon: BarChart3, label: 'Attendance Summary', path: '/dashboard/attendance-summary' },
          ],
        },
      ];

    case 'admin':
    case 'super_admin':
      return [
        {
          label: 'OVERVIEW',
          items: [
            { icon: Building2, label: 'Dashboard', path: '/dashboard' },
          ],
        },
        {
          label: 'MANAGEMENT',
          items: [
            { icon: Building2, label: 'Branches', path: '/dashboard/branches' },
            { icon: Users, label: 'Teams', path: '/dashboard/teams' },
            { icon: Users, label: 'Users', path: '/dashboard/users' },
            { icon: GitBranch, label: 'Org Chart', path: '/dashboard/org-chart' },
            { icon: UserCheck, label: 'Leads', path: '/dashboard/leads' },
            { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
            { icon: Globe, label: 'Territory Map', path: '/dashboard/territory' },
            { icon: BarChart3, label: 'Attendance Summary', path: '/dashboard/attendance-summary' },
          ],
        },
        {
          label: 'SETTINGS',
          items: [
            { icon: CreditCard, label: 'Subscription', path: '/dashboard/subscription' },
          ],
        },
      ];

    case 'platform_admin':
      return [
        {
          label: 'OVERVIEW',
          items: [
            { icon: Building2, label: 'Dashboard', path: '/dashboard' },
          ],
        },
        {
          label: 'MANAGEMENT',
          items: [
            { icon: Building2, label: 'Branches', path: '/dashboard/branches' },
            { icon: Users, label: 'Teams', path: '/dashboard/teams' },
            { icon: Users, label: 'Users', path: '/dashboard/users' },
            { icon: GitBranch, label: 'Org Chart', path: '/dashboard/org-chart' },
            { icon: UserCheck, label: 'Leads', path: '/dashboard/leads' },
            { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
            { icon: Globe, label: 'Territory Map', path: '/dashboard/territory' },
            { icon: BarChart3, label: 'Attendance Summary', path: '/dashboard/attendance-summary' },
          ],
        },
        {
          label: 'PLATFORM',
          items: [
            { icon: Building2, label: 'Platform Admin', path: '/platform-admin/organizations' },
            { icon: CreditCard, label: 'Subscription', path: '/dashboard/subscription' },
          ],
        },
      ];

    default:
      return [
        {
          label: 'MY WORK',
          items: [
            { icon: Home, label: 'Dashboard', path: '/dashboard' },
            { icon: Clock, label: 'Attendance', path: '/dashboard/attendance' },
          ],
        },
      ];
  }
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<RoleType>('sales_officer');

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const primaryRole: RoleType = userRoles.includes('platform_admin') 
        ? 'platform_admin' 
        : userRoles.includes('super_admin')
        ? 'super_admin'
        : userRoles.includes('admin')
        ? 'admin'
        : userRoles.includes('branch_manager')
        ? 'branch_manager'
        : 'sales_officer';
      
      setUserRole(primaryRole);
    }

    checkRole();
  }, [user]);

  const sections = getSectionsForRole(userRole);
  const currentPath = location.pathname;

  return (
    <Sidebar data-tour="sidebar" collapsible="offcanvas" className="md:w-56 border-r border-sidebar-border sidebar-gradient">
      <SidebarHeader className="border-b border-white/10 px-3 py-3 flex flex-col items-center">
        <div className="relative group">
          <img
            src={insyncLogoColor}
            alt="In-Sync"
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        {(user?.user_metadata?.full_name || user?.email) && (
          <p className="text-xs text-white/60 mt-1.5 truncate text-center max-w-full">
            {user?.user_metadata?.full_name || user?.email}
          </p>
        )}
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold text-[#01B8AA] tracking-[0.15em] px-3 uppercase">
              {!collapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path ||
                    (item.path !== '/dashboard' && currentPath.startsWith(item.path));

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive} size="xs">
                        <NavLink
                          to={item.path}
                          end={item.path === '/dashboard'}
                          className={`flex items-center gap-2 text-sm rounded-md transition-all duration-150 ${
                            isActive
                              ? 'bg-[#01B8AA]/20 text-white font-medium border-l-2 border-[#01B8AA]'
                              : 'text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                          activeClassName=""
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#01B8AA]' : 'text-white/50'}`} />
                          {!collapsed && <span>{item.label}</span>}
                          {isActive && !collapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#01B8AA]" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-white/60 hover:text-[#FD625E] hover:bg-[#FD625E]/10 transition-colors h-9"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
