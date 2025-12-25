import { Home, LayoutDashboard, BarChart3, Globe, Award, ChevronRight, Users, ClipboardList, LogOut } from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('sales_officer');

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      const primaryRole = userRoles.includes('platform_admin') 
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

  const dashboards = [
    { icon: Home, label: 'My Dashboard', path: '/', roles: ['all'] },
    { icon: ClipboardList, label: 'Planning', path: '/planning', roles: ['all'] },
    { icon: ClipboardList, label: 'Team Planning', path: '/planning/team', roles: ['branch_manager', 'admin', 'super_admin', 'platform_admin'] },
    { icon: ClipboardList, label: 'Planning Overview', path: '/planning/overview', roles: ['admin', 'super_admin', 'platform_admin'] },
    { icon: LayoutDashboard, label: 'Team', path: '/team', roles: ['branch_manager', 'admin', 'super_admin', 'platform_admin'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['branch_manager', 'admin', 'super_admin', 'platform_admin'] },
    { icon: Globe, label: 'Territory', path: '/territory', roles: ['all'] },
    { icon: Award, label: 'Performance', path: '/performance', roles: ['admin', 'super_admin', 'platform_admin'] },
    { icon: Users, label: 'Users', path: '/users', roles: ['admin', 'super_admin', 'platform_admin'] },
  ].filter(d => d.roles.includes('all') || d.roles.includes(userRole));

  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="offcanvas" className="md:w-60">
      <SidebarContent>
        <SidebarGroup>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboards.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} className="h-8 py-1">
                      <NavLink 
                        to={item.path} 
                        end
                        className="flex items-center gap-2 hover:bg-accent text-sm"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}