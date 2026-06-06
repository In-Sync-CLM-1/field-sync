import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subDays, subWeeks, subMonths,
} from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// Shared reporting layer — ONE engine, TWO lenses.
//   • Manager (team mode): every rep's summary + per-rep drill-in detail + team totals.
//   • Agent  (rep mode):   just their own summary + detail.
// The same RepReportDetail powers both the agent's "My Report" and the manager's drill.
// ─────────────────────────────────────────────────────────────────────────────

export type ReportPeriod = 'today' | 'week' | 'month';

export interface RepReportSummary {
  id: string;
  name: string;
  distanceKm: number;
  clientsVisited: number;        // distinct customers visited in the period
  visits: number;                // visits in the period
  visitsPlanned: number;         // planned stops (plan_visits) in the period
  adherencePct: number;          // visited / planned
  ordersCount: number;
  ordersValue: number;
  collectionsCount: number;
  collectionsValue: number;
  hours: number;                 // duty hours (attendance.total_hours)
  status: 'on-visit' | 'available' | 'idle'; // current live status (for the dot)
}

export interface ReportVisitItem {
  id: string;
  customerId: string | null;
  customerName: string;
  checkInTime: string;
  checkOutTime: string | null;
  durationMin: number | null;
  status: string | null;
  purpose: string | null;
}

export interface ReportTxnItem {
  id: string;
  customerName: string;
  productName: string | null;
  amount: number;
  paymentMode: string | null;
  createdAt: string;
}

export interface RepReportDetail {
  summary: RepReportSummary;
  visits: ReportVisitItem[];
  orders: ReportTxnItem[];        // type = sales_order
  collections: ReportTxnItem[];   // type = payment_collection
  trail: { lat: number; lng: number }[];
}

export interface ReportTotals {
  distanceKm: number;
  clientsVisited: number;
  visits: number;
  ordersCount: number;
  ordersValue: number;
  collectionsCount: number;
  collectionsValue: number;
  reps: number;
}

export interface ReportData {
  rows: RepReportSummary[];
  totals: ReportTotals;
  detail: Record<string, RepReportDetail>;
}

const EMPTY: ReportData = {
  rows: [],
  totals: { distanceKm: 0, clientsVisited: 0, visits: 0, ordersCount: 0, ordersValue: 0, collectionsCount: 0, collectionsValue: 0, reps: 0 },
  detail: {},
};

function rangeFor(period: ReportPeriod, now: Date): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        prevStart: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        prevEnd: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        prevStart: startOfMonth(subMonths(now, 1)),
        prevEnd: endOfMonth(subMonths(now, 1)),
      };
    case 'today':
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        prevStart: startOfDay(subDays(now, 1)),
        prevEnd: endOfDay(subDays(now, 1)),
      };
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseReportOpts {
  /** When set, scopes everything to a single rep (agent "My Report" lens). */
  repId?: string;
}

export function useReportData(period: ReportPeriod, opts: UseReportOpts = {}) {
  const { currentOrganization, user } = useAuthStore();
  const orgId = currentOrganization?.id;
  const viewerId = user?.id;
  const repId = opts.repId;

  const query = useQuery({
    queryKey: ['report-data', orgId, period, repId ?? 'team'],
    enabled: !!orgId,
    queryFn: async (): Promise<ReportData> => {
      if (!orgId) return EMPTY;
      const now = new Date();
      const { start, end } = rangeFor(period, now);
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const todayStart = startOfDay(now).toISOString();

      // Base query helpers — optionally scoped to a single rep.
      const scope = <T extends { eq: (c: string, v: string) => T }>(q: T) =>
        repId ? q.eq('user_id', repId) : q;

      const [profilesRes, visitsRes, txnRes, locHistRes, planRes, attendanceRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, is_active').eq('organization_id', orgId),
        scope(supabase.from('visits')
          .select('id, user_id, customer_id, check_in_time, check_out_time, status, purpose')
          .eq('organization_id', orgId)
          .gte('check_in_time', startISO).lte('check_in_time', endISO) as any),
        scope(supabase.from('order_collections')
          .select('id, user_id, type, customer_name, lead_id, product_name, total_amount, payment_mode, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', startISO).lte('created_at', endISO) as any),
        scope(supabase.from('location_history')
          .select('user_id, latitude, longitude, recorded_at')
          .eq('organization_id', orgId)
          .gte('recorded_at', startISO).lte('recorded_at', endISO)
          .order('recorded_at', { ascending: true }) as any),
        (repId
          ? supabase.from('plan_visits').select('agent_id, status').eq('organization_id', orgId).eq('agent_id', repId)
          : supabase.from('plan_visits').select('agent_id, status').eq('organization_id', orgId)
        ).gte('plan_date', startISO.slice(0, 10)).lte('plan_date', endISO.slice(0, 10)),
        scope(supabase.from('attendance')
          .select('user_id, punch_in_time, punch_out_time, total_hours, date')
          .eq('organization_id', orgId)
          .gte('date', startISO.slice(0, 10)).lte('date', endISO.slice(0, 10)) as any),
      ]);

      const allProfiles = (profilesRes.data ?? []).filter(p => p.is_active !== false);
      // Team lens excludes the logged-in manager (not a tracked rep); rep lens keeps just the rep.
      const profiles = repId
        ? allProfiles.filter(p => p.id === repId)
        : allProfiles.filter(p => p.id !== viewerId);
      const profileMap = new Map(profiles.map(p => [p.id, p.full_name || 'Unknown']));
      const repIds = new Set(profiles.map(p => p.id));

      const visits = ((visitsRes as any).data ?? []).filter((v: any) => repIds.has(v.user_id));
      const txns = ((txnRes as any).data ?? []).filter((t: any) => repIds.has(t.user_id));
      const locHist = ((locHistRes as any).data ?? []).filter((l: any) => repIds.has(l.user_id));
      const plans = (planRes.data ?? []).filter((p: any) => repIds.has(p.agent_id));
      const attendance = ((attendanceRes as any).data ?? []).filter((a: any) => repIds.has(a.user_id));

      // Customer names for visit rows (orders carry customer_name already).
      const customerIds = [...new Set(visits.map((v: any) => v.customer_id).filter(Boolean))] as string[];
      const customerNames = new Map<string, string>();
      if (customerIds.length) {
        const { data: leads } = await supabase.from('leads').select('id, name').in('id', customerIds);
        (leads ?? []).forEach((l: any) => customerNames.set(l.id, l.name || 'Customer'));
      }

      // Per-rep accumulation
      const byRep = new Map<string, RepReportDetail>();
      const blankSummary = (id: string): RepReportSummary => ({
        id, name: profileMap.get(id) || 'Unknown',
        distanceKm: 0, clientsVisited: 0, visits: 0, visitsPlanned: 0, adherencePct: 0,
        ordersCount: 0, ordersValue: 0, collectionsCount: 0, collectionsValue: 0,
        hours: 0, status: 'idle',
      });
      for (const id of repIds) {
        byRep.set(id, { summary: blankSummary(id), visits: [], orders: [], collections: [], trail: [] });
      }

      // Visits → list + clientsVisited + live status
      const clientsByRep = new Map<string, Set<string>>();
      const openVisitUsers = new Set<string>();
      for (const v of visits) {
        const d = byRep.get(v.user_id); if (!d) continue;
        const durationMin = v.check_in_time && v.check_out_time
          ? Math.max(0, Math.round((new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime()) / 60000))
          : null;
        d.visits.push({
          id: v.id,
          customerId: v.customer_id,
          customerName: (v.customer_id && customerNames.get(v.customer_id)) || 'Customer',
          checkInTime: v.check_in_time,
          checkOutTime: v.check_out_time,
          durationMin,
          status: v.status,
          purpose: v.purpose,
        });
        d.summary.visits += 1;
        if (v.customer_id) {
          if (!clientsByRep.has(v.user_id)) clientsByRep.set(v.user_id, new Set());
          clientsByRep.get(v.user_id)!.add(v.customer_id);
        }
        if (!v.check_out_time && v.check_in_time >= todayStart) openVisitUsers.add(v.user_id);
      }
      for (const [id, set] of clientsByRep) {
        const d = byRep.get(id); if (d) d.summary.clientsVisited = set.size;
      }
      // newest visit first
      for (const d of byRep.values()) d.visits.sort((a, b) => (b.checkInTime ?? '').localeCompare(a.checkInTime ?? ''));

      // Orders + collections
      for (const t of txns) {
        const d = byRep.get(t.user_id); if (!d) continue;
        const item: ReportTxnItem = {
          id: t.id,
          customerName: t.customer_name || (t.lead_id && customerNames.get(t.lead_id)) || 'Customer',
          productName: t.product_name,
          amount: Number(t.total_amount) || 0,
          paymentMode: t.payment_mode,
          createdAt: t.created_at,
        };
        if (t.type === 'payment_collection') {
          d.collections.push(item);
          d.summary.collectionsCount += 1;
          d.summary.collectionsValue += item.amount;
        } else {
          d.orders.push(item);
          d.summary.ordersCount += 1;
          d.summary.ordersValue += item.amount;
        }
      }
      for (const d of byRep.values()) {
        d.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        d.collections.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }

      // Distance + trail from location_history (ordered ascending)
      const ptsByRep = new Map<string, { lat: number; lng: number }[]>();
      for (const h of locHist) {
        if (!ptsByRep.has(h.user_id)) ptsByRep.set(h.user_id, []);
        ptsByRep.get(h.user_id)!.push({ lat: Number(h.latitude), lng: Number(h.longitude) });
      }
      for (const [id, pts] of ptsByRep) {
        const d = byRep.get(id); if (!d) continue;
        let dist = 0;
        for (let i = 1; i < pts.length; i++) {
          const seg = haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
          if (seg < 50) dist += seg; // drop GPS jumps
        }
        d.summary.distanceKm = Math.round(dist * 10) / 10;
        d.trail = pts;
      }

      // Planned stops + adherence
      const plannedByRep = new Map<string, number>();
      const visitedPlannedByRep = new Map<string, number>();
      for (const p of plans) {
        plannedByRep.set(p.agent_id, (plannedByRep.get(p.agent_id) ?? 0) + 1);
        if (p.status === 'visited') visitedPlannedByRep.set(p.agent_id, (visitedPlannedByRep.get(p.agent_id) ?? 0) + 1);
      }
      for (const [id, d] of byRep) {
        const planned = plannedByRep.get(id) ?? 0;
        const visited = visitedPlannedByRep.get(id) ?? 0;
        d.summary.visitsPlanned = planned;
        d.summary.adherencePct = planned > 0 ? Math.round((visited / planned) * 100) : 0;
      }

      // Duty hours + live status (available). For an open (still-punched-in) day,
      // total_hours isn't set yet — count elapsed time so mid-day reports aren't 0h.
      const nowMs = now.getTime();
      const punchedInToday = new Set<string>();
      const hoursByRep = new Map<string, number>();
      for (const a of attendance) {
        let hrs = Number(a.total_hours) || 0;
        if (!hrs && a.punch_in_time && !a.punch_out_time) {
          hrs = Math.max(0, (nowMs - new Date(a.punch_in_time).getTime()) / 3_600_000);
        }
        hoursByRep.set(a.user_id, (hoursByRep.get(a.user_id) ?? 0) + hrs);
        if (a.date === todayStart.slice(0, 10) && a.punch_in_time && !a.punch_out_time) punchedInToday.add(a.user_id);
      }
      for (const [id, d] of byRep) {
        d.summary.hours = Math.round((hoursByRep.get(id) ?? 0) * 10) / 10;
        d.summary.status = openVisitUsers.has(id) ? 'on-visit' : punchedInToday.has(id) ? 'available' : 'idle';
      }

      // Rows + totals
      const rows = [...byRep.values()].map(d => d.summary)
        .sort((a, b) => b.visits - a.visits || b.distanceKm - a.distanceKm);
      const totals: ReportTotals = {
        distanceKm: Math.round(rows.reduce((s, r) => s + r.distanceKm, 0) * 10) / 10,
        clientsVisited: rows.reduce((s, r) => s + r.clientsVisited, 0),
        visits: rows.reduce((s, r) => s + r.visits, 0),
        ordersCount: rows.reduce((s, r) => s + r.ordersCount, 0),
        ordersValue: rows.reduce((s, r) => s + r.ordersValue, 0),
        collectionsCount: rows.reduce((s, r) => s + r.collectionsCount, 0),
        collectionsValue: rows.reduce((s, r) => s + r.collectionsValue, 0),
        reps: rows.length,
      };

      const detail: Record<string, RepReportDetail> = {};
      for (const [id, d] of byRep) detail[id] = d;

      return { rows, totals, detail };
    },
  });

  return {
    data: query.data ?? EMPTY,
    loading: query.isLoading,
    refresh: query.refetch,
  };
}
