import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { startOfToday, startOfWeek, endOfWeek, subWeeks, subDays, format } from 'date-fns';

export function useMyStats() {
  const { user, currentOrganization } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id, currentOrganization?.id],
    queryFn: async () => {
      if (!user || !currentOrganization) return null;

      const now = new Date();
      const todayStart = startOfToday();
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

      // Get active visits (not checked out)
      const { count: activeVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('check_out_time', null);

      // Get customers count
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);

      return {
        visitsToday: visitsToday || 0,
        visitsThisWeek: visitsThisWeek || 0,
        visitsLastWeek: visitsLastWeek || 0,
        activeVisits: activeVisits || 0,
        totalCustomers: totalCustomers || 0,
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
