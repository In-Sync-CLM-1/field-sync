import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

export interface Attendance {
  id: string;
  user_id: string;
  organization_id: string;
  date: string;
  punch_in_time: string | null;
  punch_in_latitude: number | null;
  punch_in_longitude: number | null;
  punch_in_accuracy: number | null;
  punch_out_time: string | null;
  punch_out_latitude: number | null;
  punch_out_longitude: number | null;
  punch_out_accuracy: number | null;
  status: string;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAttendance() {
  const { user, currentOrganization } = useAuthStore();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayAttendance = useQuery({
    queryKey: ['attendance', 'today', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('attendance' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Attendance | null;
    },
    enabled: !!user,
  });

  const myHistory = useQuery({
    queryKey: ['attendance', 'history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('attendance' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as unknown as Attendance[];
    },
    enabled: !!user,
  });

  const teamAttendance = useQuery({
    queryKey: ['attendance', 'team', today],
    queryFn: async () => {
      if (!user || !currentOrganization) return [];
      const { data, error } = await supabase
        .from('attendance' as any)
        .select('*, profiles:user_id(full_name, email)')
        .eq('organization_id', currentOrganization.id)
        .eq('date', today);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user && !!currentOrganization,
  });

  const punchIn = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      if (!user || !currentOrganization) throw new Error('Not authenticated');
      const { latitude, longitude, accuracy } = position.coords;
      const { data, error } = await supabase
        .from('attendance' as any)
        .insert({
          user_id: user.id,
          organization_id: currentOrganization.id,
          date: today,
          punch_in_time: new Date().toISOString(),
          punch_in_latitude: latitude,
          punch_in_longitude: longitude,
          punch_in_accuracy: accuracy,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Attendance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const punchOut = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: GeolocationPosition }) => {
      const { latitude, longitude, accuracy } = position.coords;
      const punchOutTime = new Date();
      
      // Get punch in time to calculate hours
      const record = todayAttendance.data;
      let totalHours: number | null = null;
      if (record?.punch_in_time) {
        const punchInMs = new Date(record.punch_in_time).getTime();
        totalHours = (punchOutTime.getTime() - punchInMs) / (1000 * 60 * 60);
        totalHours = Math.round(totalHours * 100) / 100;
      }

      const { data, error } = await supabase
        .from('attendance' as any)
        .update({
          punch_out_time: punchOutTime.toISOString(),
          punch_out_latitude: latitude,
          punch_out_longitude: longitude,
          punch_out_accuracy: accuracy,
          status: 'completed',
          total_hours: totalHours,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Attendance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  return {
    todayAttendance,
    myHistory,
    teamAttendance,
    punchIn,
    punchOut,
  };
}
