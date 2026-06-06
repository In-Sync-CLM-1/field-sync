import { useMemo } from 'react';
import { RepReportDetail } from '@/hooks/useReportData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import TeamMap from '@/components/dashboard/TeamMap';
import { AgentLocation, AgentTrail } from '@/hooks/useTeamMapData';
import {
  Route, Users, MapPin, ShoppingBag, IndianRupee, Clock, Target, CheckCircle2, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

type Accent = 'primary' | 'success' | 'warning' | 'destructive' | 'info';
const accentMap: Record<Accent, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
  info: { bg: 'bg-info/10', text: 'text-info' },
};

function Metric({ icon: Icon, label, value, sub, accent = 'primary' }: {
  icon: any; label: string; value: string; sub?: string; accent?: Accent;
}) {
  const a = accentMap[accent];
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${a.bg} shrink-0`}>
          <Icon className={`h-4 w-4 ${a.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  detail: RepReportDetail;
  showRouteMap?: boolean;        // route map only really meaningful for "today"
  onOpenVisit?: (visitId: string) => void;
}

/**
 * The shared rep report — drives BOTH the agent's own "My Report" and the
 * manager's per-rep drill-in. Summary metrics → route → adherence → the
 * underlying visits / orders / collections, each click-through to detail.
 */
export default function RepReportView({ detail, showRouteMap = true, onOpenVisit }: Props) {
  const s = detail.summary;

  // Synthesize TeamMap props for the rep's own route (last trail point = current position).
  const { mapAgents, mapTrails } = useMemo(() => {
    if (!detail.trail.length) return { mapAgents: [] as AgentLocation[], mapTrails: [] as AgentTrail[] };
    const head = detail.trail[detail.trail.length - 1];
    const agent: AgentLocation = {
      userId: s.id, name: s.name,
      latitude: head.lat, longitude: head.lng,
      accuracy: null, updatedAt: new Date().toISOString(), status: s.status,
    };
    const trail: AgentTrail = { userId: s.id, name: s.name, status: s.status, path: detail.trail };
    return { mapAgents: [agent], mapTrails: [trail] };
  }, [detail.trail, s.id, s.name, s.status]);

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        <Metric icon={Route} label="Distance" value={`${s.distanceKm} km`} sub="covered" accent="warning" />
        <Metric icon={Users} label="Clients Visited" value={`${s.clientsVisited}`} sub={`${s.visits} visits`} accent="primary" />
        <Metric icon={Target} label="Plan Adherence" value={`${s.adherencePct}%`} sub={`${s.visitsPlanned} planned`} accent="info" />
        <Metric icon={ShoppingBag} label="Orders" value={`${s.ordersCount}`} sub={s.ordersValue > 0 ? inr(s.ordersValue) : '—'} accent="info" />
        <Metric icon={IndianRupee} label="Collected" value={inr(s.collectionsValue)} sub={`${s.collectionsCount} payments`} accent="success" />
        <Metric icon={Clock} label="On Duty" value={`${s.hours}h`} sub={s.status === 'on-visit' ? 'On a visit' : s.status === 'available' ? 'Active now' : 'Off duty'} accent="primary" />
      </div>

      {/* Plan adherence bar */}
      {s.visitsPlanned > 0 && (
        <div className="px-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Planned route coverage</span>
            <span className="font-medium">{s.adherencePct}%</span>
          </div>
          <Progress value={s.adherencePct} className="h-2" />
        </div>
      )}

      {/* Route map */}
      {showRouteMap && mapAgents.length > 0 && (
        <TeamMap agents={mapAgents} visits={[]} trails={mapTrails} />
      )}

      {/* Visits */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Visits</h3>
          <Badge variant="outline" className="text-[10px]">{detail.visits.length}</Badge>
        </div>
        {detail.visits.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">No visits in this period.</p>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-1.5 pr-2">
              {detail.visits.map(v => {
                const done = !!v.checkOutTime;
                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 p-2.5 rounded-md bg-muted/40 ${onOpenVisit ? 'cursor-pointer hover:bg-accent/50' : ''} transition-colors`}
                    onClick={() => onOpenVisit?.(v.id)}
                  >
                    {done
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      : <Clock className="h-4 w-4 text-amber-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.checkInTime ? format(new Date(v.checkInTime), 'hh:mm a') : '—'}
                        {v.checkOutTime ? ` – ${format(new Date(v.checkOutTime), 'hh:mm a')}` : ' · ongoing'}
                        {v.durationMin != null ? ` · ${v.durationMin}m` : ''}
                        {v.purpose ? ` · ${v.purpose}` : ''}
                      </p>
                    </div>
                    <Badge variant={done ? 'secondary' : 'outline'} className="text-[10px] capitalize shrink-0">
                      {v.status || (done ? 'completed' : 'active')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Orders + Collections side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold">Orders</h3>
            <Badge variant="outline" className="text-[10px]">{inr(s.ordersValue)}</Badge>
          </div>
          {detail.orders.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">No orders.</p>
          ) : (
            <div className="space-y-1.5">
              {detail.orders.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.customerName}</p>
                    {o.productName && <p className="text-[11px] text-muted-foreground truncate">{o.productName}</p>}
                  </div>
                  <span className="text-sm font-semibold text-info shrink-0">{inr(o.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold">Collections</h3>
            <Badge variant="outline" className="text-[10px]">{inr(s.collectionsValue)}</Badge>
          </div>
          {detail.collections.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">No collections.</p>
          ) : (
            <div className="space-y-1.5">
              {detail.collections.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.customerName}</p>
                    {c.paymentMode && <p className="text-[11px] text-muted-foreground capitalize truncate">{c.paymentMode}</p>}
                  </div>
                  <span className="text-sm font-semibold text-success shrink-0">{inr(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
