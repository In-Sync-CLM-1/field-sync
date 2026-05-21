import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { format, subDays, startOfWeek, endOfWeek, startOfDay } from 'date-fns';

export interface AdminKPIs {
  teamSize: number;
  activeMembers: number;
  visitsToday: number;
  visitsInProgress: number;
  ordersToday: number;
  ordersValueToday: number;
  collectionsToday: number;
  collectionsValueToday: number;
  attendanceRate: number;
  customersTotal: number;
}

export interface TeamMember {
  id: string;
  name: string;
  status: 'on-visit' | 'punched-in' | 'idle';
  visitsToday: number;
  punchInTime: string | null;
  currentVisitStart: string | null;
}

export interface VisitsTrendPoint {
  date: string;
  visits: number;
  orders: number;
}

export interface TeamPerformanceRow {
  id: string;
  name: string;
  visitsToday: number;
  visitsThisWeek: number;
  ordersCount: number;
  ordersValue: number;
  collectionsValue: number;
  isPresent: boolean;
}

export interface AdminActivityItem {
  id: string;
  type: 'visit_started' | 'visit_completed' | 'order_placed' | 'punch_in' | 'collection';
  agentName: string;
  detail: string;
  timestamp: string;
  meta?: string;
}

export interface AdminDashboardData {
  kpis: AdminKPIs;
  teamMembers: TeamMember[];
  visitsTrend: VisitsTrendPoint[];
  teamPerformance: TeamPerformanceRow[];
  recentActivity: AdminActivityItem[];
}

const EMPTY: AdminDashboardData = {
  kpis: {
    teamSize: 0,
    activeMembers: 0,
    visitsToday: 0,
    visitsInProgress: 0,
    ordersToday: 0,
    ordersValueToday: 0,
    collectionsToday: 0,
    collectionsValueToday: 0,
    attendanceRate: 0,
    customersTotal: 0,
  },
  teamMembers: [],
  visitsTrend: [],
  teamPerformance: [],
  recentActivity: [],
};

export function useAdminDashboard() {
  const { currentOrganization } = useAuthStore();
  const [data, setData] = useState<AdminDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!currentOrganization?.id) return;
    setLoading(true);

    try {
      const orgId = currentOrganization.id;
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const todayStart = startOfDay(now).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const [
        profilesRes,
        attendanceRes,
        visitsTodayRes,
        visitsChartRes,
        visitsWeekRes,
        ordersRes,
        collectionsRes,
        leadsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, is_active').eq('organization_id', orgId),
        supabase.from('attendance').select('user_id, punch_in_time, punch_out_time, status').eq('organization_id', orgId).eq('date', todayStr),
        supabase.from('visits').select('id, user_id, check_in_time, check_out_time, status, purpose').eq('organization_id', orgId).gte('check_in_time', todayStart),
        supabase.from('visits').select('id, check_in_time, created_at').eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
        supabase.from('visits').select('id, user_id').eq('organization_id', orgId).gte('check_in_time', weekStart.toISOString()).lte('check_in_time', weekEnd.toISOString()),
        supabase.from('orders').select('id, user_id, total_amount, created_at').eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
        supabase.from('collections').select('id, user_id, amount, created_at').eq('organization_id', orgId).gte('created_at', thirtyDaysAgo),
        supabase.from('leads').select('id').eq('organization_id', orgId),
      ]);

      if (signal?.cancelled) return;

      const profiles = (profilesRes.data ?? []).filter(p => p.is_active !== false);
      const attendance = attendanceRes.data ?? [];
      const visitsToday = visitsTodayRes.data ?? [];
      const visitsChart = visitsChartRes.data ?? [];
      const visitsWeek = visitsWeekRes.data ?? [];
      const allOrders = ordersRes.data ?? [];
      const allCollections = collectionsRes.data ?? [];
      const leads = leadsRes.data ?? [];

      const profileMap = new Map(profiles.map(p => [p.id, p.full_name || 'Unknown']));
      const attendanceMap = new Map(attendance.map(a => [a.user_id, a]));

      // --- KPIs ---
      const punchedIn = attendance.filter(a => a.punch_in_time && !a.punch_out_time).length;
      const inProgressVisits = visitsToday.filter(v => !v.check_out_time);
      const ordersToday = allOrders.filter(o => o.created_at >= todayStart);
      const collectionsToday = allCollections.filter(c => c.created_at >= todayStart);

      const kpis: AdminKPIs = {
        teamSize: profiles.length,
        activeMembers: punchedIn,
        visitsToday: visitsToday.length,
        visitsInProgress: inProgressVisits.length,
        ordersToday: ordersToday.length,
        ordersValueToday: ordersToday.reduce((s, o) => s + (o.total_amount || 0), 0),
        collectionsToday: collectionsToday.length,
        collectionsValueToday: collectionsToday.reduce((s, c) => s + (c.amount || 0), 0),
        attendanceRate: profiles.length > 0 ? Math.round((punchedIn / profiles.length) * 100) : 0,
        customersTotal: leads.length,
      };

      // --- Team Members ---
      const teamMembers: TeamMember[] = profiles.map(p => {
        const att = attendanceMap.get(p.id);
        const activeVisit = inProgressVisits.find(v => v.user_id === p.id);
        const memberVisitsToday = visitsToday.filter(v => v.user_id === p.id).length;

        let status: TeamMember['status'] = 'idle';
        if (activeVisit) {
          status = 'on-visit';
        } else if (att?.punch_in_time && !att?.punch_out_time) {
          status = 'punched-in';
        }

        return {
          id: p.id,
          name: p.full_name || 'Unknown',
          status,
          visitsToday: memberVisitsToday,
          punchInTime: att?.punch_in_time || null,
          currentVisitStart: activeVisit?.check_in_time || null,
        };
      }).sort((a, b) => {
        const order = { 'on-visit': 0, 'punched-in': 1, 'idle': 2 };
        return order[a.status] - order[b.status];
      });

      // --- Visits Trend (30 days) ---
      const visitBuckets = new Map<string, number>();
      const orderBuckets = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const key = format(subDays(now, i), 'MMM dd');
        visitBuckets.set(key, 0);
        orderBuckets.set(key, 0);
      }
      for (const v of visitsChart) {
        const key = format(new Date(v.created_at), 'MMM dd');
        if (visitBuckets.has(key)) visitBuckets.set(key, (visitBuckets.get(key) ?? 0) + 1);
      }
      for (const o of allOrders) {
        const key = format(new Date(o.created_at), 'MMM dd');
        if (orderBuckets.has(key)) orderBuckets.set(key, (orderBuckets.get(key) ?? 0) + 1);
      }
      const visitsTrend: VisitsTrendPoint[] = Array.from(visitBuckets.entries()).map(
        ([date, visits]) => ({ date, visits, orders: orderBuckets.get(date) ?? 0 })
      );

      // --- Team Performance ---
      const teamPerformance: TeamPerformanceRow[] = profiles.map(p => {
        const memberVisitsToday = visitsToday.filter(v => v.user_id === p.id).length;
        const memberVisitsWeek = visitsWeek.filter(v => v.user_id === p.id).length;
        const memberOrders = allOrders.filter(o => o.user_id === p.id);
        const memberCollections = allCollections.filter(c => c.user_id === p.id);
        const att = attendanceMap.get(p.id);

        return {
          id: p.id,
          name: p.full_name || 'Unknown',
          visitsToday: memberVisitsToday,
          visitsThisWeek: memberVisitsWeek,
          ordersCount: memberOrders.length,
          ordersValue: memberOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
          collectionsValue: memberCollections.reduce((s, c) => s + (c.amount || 0), 0),
          isPresent: !!(att?.punch_in_time),
        };
      }).sort((a, b) => b.visitsToday - a.visitsToday);

      // --- Activity Feed ---
      const feed: AdminActivityItem[] = [];

      // Recent visits
      const sortedVisits = [...visitsToday].sort((a, b) => (b.check_in_time ?? '').localeCompare(a.check_in_time ?? ''));
      for (const v of sortedVisits.slice(0, 15)) {
        const agentName = profileMap.get(v.user_id) || 'Unknown';
        const isComplete = !!v.check_out_time;
        feed.push({
          id: `visit-${v.id}`,
          type: isComplete ? 'visit_completed' : 'visit_started',
          agentName,
          detail: isComplete ? `Completed ${v.purpose || 'visit'}` : `Started ${v.purpose || 'visit'}`,
          timestamp: v.check_in_time!,
          meta: v.purpose || undefined,
        });
      }

      // Recent orders today
      for (const o of ordersToday.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10)) {
        feed.push({
          id: `order-${o.id}`,
          type: 'order_placed',
          agentName: profileMap.get(o.user_id) || 'Unknown',
          detail: `Placed order`,
          timestamp: o.created_at,
          meta: o.total_amount ? `₹${o.total_amount.toLocaleString()}` : undefined,
        });
      }

      // Recent collections today
      for (const c of collectionsToday.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10)) {
        feed.push({
          id: `collection-${c.id}`,
          type: 'collection',
          agentName: profileMap.get(c.user_id) || 'Unknown',
          detail: `Collected payment`,
          timestamp: c.created_at,
          meta: c.amount ? `₹${c.amount.toLocaleString()}` : undefined,
        });
      }

      // Attendance punch-ins
      for (const a of attendance.filter(a => a.punch_in_time).slice(0, 10)) {
        feed.push({
          id: `punch-${a.user_id}`,
          type: 'punch_in',
          agentName: profileMap.get(a.user_id) || 'Unknown',
          detail: 'Punched in',
          timestamp: a.punch_in_time!,
        });
      }

      feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const recentActivity = feed.slice(0, 25);

      if (signal?.cancelled) return;
      setData({ kpis, teamMembers, visitsTrend, teamPerformance, recentActivity });
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      if (!signal?.cancelled) setData(EMPTY);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchAll(signal);
    return () => { signal.cancelled = true; };
  }, [fetchAll]);

  const refresh = useCallback(() => {
    fetchAll({ cancelled: false });
  }, [fetchAll]);

  return { data, loading, refresh };
}
