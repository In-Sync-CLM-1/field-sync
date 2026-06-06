import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { istToday } from '@/hooks/usePlanVisits';

const sb = supabase as any;

export type Cadence = 'weekly' | 'fortnightly' | 'monthly';

export interface Beat {
  id: string;
  organization_id: string;
  name: string;
  agent_id: string;
  weekdays: number[];
  cadence: Cadence;
  week_parity: number;
  week_of_month: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BeatListItem extends Beat {
  agent_name: string;
  customer_count: number;
}

export interface BeatCustomer {
  id: string;
  beat_id: string;
  customer_id: string;
  seq: number;
  name: string;
  area?: string;
  mobile_no?: string;
  has_location: boolean;
}

export interface OrgMember {
  id: string;
  full_name: string;
}

export interface BeatInput {
  id?: string;
  name: string;
  agent_id: string;
  weekdays: number[];
  cadence: Cadence;
  week_parity: number;
  week_of_month: number;
  active: boolean;
  customer_ids: string[]; // ordered
}

/** Active members of the org (for the "assign rep" picker). */
export function useOrgMembers() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['org-members', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<OrgMember[]> => {
      const { data, error } = await sb
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', org!.id)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return (data || []).map((p: any) => ({ id: p.id, full_name: p.full_name || 'Unknown' }));
    },
  });
}

export function useBeats() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['beats', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<BeatListItem[]> => {
      const { data: beats, error } = await sb
        .from('beats')
        .select('*')
        .eq('organization_id', org!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const beatRows = (beats || []) as Beat[];
      if (beatRows.length === 0) return [];

      const agentIds = [...new Set(beatRows.map((b) => b.agent_id))];
      const beatIds = beatRows.map((b) => b.id);
      const [agentsRes, bcRes] = await Promise.all([
        sb.from('profiles').select('id, full_name').in('id', agentIds),
        sb.from('beat_customers').select('beat_id').in('beat_id', beatIds),
      ]);
      const agentMap = new Map((agentsRes.data || []).map((a: any) => [a.id, a.full_name || 'Unknown']));
      const counts = new Map<string, number>();
      (bcRes.data || []).forEach((r: any) => counts.set(r.beat_id, (counts.get(r.beat_id) || 0) + 1));

      return beatRows.map((b) => ({
        ...b,
        agent_name: agentMap.get(b.agent_id) || 'Unassigned',
        customer_count: counts.get(b.id) || 0,
      }));
    },
  });
}

/** A single beat with its ordered customer list (for the editor). */
export function useBeat(beatId?: string) {
  return useQuery({
    queryKey: ['beat', beatId],
    enabled: !!beatId,
    queryFn: async (): Promise<{ beat: Beat; customers: BeatCustomer[] } | null> => {
      const { data: beat, error } = await sb.from('beats').select('*').eq('id', beatId).maybeSingle();
      if (error) throw error;
      if (!beat) return null;
      const { data: bc } = await sb
        .from('beat_customers')
        .select('id, beat_id, customer_id, seq')
        .eq('beat_id', beatId)
        .order('seq');
      const rows = (bc || []) as any[];
      const ids = rows.map((r) => r.customer_id);
      const { data: leads } = ids.length
        ? await sb.from('leads').select('id,name,village_city,district,mobile_no,latitude,longitude').in('id', ids)
        : { data: [] };
      const leadMap = new Map((leads || []).map((l: any) => [l.id, l]));
      const customers: BeatCustomer[] = rows.map((r) => {
        const l: any = leadMap.get(r.customer_id) || {};
        return {
          id: r.id,
          beat_id: r.beat_id,
          customer_id: r.customer_id,
          seq: r.seq,
          name: l.name || 'Customer',
          area: l.village_city || l.district || '',
          mobile_no: l.mobile_no,
          has_location: !!(l.latitude && l.longitude),
        };
      });
      return { beat: beat as Beat, customers };
    },
  });
}

export function useBeatMutations() {
  const qc = useQueryClient();
  const org = useAuthStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);

  const saveBeat = useMutation({
    mutationFn: async (input: BeatInput) => {
      if (!org) throw new Error('No organization');
      const payload = {
        organization_id: org.id,
        name: input.name.trim(),
        agent_id: input.agent_id,
        weekdays: input.weekdays,
        cadence: input.cadence,
        week_parity: input.week_parity,
        week_of_month: input.week_of_month,
        active: input.active,
      };

      let beatId = input.id;
      if (beatId) {
        const { error } = await sb.from('beats').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', beatId);
        if (error) throw error;
      } else {
        const { data, error } = await sb.from('beats').insert({ ...payload, created_by: user?.id }).select('id').single();
        if (error) throw error;
        beatId = data.id;
      }

      // Replace the customer set with the ordered list.
      await sb.from('beat_customers').delete().eq('beat_id', beatId);
      if (input.customer_ids.length) {
        const rows = input.customer_ids.map((cid, i) => ({ beat_id: beatId, customer_id: cid, seq: i }));
        const { error: insErr } = await sb.from('beat_customers').insert(rows);
        if (insErr) throw insErr;
      }
      return beatId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beats'] });
      qc.invalidateQueries({ queryKey: ['beat'] });
      qc.invalidateQueries({ queryKey: ['beat-coverage'] });
      toast.success('Beat saved');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to save beat'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await sb.from('beats').update({ active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beats'] }),
    onError: () => toast.error('Failed to update beat'),
  });

  const deleteBeat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('beats').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beats'] });
      qc.invalidateQueries({ queryKey: ['beat-coverage'] });
      toast.success('Beat deleted');
    },
    onError: () => toast.error('Failed to delete beat'),
  });

  return { saveBeat, toggleActive, deleteBeat };
}

export interface Coverage {
  orphans: { id: string; name: string; area?: string }[];
  perRep: { agent_id: string; agent_name: string; beats: number; customers: number }[];
  adherence: { planned: number; visited: number; skipped: number; days: number };
}

/** Coverage + adherence for the manager view (last `days` of plan history). */
export function useCoverage(days = 14) {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['beat-coverage', org?.id, days],
    enabled: !!org,
    queryFn: async (): Promise<Coverage> => {
      const orgId = org!.id;
      const [beatsRes, leadsRes] = await Promise.all([
        sb.from('beats').select('id, agent_id').eq('organization_id', orgId),
        sb.from('leads').select('id,name,village_city,district,status').eq('organization_id', orgId).limit(2000),
      ]);
      const beats = (beatsRes.data || []) as any[];
      const beatIds = beats.map((b) => b.id);
      const bcRes = beatIds.length
        ? await sb.from('beat_customers').select('beat_id, customer_id').in('beat_id', beatIds)
        : { data: [] };
      const onBeat = new Set((bcRes.data || []).map((r: any) => r.customer_id));

      // Orphans: active customers on no beat.
      const orphans = (leadsRes.data || [])
        .filter((l: any) => (l.status || 'active') !== 'lost' && !onBeat.has(l.id))
        .map((l: any) => ({ id: l.id, name: l.name, area: l.village_city || l.district || '' }));

      // Per-rep coverage.
      const agentIds = [...new Set(beats.map((b) => b.agent_id))];
      const agentsRes = agentIds.length
        ? await sb.from('profiles').select('id, full_name').in('id', agentIds)
        : { data: [] };
      const agentName = new Map((agentsRes.data || []).map((a: any) => [a.id, a.full_name || 'Unknown']));
      const custByBeat = new Map<string, number>();
      (bcRes.data || []).forEach((r: any) => custByBeat.set(r.beat_id, (custByBeat.get(r.beat_id) || 0) + 1));
      const perRepMap = new Map<string, { beats: number; customers: number }>();
      beats.forEach((b) => {
        const cur = perRepMap.get(b.agent_id) || { beats: 0, customers: 0 };
        cur.beats += 1;
        cur.customers += custByBeat.get(b.id) || 0;
        perRepMap.set(b.agent_id, cur);
      });
      const perRep = [...perRepMap.entries()].map(([agent_id, v]) => ({
        agent_id,
        agent_name: agentName.get(agent_id) || 'Unknown',
        beats: v.beats,
        customers: v.customers,
      }));

      // Adherence over the window.
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().slice(0, 10);
      const { data: pv } = await sb
        .from('plan_visits')
        .select('status')
        .eq('organization_id', orgId)
        .gte('plan_date', sinceStr)
        .lte('plan_date', istToday());
      const rows = (pv || []) as any[];
      const adherence = {
        planned: rows.length,
        visited: rows.filter((r) => r.status === 'visited').length,
        skipped: rows.filter((r) => r.status === 'skipped').length,
        days,
      };

      return { orphans, perRep, adherence };
    },
  });
}
