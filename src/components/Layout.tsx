import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { syncLeadsForOrg } from '@/hooks/useLeads';
import { useEffect, useRef, useState } from 'react';
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
import { LogOut, User, Activity, RefreshCw, Locate, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import inSyncLogo from '@/assets/in-sync-logo.png';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { swManager } from '@/lib/serviceWorker';
import { useAgentLocationTracker } from '@/hooks/useAgentLocationTracker';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import AgentWalkthrough from '@/components/walkthrough/AgentWalkthrough';
import ManagerWalkthrough from '@/components/walkthrough/ManagerWalkthrough';

export default function Layout() {
  const { user, signOut } = useAuth();
  const trackingStatus = useAgentLocationTracker();
  useAutoLogout();
  const location = useLocation();
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const leadsSyncedRef = useRef<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [_showUpgradeDialog, _setShowUpgradeDialog] = useState(false);

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
      setIsAdmin(userRoles.some(r => ['admin', 'platform_admin'].includes(r)));
    }

    checkRole();
  }, [user]);

  // Offline-first pages read the local cache; on a fresh session it's empty, so the
  // customer list (and the pickers that depend on it) would show blank until a manual
  // Sync. Pull the org's customers into the cache automatically when online.
  useEffect(() => {
    const orgId = currentOrganization?.id;
    if (!orgId || !navigator.onLine || leadsSyncedRef.current === orgId) return;
    leadsSyncedRef.current = orgId;
    (async () => {
      try {
        const count = await db.leads.where('organizationId').equals(orgId).count();
        if (count === 0) await syncLeadsForOrg(orgId);
      } catch (e) {
        console.error('Auto customer sync failed', e);
        leadsSyncedRef.current = null; // allow retry on next mount
      }
    })();
  }, [currentOrganization?.id]);

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header area */}
          
          {/* Header with gradient accent line */}
          <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 relative shadow-sm">
            {/* Multi-color gradient accent bar */}
            <div className="header-gradient-bar" />
            
            <div className="flex h-11 items-center justify-between px-3">
              <div className="flex items-center">
                <SidebarTrigger className="-ml-2 hover:bg-muted transition-colors" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTour(true)}
                  className="h-8 gap-1.5 text-xs hover:bg-muted"
                  title="Take a guided tour"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">Take a tour</span>
                </Button>
                {/* Location tracking indicator */}
                {trackingStatus !== 'idle' && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
                    title={trackingStatus === 'active' ? 'Location sharing active' : 'Location sharing error'}
                  >
                    <Locate className="h-3 w-3" />
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        trackingStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-destructive'
                      }`}
                    />
                  </div>
                )}
                {navigator.onLine && pendingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="h-8 text-xs border-border hover:bg-muted"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                )}
                <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-muted transition-all">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-border bg-popover" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{user?.user_metadata?.full_name || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="cursor-pointer hover:bg-muted">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
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
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Guided tour — manual launch (role-aware) */}
      {showTour && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 sm:p-6">
          <div className="relative h-full max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-background shadow-2xl">
            <button
              onClick={() => setShowTour(false)}
              className="absolute right-3 top-3 z-[70] flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              aria-label="Close tour"
            >
              <X className="h-5 w-5" />
            </button>
            {isAdmin ? <ManagerWalkthrough /> : <AgentWalkthrough />}
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}