import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  city: string | null;
  activeAgents: number;
  visitsToday: number;
  visitsMonth: number;
  salesTarget: number;
  salesActual: number;
  prospectsTarget: number;
  prospectsActual: number;
  quotesTarget: number;
  quotesActual: number;
  achievementPct: number;
  attendanceDays: number;
  totalWorkingDays: number;
  attendanceRate: number;
  topPerformer: string | null;
}

export interface EmployeePerformance {
  userId: string;
  fullName: string;
  branchId: string | null;
  branchName: string | null;
  visitsToday: number;
  visitsMonth: number;
  completedVisits: number;
  cancelledVisits: number;
  avgVisitDuration: number;
  salesTarget: number;
  salesActual: number;
  prospectsTarget: number;
  prospectsActual: number;
  quotesTarget: number;
  quotesActual: number;
  achievementPct: number;
  attendanceDays: number;
  lastActive: string | null;
}

export interface OrgSummary {
  totalSales: number;
  totalSalesTarget: number;
  avgAchievement: number;
  totalVisits: number;
  attendanceRate: number;
  branches: BranchPerformance[];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function countWorkingDays(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  let count = 0;
  const d = new Date(start);
  while (d <= now) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function useOrgPerformance() {
  const { currentOrganization } = useAuthStore();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['performance-org', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgSummary> => {
      const { start: monthStart, end: monthEnd } = getMonthRange();
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const workingDays = countWorkingDays();

      // Fetch branches, profiles, visits, attendance, daily_plans in parallel
      const [branchesRes, profilesRes, visitsRes, attendanceRes, plansRes, todayVisitsRes] = await Promise.all([
        supabase.from('branches').select('id, name, city').eq('organization_id', orgId!),
        supabase.from('profiles').select('id, full_name, branch_id, is_active').eq('organization_id', orgId!).eq('is_active', true),
        supabase.from('visits').select('id, user_id, status, check_in_time, check_out_time').eq('organization_id', orgId!).gte('check_in_time', monthStart).lte('check_in_time', monthEnd),
        supabase.from('attendance').select('id, user_id, date').eq('organization_id', orgId!).gte('date', monthStart.split('T')[0]).lte('date', monthEnd.split('T')[0]),
        supabase.from('daily_plans').select('user_id, policies_target, policies_actual, prospects_target, prospects_actual, quotes_target, quotes_actual').eq('organization_id', orgId!).gte('plan_date', monthStart.split('T')[0]).lte('plan_date', monthEnd.split('T')[0]),
        supabase.from('visits').select('id, user_id').eq('organization_id', orgId!).gte('check_in_time', todayStart).lte('check_in_time', todayEnd),
      ]);

      const branches = branchesRes.data || [];
      const profiles = profilesRes.data || [];
      const visits = visitsRes.data || [];
      const attendance = attendanceRes.data || [];
      const plans = plansRes.data || [];
      const todayVisits = todayVisitsRes.data || [];

      // Group by branch
      const branchPerfs: BranchPerformance[] = branches.map(branch => {
        const branchUsers = profiles.filter(p => p.branch_id === branch.id);
        const branchUserIds = new Set(branchUsers.map(u => u.id));
        const branchVisits = visits.filter(v => branchUserIds.has(v.user_id));
        const branchTodayVisits = todayVisits.filter(v => branchUserIds.has(v.user_id));
        const branchAttendance = attendance.filter(a => branchUserIds.has(a.user_id));
        const branchPlans = plans.filter(p => branchUserIds.has(p.user_id));

        const salesTarget = branchPlans.reduce((s, p) => s + (p.policies_target || 0), 0);
        const salesActual = branchPlans.reduce((s, p) => s + (p.policies_actual || 0), 0);
        const prospectsTarget = branchPlans.reduce((s, p) => s + (p.prospects_target || 0), 0);
        const prospectsActual = branchPlans.reduce((s, p) => s + (p.prospects_actual || 0), 0);
        const quotesTarget = branchPlans.reduce((s, p) => s + (p.quotes_target || 0), 0);
        const quotesActual = branchPlans.reduce((s, p) => s + (p.quotes_actual || 0), 0);

        // Unique attendance days per user
        const userAttDays = new Map<string, Set<string>>();
        branchAttendance.forEach(a => {
          if (!userAttDays.has(a.user_id)) userAttDays.set(a.user_id, new Set());
          userAttDays.get(a.user_id)!.add(a.date);
        });
        const totalAttDays = Array.from(userAttDays.values()).reduce((s, set) => s + set.size, 0);
        const attendanceRate = branchUsers.length > 0 && workingDays > 0
          ? (totalAttDays / (branchUsers.length * workingDays)) * 100
          : 0;

        // Top performer by sales actual
        const userSales = new Map<string, number>();
        branchPlans.forEach(p => {
          userSales.set(p.user_id, (userSales.get(p.user_id) || 0) + (p.policies_actual || 0));
        });
        let topPerformer: string | null = null;
        let maxSales = 0;
        userSales.forEach((sales, uid) => {
          if (sales > maxSales) {
            maxSales = sales;
            const user = branchUsers.find(u => u.id === uid);
            topPerformer = user?.full_name || null;
          }
        });

        return {
          branchId: branch.id,
          branchName: branch.name,
          city: branch.city,
          activeAgents: branchUsers.length,
          visitsToday: branchTodayVisits.length,
          visitsMonth: branchVisits.length,
          salesTarget,
          salesActual,
          prospectsTarget,
          prospectsActual,
          quotesTarget,
          quotesActual,
          achievementPct: salesTarget > 0 ? Math.round((salesActual / salesTarget) * 100) : 0,
          attendanceDays: totalAttDays,
          totalWorkingDays: workingDays * branchUsers.length,
          attendanceRate: Math.round(attendanceRate),
          topPerformer,
        };
      });

      const totalSales = branchPerfs.reduce((s, b) => s + b.salesActual, 0);
      const totalSalesTarget = branchPerfs.reduce((s, b) => s + b.salesTarget, 0);
      const totalVisitsCount = branchPerfs.reduce((s, b) => s + b.visitsMonth, 0);
      const avgAch = branchPerfs.length > 0
        ? Math.round(branchPerfs.reduce((s, b) => s + b.achievementPct, 0) / branchPerfs.length)
        : 0;
      const avgAtt = branchPerfs.length > 0
        ? Math.round(branchPerfs.reduce((s, b) => s + b.attendanceRate, 0) / branchPerfs.length)
        : 0;

      return {
        totalSales,
        totalSalesTarget,
        avgAchievement: avgAch,
        totalVisits: totalVisitsCount,
        attendanceRate: avgAtt,
        branches: branchPerfs,
      };
    },
  });
}

export function useBranchEmployees(branchId: string | null) {
  const { currentOrganization } = useAuthStore();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['performance-branch', orgId, branchId],
    enabled: !!orgId && !!branchId,
    queryFn: async (): Promise<EmployeePerformance[]> => {
      const { start: monthStart, end: monthEnd } = getMonthRange();
      const { start: todayStart, end: todayEnd } = getTodayRange();

      // Fetch users in this branch
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, branch_id')
        .eq('organization_id', orgId!)
        .eq('branch_id', branchId!)
        .eq('is_active', true);

      if (!users || users.length === 0) return [];

      const userIds = users.map(u => u.id);

      const [visitsRes, todayVisitsRes, attendanceRes, plansRes] = await Promise.all([
        supabase.from('visits').select('id, user_id, status, check_in_time, check_out_time').eq('organization_id', orgId!).in('user_id', userIds).gte('check_in_time', monthStart).lte('check_in_time', monthEnd),
        supabase.from('visits').select('id, user_id').eq('organization_id', orgId!).in('user_id', userIds).gte('check_in_time', todayStart).lte('check_in_time', todayEnd),
        supabase.from('attendance').select('id, user_id, date').eq('organization_id', orgId!).in('user_id', userIds).gte('date', monthStart.split('T')[0]).lte('date', monthEnd.split('T')[0]),
        supabase.from('daily_plans').select('user_id, policies_target, policies_actual, prospects_target, prospects_actual, quotes_target, quotes_actual, plan_date').eq('organization_id', orgId!).in('user_id', userIds).gte('plan_date', monthStart.split('T')[0]).lte('plan_date', monthEnd.split('T')[0]),
      ]);

      const visits = visitsRes.data || [];
      const todayVisits = todayVisitsRes.data || [];
      const attendance = attendanceRes.data || [];
      const plans = plansRes.data || [];

      // Get branch name
      const { data: branchData } = await supabase.from('branches').select('name').eq('id', branchId!).single();

      return users.map(user => {
        const userVisits = visits.filter(v => v.user_id === user.id);
        const userTodayVisits = todayVisits.filter(v => v.user_id === user.id);
        const userAttendance = attendance.filter(a => a.user_id === user.id);
        const userPlans = plans.filter(p => p.user_id === user.id);

        const completedVisits = userVisits.filter(v => v.status === 'completed');
        const cancelledVisits = userVisits.filter(v => v.status === 'cancelled');

        // Avg visit duration in minutes
        const durations = completedVisits
          .filter(v => v.check_out_time)
          .map(v => (new Date(v.check_out_time!).getTime() - new Date(v.check_in_time).getTime()) / 60000);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;

        const salesTarget = userPlans.reduce((s, p) => s + (p.policies_target || 0), 0);
        const salesActual = userPlans.reduce((s, p) => s + (p.policies_actual || 0), 0);
        const prospectsTarget = userPlans.reduce((s, p) => s + (p.prospects_target || 0), 0);
        const prospectsActual = userPlans.reduce((s, p) => s + (p.prospects_actual || 0), 0);
        const quotesTarget = userPlans.reduce((s, p) => s + (p.quotes_target || 0), 0);
        const quotesActual = userPlans.reduce((s, p) => s + (p.quotes_actual || 0), 0);

        const uniqueAttDays = new Set(userAttendance.map(a => a.date)).size;

        // Last active = most recent visit
        const lastVisit = userVisits.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())[0];

        return {
          userId: user.id,
          fullName: user.full_name || 'Unknown',
          branchId: user.branch_id,
          branchName: branchData?.name || null,
          visitsToday: userTodayVisits.length,
          visitsMonth: userVisits.length,
          completedVisits: completedVisits.length,
          cancelledVisits: cancelledVisits.length,
          avgVisitDuration: avgDuration,
          salesTarget,
          salesActual,
          prospectsTarget,
          prospectsActual,
          quotesTarget,
          quotesActual,
          achievementPct: salesTarget > 0 ? Math.round((salesActual / salesTarget) * 100) : 0,
          attendanceDays: uniqueAttDays,
          lastActive: lastVisit?.check_in_time || null,
        };
      }).sort((a, b) => b.achievementPct - a.achievementPct);
    },
  });
}

export function useEmployeeDetail(userId: string | null) {
  const { currentOrganization } = useAuthStore();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['performance-employee', orgId, userId],
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const { start: monthStart, end: monthEnd } = getMonthRange();

      const [profileRes, visitsRes, attendanceRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, branch_id').eq('id', userId!).single(),
        supabase.from('visits').select('id, status, check_in_time, check_out_time, purpose').eq('organization_id', orgId!).eq('user_id', userId!).gte('check_in_time', monthStart).lte('check_in_time', monthEnd).order('check_in_time', { ascending: false }),
        supabase.from('attendance').select('id, date, punch_in_time, punch_out_time, total_hours').eq('organization_id', orgId!).eq('user_id', userId!).gte('date', monthStart.split('T')[0]).lte('date', monthEnd.split('T')[0]).order('date', { ascending: false }),
        supabase.from('daily_plans').select('plan_date, policies_target, policies_actual, prospects_target, prospects_actual, quotes_target, quotes_actual').eq('organization_id', orgId!).eq('user_id', userId!).gte('plan_date', monthStart.split('T')[0]).lte('plan_date', monthEnd.split('T')[0]).order('plan_date', { ascending: true }),
      ]);

      const branchRes = profileRes.data?.branch_id
        ? await supabase.from('branches').select('name').eq('id', profileRes.data.branch_id).single()
        : null;

      return {
        profile: { ...profileRes.data, branchName: branchRes?.data?.name || null },
        visits: visitsRes.data || [],
        attendance: attendanceRes.data || [],
        dailyPlans: plansRes.data || [],
      };
    },
  });
}

// Daily trend data for charts
export function useDailyTrends() {
  const { currentOrganization } = useAuthStore();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['performance-daily-trends', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { start: monthStart, end: monthEnd } = getMonthRange();

      const [branchesRes, profilesRes, plansRes] = await Promise.all([
        supabase.from('branches').select('id, name').eq('organization_id', orgId!),
        supabase.from('profiles').select('id, branch_id').eq('organization_id', orgId!).eq('is_active', true),
        supabase.from('daily_plans').select('user_id, plan_date, policies_actual').eq('organization_id', orgId!).gte('plan_date', monthStart.split('T')[0]).lte('plan_date', monthEnd.split('T')[0]),
      ]);

      const branches = branchesRes.data || [];
      const profiles = profilesRes.data || [];
      const plans = plansRes.data || [];

      // Build daily trend per branch
      const dates = [...new Set(plans.map(p => p.plan_date))].sort();

      return dates.map(date => {
        const row: Record<string, any> = { date };
        branches.forEach(branch => {
          const branchUserIds = new Set(profiles.filter(p => p.branch_id === branch.id).map(p => p.id));
          const dayPlans = plans.filter(p => p.plan_date === date && branchUserIds.has(p.user_id));
          row[branch.name] = dayPlans.reduce((s, p) => s + (p.policies_actual || 0), 0);
        });
        return row;
      });
    },
  });
}
