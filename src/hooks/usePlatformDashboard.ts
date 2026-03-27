import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, subDays } from 'date-fns';

export interface PlatformSummary {
  totalOrgs: number;
  totalUsers: number;
  totalVisits: number;
  visitsToday: number;
  totalCustomers: number;
  attendanceToday: number;
}

export interface OrgRow {
  id: string;
  name: string;
  subscriptionStatus: string | null;
  isActive: boolean;
  users: number;
  customers: number;
  visits: number;
  visitsToday: number;
  orders: number;
  lastActivity: string | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'org_created' | 'visit_completed' | 'order_placed';
  orgName: string;
  detail: string;
  timestamp: string;
}

export interface VisitsTimePoint {
  date: string;
  count: number;
}

export interface PlatformDashboardData {
  summary: PlatformSummary;
  organizations: OrgRow[];
  activityFeed: ActivityItem[];
  visitsTimeSeries: VisitsTimePoint[];
}

const EMPTY: PlatformDashboardData = {
  summary: {
    totalOrgs: 0,
    totalUsers: 0,
    totalVisits: 0,
    visitsToday: 0,
    totalCustomers: 0,
    attendanceToday: 0,
  },
  organizations: [],
  activityFeed: [],
  visitsTimeSeries: [],
};

export function usePlatformDashboard() {
  const [data, setData] = useState<PlatformDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayStart = startOfDay(new Date()).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [
        orgsRes,
        profilesRes,
        visitsRes,
        visitsChartRes,
        leadsRes,
        attendanceRes,
        ordersRes,
      ] = await Promise.all([
        supabase.from('organizations').select('*'),
        supabase.from('profiles').select('id, organization_id, full_name, email, is_active'),
        supabase.from('visits').select('id, organization_id, status, check_in_time, created_at'),
        supabase.from('visits').select('id, created_at').gte('created_at', thirtyDaysAgo),
        supabase.from('leads').select('id, organization_id, created_at'),
        supabase.from('attendance').select('id, organization_id, user_id, date, punch_in_time').eq('date', todayStr),
        supabase.from('orders').select('id, organization_id, total_amount, created_at'),
      ]);

      if (signal?.cancelled) return;

      const orgs = orgsRes.data ?? [];
      const profiles = profilesRes.data ?? [];
      const visits = visitsRes.data ?? [];
      const visitsChart = visitsChartRes.data ?? [];
      const leads = leadsRes.data ?? [];
      const attendance = attendanceRes.data ?? [];
      const orders = ordersRes.data ?? [];

      const orgMap = new Map(orgs.map(o => [o.id, o]));
      const activeProfiles = profiles.filter(p => p.is_active !== false);

      // --- Summary ---
      const visitsToday = visits.filter(v => v.created_at >= todayStart).length;
      const attendanceToday = attendance.filter(a => a.punch_in_time).length;

      const summary: PlatformSummary = {
        totalOrgs: orgs.filter(o => o.is_active).length,
        totalUsers: activeProfiles.length,
        totalVisits: visits.length,
        visitsToday,
        totalCustomers: leads.length,
        attendanceToday,
      };

      // --- Org rows ---
      const organizations: OrgRow[] = orgs.map(o => {
        const orgVisits = visits.filter(v => v.organization_id === o.id);
        const orgVisitsToday = orgVisits.filter(v => v.created_at >= todayStart).length;
        const orgOrders = orders.filter(or => or.organization_id === o.id);

        const dates = [
          ...orgVisits.map(v => v.created_at),
          ...orgOrders.map(or => or.created_at),
        ].filter(Boolean);
        const lastActivity = dates.length > 0 ? dates.sort().reverse()[0] : null;

        return {
          id: o.id,
          name: o.name,
          subscriptionStatus: o.subscription_status,
          isActive: o.is_active,
          users: activeProfiles.filter(p => p.organization_id === o.id).length,
          customers: leads.filter(l => l.organization_id === o.id).length,
          visits: orgVisits.length,
          visitsToday: orgVisitsToday,
          orders: orgOrders.length,
          lastActivity,
          createdAt: o.created_at,
        };
      });

      // --- Visits time series (30 days) ---
      const buckets = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        buckets.set(format(subDays(new Date(), i), 'MMM dd'), 0);
      }
      for (const v of visitsChart) {
        const key = format(new Date(v.created_at), 'MMM dd');
        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
      }
      const visitsTimeSeries: VisitsTimePoint[] = Array.from(buckets.entries()).map(
        ([date, count]) => ({ date, count })
      );

      // --- Activity feed ---
      const feed: ActivityItem[] = [];

      for (const o of orgs) {
        feed.push({
          id: `org-${o.id}`,
          type: 'org_created',
          orgName: o.name,
          detail: `${o.name} joined the platform`,
          timestamp: o.created_at,
        });
      }

      const recentVisits = [...visits]
        .filter(v => v.check_in_time)
        .sort((a, b) => (b.check_in_time ?? '').localeCompare(a.check_in_time ?? ''))
        .slice(0, 15);
      for (const v of recentVisits) {
        const orgName = orgMap.get(v.organization_id)?.name ?? 'Unknown';
        feed.push({
          id: `visit-${v.id}`,
          type: 'visit_completed',
          orgName,
          detail: `Visit completed by ${orgName}`,
          timestamp: v.check_in_time ?? v.created_at,
        });
      }

      const recentOrders = [...orders]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10);
      for (const o of recentOrders) {
        const orgName = orgMap.get(o.organization_id)?.name ?? 'Unknown';
        feed.push({
          id: `order-${o.id}`,
          type: 'order_placed',
          orgName,
          detail: `${orgName} placed an order${o.total_amount ? ` (₹${o.total_amount})` : ''}`,
          timestamp: o.created_at,
        });
      }

      feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const activityFeed = feed.slice(0, 25);

      if (signal?.cancelled) return;
      setData({ summary, organizations, activityFeed, visitsTimeSeries });
    } catch (err) {
      console.error('Platform dashboard fetch error:', err);
      if (!signal?.cancelled) setData(EMPTY);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

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
