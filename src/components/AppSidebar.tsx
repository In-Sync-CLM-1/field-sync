import { LayoutDashboard, Users, ClipboardList, LogOut, ShoppingBag, MapPin, UserCog, Globe, Building2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
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

type RoleType = 'agent' | 'admin' | 'platform';

interface NavSection {
  label: string;
  items: { icon: any; label: string; path: string }[];
}

function getSectionsForRole(role: RoleType): NavSection[] {
  if (role === 'platform') {
    return [
      {
        label: 'PLATFORM',
        items: [
          { icon: Globe, label: 'Platform Overview', path: '/dashboard' },
        ],
      },
    ];
  }

  if (role === 'agent') {
    return [
      {
        label: 'MY WORK',
        items: [
          { icon: Users, label: 'Customers', path: '/dashboard/customers' },
          { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
          { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
        ],
      },
    ];
  }

  // admin
  const sections = [
    {
      label: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      ],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { icon: ClipboardList, label: 'Plan', path: '/dashboard/plan' },
        { icon: Users, label: 'Customers', path: '/dashboard/customers' },
        { icon: MapPin, label: 'Visits', path: '/dashboard/visits' },
      ],
    },
    {
      label: 'ADMIN',
      items: [
        { icon: UserCog, label: 'Team', path: '/dashboard/users' },
      ],
    },
  ];

  return sections;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const isPlatformAdmin = useAuthStore((s) => s.isPlatformAdmin);
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const [userRole, setUserRole] = useState<RoleType>('agent');

  useEffect(() => {
    async function checkRole() {
      if (!user) return;

      if (isPlatformAdmin) {
        setUserRole('platform');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];

      if (userRoles.includes('platform_admin')) {
        setUserRole('platform');
      } else if (userRoles.some(r => ['admin', 'super_admin', 'branch_manager'].includes(r))) {
        setUserRole('admin');
      } else {
        setUserRole('agent');
      }
    }

    checkRole();
  }, [user, isPlatformAdmin]);

  const sections = getSectionsForRole(userRole);
  const currentPath = location.pathname;

  return (
    <Sidebar data-tour="sidebar" collapsible="offcanvas" className="md:w-56 border-r border-sidebar-border sidebar-gradient">
      <SidebarHeader className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-2">
          <img
            src={insyncLogoColor}
            alt="In-Sync"
            className="h-7 w-auto object-contain"
          />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white">
              In-Sync
            </span>
          )}
        </div>
        {userRole === 'platform' && !collapsed && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-400/80">Platform</span>
        )}
      </SidebarHeader>
      {!collapsed && currentOrganization?.name && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-white/10">
          <Building2 className="h-3.5 w-3.5 text-[#01B8AA] flex-shrink-0" />
          <span className="text-xs text-white/70 truncate">{currentOrganization.name}</span>
        </div>
      )}
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
