import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Home, Users, MapPin, Map, LogOut, User, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import inSyncLogo from '@/assets/in-sync-logo.png';

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.some(r => ['admin', 'super_admin'].includes(r)));
    }

    checkRole();
  }, [user]);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: MapPin, label: 'Visits', path: '/visits' },
    { icon: Map, label: 'Map', path: '/visits/map' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 items-center justify-between px-3 md:px-4">
              <div className="flex items-center space-x-1.5">
                <SidebarTrigger className="-ml-2" />
                <img src={inSyncLogo} alt="In-Sync" className="h-6 w-auto" />
              </div>

              <div className="flex items-center gap-2">
                
                <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Field Agent
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/sync-monitoring" className="cursor-pointer">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>Sync Monitoring</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 pb-16 min-w-0">
            <Outlet />
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="grid h-full grid-cols-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
