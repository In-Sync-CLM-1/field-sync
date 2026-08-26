import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const sb = supabase as any;

export interface ChannelProductivityRow {
  id: string;
  name: string;
  code: string;
  kind: 'dsa' | 'sub_dsa';
  visits: number;
  leads: number;
  logins: number;
  sanctions: number;
  sanctionAmount: number;
  disbursements: number;
  disbursementAmount: number;
}

/** Employee/DSA/Sub-DSA rollups — Visits | Leads | Logins | Sanctions | Disbursement, per the SOP's MIS section. */
export function useChannelProductivity() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['channel-productivity', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<ChannelProductivityRow[]> => {
      const orgId = org!.id;
      const [dsasRes, subDsasRes, visitsRes, leadsRes] = await Promise.all([
        sb.from('dsas').select('id, name, code').eq('organization_id', orgId),
        sb.from('sub_dsas').select('id, name, code, dsa_id').eq('organization_id', orgId),
        sb.from('visits').select('dsa_id, sub_dsa_id').eq('organization_id', orgId).not('dsa_id', 'is', null),
        sb.from('leads').select('dsa_id, sub_dsa_id, login_at, sanction_at, sanction_amount, disbursement_at, disbursement_amount')
          .eq('organization_id', orgId).not('dsa_id', 'is', null),
      ]);

      const visits = (visitsRes.data || []) as any[];
      const leads = (leadsRes.data || []) as any[];

      const rollup = (matchKey: 'dsa_id' | 'sub_dsa_id', id: string) => {
        const v = visits.filter((x) => x[matchKey] === id).length;
        const ls = leads.filter((x) => x[matchKey] === id);
        const sanctioned = ls.filter((x) => x.sanction_at);
        const disbursed = ls.filter((x) => x.disbursement_at);
        return {
          visits: v,
          leads: ls.length,
          logins: ls.filter((x) => x.login_at).length,
          sanctions: sanctioned.length,
          sanctionAmount: sanctioned.reduce((s, x) => s + (Number(x.sanction_amount) || 0), 0),
          disbursements: disbursed.length,
          disbursementAmount: disbursed.reduce((s, x) => s + (Number(x.disbursement_amount) || 0), 0),
        };
      };

      const dsaRows: ChannelProductivityRow[] = (dsasRes.data || []).map((d: any) => ({
        id: d.id, name: d.name, code: d.code, kind: 'dsa' as const, ...rollup('dsa_id', d.id),
      }));
      const subDsaRows: ChannelProductivityRow[] = (subDsasRes.data || []).map((s: any) => ({
        id: s.id, name: s.name, code: s.code, kind: 'sub_dsa' as const, ...rollup('sub_dsa_id', s.id),
      }));

      return [...dsaRows, ...subDsaRows].sort((a, b) => b.visits - a.visits);
    },
  });
}

export interface ChannelAlert {
  id: string;
  scenario: string;
  level: number;
  message: string;
  needs_review: boolean;
  resolved: boolean;
  created_at: string;
  employee_id?: string;
  dsa_id?: string;
  sub_dsa_id?: string;
}

/** The audit trail of automated alerts (SOP §8) — open ones first. */
export function useChannelAlerts() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['channel-alerts', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<ChannelAlert[]> => {
      const { data, error } = await sb
        .from('channel_activity_alerts')
        .select('*')
        .eq('organization_id', org!.id)
        .order('resolved', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ChannelAlert[];
    },
  });
}

export function useResolveChannelAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('channel_activity_alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['channel-alerts'] }); toast.success('Alert resolved'); },
    onError: () => toast.error('Failed to resolve alert'),
  });
}
