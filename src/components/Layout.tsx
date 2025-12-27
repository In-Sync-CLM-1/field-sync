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
import { Home, Users, MapPin, Map, LogOut, User, Activity, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import inSyncLogo from '@/assets/in-sync-logo.png';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { swManager } from '@/lib/serviceWorker';

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = useLiveQuery(
    async () => {
      const count = await db.syncQueue.count();
      return count;
    },
    [],
    0
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await swManager.requestSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

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
    { icon: Users, label: 'Leads', path: '/leads' },
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
          {/* Header with gradient accent line */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            
            <div className="flex h-12 items-center justify-between px-3 md:px-4">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-2 hover:bg-primary/10 hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-2">
                {navigator.onLine && pendingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="border-accent/50 text-accent hover:bg-accent/10 hover:border-accent"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                )}
                <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-primary/30 transition-all">
                  <Avatar className="h-8 w-8 border-2 border-transparent hover:border-primary/50 transition-colors">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-border/50 bg-card/95 backdrop-blur" align="end">
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
                    <Link to="/sync-monitoring" className="cursor-pointer hover:bg-primary/10 hover:text-primary">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>Sync Monitoring</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="hover:bg-primary/10 hover:text-primary">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="hover:bg-destructive/10 hover:text-destructive">
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

          {/* Bottom Navigation - Glass effect with neon indicators */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-border/50 bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
            <div className="grid h-full grid-cols-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200 relative ${
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : 'hover:scale-105'}`}>
                      <Icon className="h-6 w-6" />
                      {active && (
                        <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md -z-10" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                    {/* Active indicator dot */}
                    {active && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
                    )}
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