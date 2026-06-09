import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { useTodayPlan, usePlanVisitActions, istToday, PlanItem } from '@/hooks/usePlanVisits';

import {
  Navigation, MapPin, Phone, Plus, CheckCircle2, Search,
  MoreVertical, RotateCcw, SkipForward, Loader2, Route as RouteIcon, WifiOff,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const openMaps = (lat?: number | null, lng?: number | null) => {
  if (!lat || !lng) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

const PlanPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentOrganization = useAuthStore((s) => s.currentOrganization);

  const { data: items = [], isLoading } = useTodayPlan();
  const { markVisited, markSkipped, undoStatus, addAdHoc } = usePlanVisitActions();

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');

  const today = istToday();
  const total = items.length;
  const done = items.filter((i) => i.status === 'visited').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group items into three lanes — Beat · Assigned · Added — beats first.
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; rank: number; items: PlanItem[] }>();
    for (const it of items) {
      const k = it.beatId ? `beat:${it.beatId}` : it.source === 'assigned' ? 'assigned' : 'adhoc';
      if (!map.has(k)) {
        const name = it.beatId ? (it.beatName || 'Beat') : it.source === 'assigned' ? 'Assigned to you' : 'Added today';
        const rank = it.beatId ? 0 : it.source === 'assigned' ? 1 : 2;
        map.set(k, { name, rank, items: [] });
      }
      map.get(k)!.items.push(it);
    }
    return [...map.values()].sort((a, b) => a.rank - b.rank);
  }, [items]);

  // Customers already on today's list (to exclude from the ad-hoc picker).
  const onListIds = useMemo(() => new Set(items.map((i) => i.customerId)), [items]);

  // Leads from the local cache for the ad-hoc picker.
  const leads = useLiveQuery(async () => {
    if (!currentOrganization) return [];
    return db.leads.where('organizationId').equals(currentOrganization.id).toArray();
  }, [currentOrganization?.id]) || [];

  const pickable = useMemo(() => {
    const base = leads.filter((l) => !onListIds.has(l.id) && (l.status || 'active') !== 'lost');
    if (!search) return base.slice(0, 50);
    const q = search.toLowerCase();
    return base
      .filter((l) => l.name.toLowerCase().includes(q) || l.villageCity?.toLowerCase().includes(q) || l.mobileNo?.includes(search))
      .slice(0, 50);
  }, [leads, onListIds, search]);

  const handleAdd = (customerId: string) => {
    addAdHoc.mutate(customerId, {
      onSuccess: () => {
        setAddOpen(false);
        setSearch('');
      },
    });
  };

  return (
    <div className="p-4 space-y-4 min-h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-none">Today's Plan</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(today + 'T00:00:00'), 'EEEE, MMM d')}
            </p>
          </div>
          {!navigator.onLine && (
            <Badge variant="outline" className="ml-auto gap-1 text-amber-600 border-amber-300">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{done} / {total} done</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading / empty */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your route…
        </div>
      )}

      {!isLoading && total === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground space-y-2">
            <RouteIcon className="h-10 w-10 mx-auto opacity-40" />
            <p className="text-sm font-medium">No visits planned for today</p>
            <p className="text-xs">
              Your manager sets up recurring routes (beats). You can also add a visit below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Beat groups */}
      {groups.map((g, gi) => (
        <div key={gi} className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {g.name}
          </h2>
          {g.items.map((it) => {
            const visited = it.status === 'visited';
            const skipped = it.status === 'skipped';
            const hasLoc = !!(it.latitude && it.longitude);
            return (
              <Card key={it.id} className={visited ? 'opacity-70' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${visited ? 'line-through' : ''}`}>
                          {it.customerName}
                        </p>
                        {visited && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                        {skipped && <Badge variant="outline" className="text-[10px]">Skipped</Badge>}
                        {it.source === 'assigned' && (
                          <Badge variant="secondary" className="text-[10px]">Assigned</Badge>
                        )}
                        {it.source === 'ad_hoc' && (
                          <Badge variant="outline" className="text-[10px]">Added</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {it.area && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" /> {it.area}
                          </span>
                        )}
                        {it.mobileNo && (
                          <a href={`tel:${it.mobileNo}`} className="flex items-center gap-1 hover:text-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" /> {it.mobileNo}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Row actions menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!visited && (
                          <DropdownMenuItem onClick={() => markVisited.mutate({ id: it.id })}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark visited
                          </DropdownMenuItem>
                        )}
                        {!skipped && !visited && (
                          <DropdownMenuItem onClick={() => markSkipped.mutate(it.id)}>
                            <SkipForward className="h-4 w-4 mr-2" /> Skip today
                          </DropdownMenuItem>
                        )}
                        {(visited || skipped) && (
                          <DropdownMenuItem onClick={() => undoStatus.mutate(it.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Undo
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Primary actions */}
                  {!visited && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 gap-1.5 h-11 text-base"
                        disabled={!hasLoc}
                        onClick={() => openMaps(it.latitude, it.longitude)}
                        title={hasLoc ? 'Open directions' : 'No location saved for this customer'}
                      >
                        <Navigation className="h-5 w-5" /> Navigate
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 gap-1.5 h-11 text-base"
                        onClick={() => navigate(`/dashboard/visits/new?leadId=${it.customerId}&planVisitId=${it.id}`)}
                      >
                        Start Visit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {/* Add ad-hoc visit */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="w-full gap-2 mt-2 h-12 text-base" disabled={!navigator.onLine}>
            <Plus className="h-5 w-5" /> Add a visit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a customer to today</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {pickable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No customers found.</p>
            ) : (
              pickable.map((l) => (
                <button
                  key={l.id}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border text-left hover:bg-muted/50 disabled:opacity-50"
                  disabled={addAdHoc.isPending}
                  onClick={() => handleAdd(l.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    {l.villageCity && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {l.villageCity}
                      </p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanPage;
