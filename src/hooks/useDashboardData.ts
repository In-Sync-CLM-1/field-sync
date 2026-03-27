import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfToday, startOfWeek, endOfWeek, subWeeks, subDays, format, differenceInMinutes } from 'date-fns';
import { useState } from 'react';

export type VisitFilter = 'today' | 'this_week' | 'pending' | 'completed';

export interface ScheduledVisit {
  customerId: string;
  customerName: string;
  purpose?: string;
  location?: string;
  scheduledTime?: string;
}

export interface RecentVisit {
  id: string;
  customerId: string;
  customerName: string;
  purpose?: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number;
  location?: string;
  isCompleted: boolean;
}

export function useMyStats() {
  const { user, currentOrganization } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return null;

      const now = new Date();
      const todayStart = startOfToday();
      const todayString = format(todayStart, 'yyyy-MM-dd');
      const thisWeekStart = startOfWeek(now);
      const thisWeekEnd = endOfWeek(now);
      const lastWeekStart = startOfWeek(subWeeks(now, 1));
      const lastWeekEnd = endOfWeek(subWeeks(now, 1));

      // Get visits today
      const { count: visitsToday } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('check_in_time', todayStart.toISOString());

      // Get visits this week
      const { count: visitsThisWeek } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('check_in_time', thisWeekStart.toISOString())
        .lte('check_in_time', thisWeekEnd.toISOString());

      // Get visits last week
      const { count: visitsLastWeek } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('check_in_time', lastWeekStart.toISOString())
        .lte('check_in_time', lastWeekEnd.toISOString());

      // Get active visits with oldest start time
      const { data: activeVisitsData } = await supabase
        .from('visits')
        .select('check_in_time')
        .eq('user_id', user.id)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: true });

      const activeVisits = activeVisitsData?.length || 0;
      const oldestActiveVisitTime = activeVisitsData?.[0]?.check_in_time 
        ? new Date(activeVisitsData[0].check_in_time) 
        : null;
      const activeVisitMinutes = oldestActiveVisitTime 
        ? differenceInMinutes(now, oldestActiveVisitTime) 
        : 0;

      // Get today's plan for planned visits
      const { data: todayPlan } = await supabase
        .from('daily_plans')
        .select('prospects_target')
        .eq('user_id', user.id)
        .eq('plan_date', todayString)
        .maybeSingle();

      const plannedVisitsToday = todayPlan?.prospects_target || 0;

      // Get this week's plans for planned visits
      const { data: weekPlans } = await supabase
        .from('daily_plans')
        .select('prospects_target')
        .eq('user_id', user.id)
        .gte('plan_date', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('plan_date', format(thisWeekEnd, 'yyyy-MM-dd'));

      const plannedVisitsWeek = weekPlans?.reduce((sum, p) => sum + (p.prospects_target || 0), 0) || 0;

      // Get open leads count (not enrolled/converted/closed)
      const { count: openLeadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .not('status', 'in', '("enrolled","converted","closed")');

      // Get total leads count
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      // Get leads needing follow-up today
      const { count: followUpToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('follow_up_date', todayString);

      // Get overdue follow-ups (follow_up_date < today and not closed)
      const { count: overdueFollowUps } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .lt('follow_up_date', todayString)
        .not('status', 'in', '("enrolled","converted","closed")');

      // Get visits from last 30 days with checkout for avg duration
      const thirtyDaysAgo = subDays(now, 30);
      const { data: completedVisits } = await supabase
        .from('visits')
        .select('check_in_time, check_out_time')
        .eq('user_id', user.id)
        .gte('check_in_time', thirtyDaysAgo.toISOString())
        .not('check_out_time', 'is', null);

      // Calculate average visit duration in minutes
      let avgVisitDuration = 0;
      if (completedVisits && completedVisits.length > 0) {
        const totalMinutes = completedVisits.reduce((sum, visit) => {
          const checkIn = new Date(visit.check_in_time);
          const checkOut = new Date(visit.check_out_time!);
          return sum + differenceInMinutes(checkOut, checkIn);
        }, 0);
        avgVisitDuration = Math.round(totalMinutes / completedVisits.length);
      }

      // Calculate pending visits today (planned - completed)
      const pendingVisitsToday = Math.max(0, plannedVisitsToday - (visitsToday || 0));

      // Calculate weekly trend percentage
      const weeklyTrend = visitsLastWeek && visitsLastWeek > 0
        ? Math.round(((visitsThisWeek || 0) - visitsLastWeek) / visitsLastWeek * 100)
        : 0;

      return {
        visitsToday: visitsToday || 0,
        visitsThisWeek: visitsThisWeek || 0,
        visitsLastWeek: visitsLastWeek || 0,
        activeVisits,
        activeVisitMinutes,
        totalLeads: totalLeads || 0,
        openLeadsCount: openLeadsCount || 0,
        followUpToday: followUpToday || 0,
        plannedVisitsToday,
        plannedVisitsWeek,
        weeklyTrend,
        pendingVisitsToday,
        overdueFollowUps: overdueFollowUps || 0,
        avgVisitDuration,
        pendingSync: 0,
        formsCompleted: 0,
        photosCaptured: 0,
      };
    },
    enabled: !!user && !!currentOrganization,
  });

  return stats;
}

export function useAnalyticsData() {
  const { user, currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['analytics-data', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return null;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      // Get all visits for last 30 days
      const { data: visits } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user.id)
        .gte('check_in_time', thirtyDaysAgo.toISOString());

      // Calculate visits by day
      const visitsByDay: Record<string, number> = {};
      const visitsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
      let totalDuration = 0;
      let completedVisits = 0;

      visits?.forEach(visit => {
        const date = format(new Date(visit.check_in_time), 'yyyy-MM-dd');
        visitsByDay[date] = (visitsByDay[date] || 0) + 1;

        const dayOfWeek = new Date(visit.check_in_time).getDay();
        visitsByDayOfWeek[dayOfWeek]++;

        if (visit.check_out_time) {
          completedVisits++;
          const duration = new Date(visit.check_out_time).getTime() - new Date(visit.check_in_time).getTime();
          totalDuration += duration;
        }
      });

      const avgDuration = completedVisits > 0 ? Math.round(totalDuration / completedVisits / 60000) : 0;

      return {
        visitsByDay,
        visitsByDayOfWeek,
        avgDuration,
        formCompletionRate: 0,
        photoCompletionRate: 0,
        totalVisits: visits?.length || 0,
      };
    },
    enabled: !!user && !!currentOrganization,
  });
}

export function usePerformanceData() {
  const { currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['performance-data', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      // Get all users in organization with their visit counts
      const userRolesResult = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', currentOrganization.id);

      const userRoles = userRolesResult.data as Array<{ user_id: string }> | null;

      if (!userRoles) return [];

      const performanceData = await Promise.all(
        userRoles.map(async (ur) => {
          const profileQuery = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ur.user_id)
            .single();

          const profile = profileQuery.data;
          
          const totalVisitsQuery = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', ur.user_id);

          const completedVisitsQuery = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', ur.user_id)
            .not('check_out_time', 'is', null);

          const totalVisits = totalVisitsQuery.count || 0;
          const completedVisits = completedVisitsQuery.count || 0;
          const completionRate = totalVisits ? Math.round((completedVisits / totalVisits) * 100) : 0;

          return {
            id: ur.user_id,
            name: profile?.full_name || 'Unknown',
            totalVisits,
            completedVisits,
            visitsThisMonth: totalVisits,
            completionRate,
          };
        })
      );

      return performanceData.sort((a, b) => b.totalVisits - a.totalVisits);
    },
    enabled: !!currentOrganization,
  });
}

export function useTeamStats() {
  const { currentOrganization } = useAuthStore();

  return useQuery({
    queryKey: ['team-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return null;

      const now = new Date();
      const todayStart = startOfToday();
      const thirtyDaysAgo = subDays(now, 30);

      // Get visits today
      const { count: totalVisitsToday } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', todayStart.toISOString());

      // Get visits last 30 days
      const { count: visitsLast30Days } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', thirtyDaysAgo.toISOString());

      // Get all visits for completion rate
      const { data: allVisits } = await supabase
        .from('visits')
        .select('check_out_time');

      const completedVisits = allVisits?.filter(v => v.check_out_time).length || 0;
      const completionRate = allVisits?.length ? Math.round((completedVisits / allVisits.length) * 100) : 0;

      // Get agent activity
      const userRolesResult = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', currentOrganization.id);

      const userRoles = userRolesResult.data as Array<{ user_id: string }> | null;

      const agentActivity = await Promise.all(
        (userRoles || []).map(async (ur) => {
          const profileQuery = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ur.user_id)
            .single();

          const profile = profileQuery.data;

          const recentVisitQuery = await supabase
            .from('visits')
            .select('check_in_time')
            .eq('user_id', ur.user_id)
            .order('check_in_time', { ascending: false })
            .limit(1)
            .single();

          const recentVisit = recentVisitQuery.data;

          const visitsTodayQuery = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', ur.user_id)
            .gte('check_in_time', todayStart.toISOString());

          const visitsToday = visitsTodayQuery.count || 0;

          const lastActive = recentVisit?.check_in_time || new Date().toISOString();
          const isToday = new Date(lastActive).toDateString() === new Date().toDateString();

          return {
            id: ur.user_id,
            name: profile?.full_name || 'Unknown',
            status: isToday ? 'active' : 'inactive',
            lastActive,
            visitsToday,
          };
        })
      );

      const activeAgents = agentActivity.filter(a => a.status === 'active').length;

      return {
        totalVisitsToday: totalVisitsToday || 0,
        activeAgents,
        completionRate,
        visitsLast30Days: visitsLast30Days || 0,
        agentActivity,
      };
    },
    enabled: !!currentOrganization,
  });
}

export function useRecentVisits() {
  const { user, currentOrganization } = useAuthStore();
  const [filter, setFilter] = useState<VisitFilter>('today');

  const todayStart = startOfToday();
  const todayString = format(todayStart, 'yyyy-MM-dd');
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);

  // Fetch scheduled visits from plan_enrollments for today
  const { data: scheduledVisits, isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['scheduled-visits', user?.id, currentOrganization?.id, todayString],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];

      // Get today's daily plan
      const { data: todayPlan } = await supabase
        .from('daily_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_date', todayString)
        .maybeSingle();

      if (!todayPlan) return [];

      // Get plan enrollments with customer data
      const { data: enrollments } = await supabase
        .from('plan_enrollments')
        .select(`
          id,
          customer_id,
          notes,
          enrolled_at,
          leads:customer_id (
            id,
            name,
            village_city,
            district,
            policy_type
          )
        `)
        .eq('daily_plan_id', todayPlan.id);

      if (!enrollments) return [];

      // Get today's visits to filter out already visited
      const { data: todayVisits } = await supabase
        .from('visits')
        .select('customer_id')
        .eq('user_id', user.id)
        .gte('check_in_time', todayStart.toISOString());

      const visitedCustomerIds = new Set(todayVisits?.map(v => v.customer_id) || []);

      // Map to scheduled visits, filtering out already visited
      const scheduled: ScheduledVisit[] = enrollments
        .filter(e => !visitedCustomerIds.has(e.customer_id))
        .map((enrollment, index) => {
          const lead = enrollment.leads as unknown as { id: string; name: string; village_city?: string; district?: string; policy_type?: string } | null;
          return {
            customerId: enrollment.customer_id,
            customerName: lead?.name || 'Unknown Customer',
            purpose: enrollment.notes || lead?.policy_type || 'Scheduled Visit',
            location: lead?.village_city || lead?.district || undefined,
            scheduledTime: format(new Date(todayStart.getTime() + (9 + index) * 60 * 60 * 1000), 'hh:mm a'), // Estimate times starting 9 AM
          };
        });

      return scheduled;
    },
    enabled: !!user && !!currentOrganization,
  });

  // Fetch recent visits based on filter
  const { data: recentVisits, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recent-visits', user?.id, currentOrganization?.id, filter],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];

      let query = supabase
        .from('visits')
        .select(`
          id,
          customer_id,
          check_in_time,
          check_out_time,
          notes,
          leads:customer_id (
            id,
            name,
            village_city,
            district,
            policy_type
          )
        `)
        .eq('user_id', user.id)
        .order('check_in_time', { ascending: false })
        .limit(10);

      // Apply filter conditions
      if (filter === 'today') {
        query = query.gte('check_in_time', todayStart.toISOString());
      } else if (filter === 'this_week') {
        query = query
          .gte('check_in_time', thisWeekStart.toISOString())
          .lte('check_in_time', thisWeekEnd.toISOString());
      } else if (filter === 'pending') {
        query = query.is('check_out_time', null);
      } else if (filter === 'completed') {
        query = query.not('check_out_time', 'is', null);
      }

      const { data: visits } = await query;

      if (!visits) return [];

      const mapped: RecentVisit[] = visits.map(visit => {
        const lead = visit.leads as unknown as { id: string; name: string; village_city?: string; district?: string; policy_type?: string } | null;
        const checkIn = new Date(visit.check_in_time);
        const checkOut = visit.check_out_time ? new Date(visit.check_out_time) : null;
        const duration = checkOut ? differenceInMinutes(checkOut, checkIn) : undefined;

        return {
          id: visit.id,
          customerId: visit.customer_id,
          customerName: lead?.name || 'Unknown Customer',
          purpose: visit.notes || lead?.policy_type || 'Visit',
          checkInTime: visit.check_in_time,
          checkOutTime: visit.check_out_time || undefined,
          duration,
          location: lead?.village_city || lead?.district || undefined,
          isCompleted: !!visit.check_out_time,
        };
      });

      return mapped;
    },
    enabled: !!user && !!currentOrganization,
  });

  // Count of today's visits for context switching
  const { data: todayVisitsCount } = useQuery({
    queryKey: ['today-visits-count', user?.id, todayString],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('check_in_time', todayStart.toISOString());
      return count || 0;
    },
    enabled: !!user,
  });

  return {
    scheduledVisits: scheduledVisits || [],
    recentVisits: recentVisits || [],
    filter,
    setFilter,
    isLoading: isLoadingScheduled || isLoadingRecent,
    hasNoVisitsToday: (todayVisitsCount || 0) === 0,
    hasSchedule: (scheduledVisits?.length || 0) > 0,
  };
}
