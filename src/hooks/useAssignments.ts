import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { istToday } from '@/hooks/usePlanVisits';
import { toast } from 'sonner';

// plan_visits / leads aren't fully in the generated types yet — cast to keep TS quiet.
const sb = supabase as any;

export interface AssignedItem {
  id: string; // plan_visits row id
  customerId: string;
  customerName: string;
  area: string;
  mobileNo?: string | null;
  status: 'planned' | 'visited' | 'skipped';
  seq: number;
}

export interface CsvRow {
  name: string;
  phone?: string;
  address?: string;
}

/** The directed ("Assigned") list a manager has given a rep for a date. */
export function useAssignedList(agentId?: string, date?: string) {
  const d = date || istToday();
  return useQuery({
    queryKey: ['assigned-list', agentId, d],
    enabled: !!agentId,
    queryFn: async (): Promise<AssignedItem[]> => {
      const { data: rows, error } = await sb
        .from('plan_visits')
        .select('id, customer_id, seq, status')
        .eq('agent_id', agentId)
        .eq('plan_date', d)
        .eq('source', 'assigned')
        .order('seq');
      if (error) throw error;

      const ids = [...new Set((rows || []).map((r: any) => r.customer_id))];
      const leadsRes = ids.length
        ? await sb.from('leads').select('id,name,village_city,district,mobile_no').in('id', ids)
        : { data: [] };
      const lm = new Map((leadsRes.data || []).map((l: any) => [l.id, l]));

      return (rows || []).map((r: any) => {
        const l: any = lm.get(r.customer_id) || {};
        return {
          id: r.id,
          customerId: r.customer_id,
          customerName: l.name || 'Customer',
          area: l.village_city || l.district || '',
          mobileNo: l.mobile_no,
          status: r.status,
          seq: r.seq,
        };
      });
    },
  });
}

/** Most recent prior date (before `date`) that already has an assigned list for this rep. */
export function usePriorAssignmentDate(agentId?: string, date?: string) {
  const d = date || istToday();
  return useQuery({
    queryKey: ['prior-assignment', agentId, d],
    enabled: !!agentId,
    queryFn: async (): Promise<string | null> => {
      const { data } = await sb
        .from('plan_visits')
        .select('plan_date')
        .eq('agent_id', agentId)
        .eq('source', 'assigned')
        .lt('plan_date', d)
        .order('plan_date', { ascending: false })
        .limit(1);
      return data && data[0] ? data[0].plan_date : null;
    },
  });
}

/**
 * Resolve CSV rows to customer ids: match existing customers by phone within the org,
 * create the rest as new customers. Returns the ids plus a matched/created tally.
 */
export async function resolveCustomersFromCsv(
  orgId: string,
  createdBy: string | undefined,
  rows: CsvRow[],
): Promise<{ ids: string[]; matched: number; created: number }> {
  const phones = [...new Set(rows.map((r) => (r.phone || '').trim()).filter(Boolean))];
  let existing: any[] = [];
  if (phones.length) {
    const { data } = await sb
      .from('leads')
      .select('id,mobile_no')
      .eq('organization_id', orgId)
      .in('mobile_no', phones);
    existing = data || [];
  }
  const byPhone = new Map(existing.map((l: any) => [String(l.mobile_no), l.id as string]));

  const ids: string[] = [];
  const toCreate: any[] = [];
  for (const r of rows) {
    const phone = (r.phone || '').trim();
    const hit = phone ? byPhone.get(String(phone)) : undefined;
    if (hit) {
      ids.push(hit);
    } else {
      toCreate.push({
        organization_id: orgId,
        name: r.name.trim(),
        mobile_no: phone || null,
        village_city: (r.address || '').trim() || null,
        status: 'active',
        created_by: createdBy || null,
      });
    }
  }

  let created = 0;
  if (toCreate.length) {
    const { data, error } = await sb.from('leads').insert(toCreate).select('id');
    if (error) throw error;
    (data || []).forEach((l: any) => ids.push(l.id));
    created = (data || []).length;
  }

  // de-dupe (same customer listed twice in the file)
  const uniq = [...new Set(ids)];
  return { ids: uniq, matched: uniq.length - created, created };
}

/** Assign / remove / repeat actions for a rep's directed list on a date. */
export function useAssignmentActions(agentId?: string, date?: string) {
  const qc = useQueryClient();
  const org = useAuthStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);
  const d = date || istToday();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['assigned-list', agentId, d] });
    qc.invalidateQueries({ queryKey: ['plan-visits', agentId, d] });
    qc.invalidateQueries({ queryKey: ['prior-assignment'] });
  };

  /** Insert assigned rows, sequenced after whatever's already on that day; idempotent. */
  const assignIds = async (customerIds: string[]) => {
    if (!org || !agentId) throw new Error('Pick a rep first');
    const ids = [...new Set(customerIds)];
    if (!ids.length) return 0;
    const { data: existing } = await sb
      .from('plan_visits')
      .select('seq')
      .eq('agent_id', agentId)
      .eq('plan_date', d);
    let seq = (existing || []).reduce((m: number, e: any) => Math.max(m, e.seq || 0), 0);
    const rows = ids.map((cid) => ({
      organization_id: org.id,
      agent_id: agentId,
      plan_date: d,
      customer_id: cid,
      beat_id: null,
      seq: ++seq,
      source: 'assigned',
      status: 'planned',
    }));
    const { error } = await sb
      .from('plan_visits')
      .upsert(rows, { onConflict: 'agent_id,plan_date,customer_id', ignoreDuplicates: true });
    if (error) throw error;
    return ids.length;
  };

  const assign = useMutation({
    mutationFn: (customerIds: string[]) => assignIds(customerIds),
    onSuccess: (n) => {
      invalidate();
      if (n) toast.success(`Added ${n} ${n === 1 ? 'stop' : 'stops'} to the list`);
    },
    onError: (e: any) => toast.error(e?.message || 'Could not assign'),
  });

  const remove = useMutation({
    mutationFn: async (planVisitId: string) => {
      const { error } = await sb.from('plan_visits').delete().eq('id', planVisitId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Could not remove stop'),
  });

  const repeatFrom = useMutation({
    mutationFn: async (fromDate: string) => {
      if (!agentId) throw new Error('Pick a rep first');
      const { data } = await sb
        .from('plan_visits')
        .select('customer_id')
        .eq('agent_id', agentId)
        .eq('plan_date', fromDate)
        .eq('source', 'assigned');
      const ids = [...new Set((data || []).map((r: any) => r.customer_id))];
      const n = await assignIds(ids);
      return n;
    },
    onSuccess: (n) => {
      invalidate();
      toast.success(n ? `Repeated ${n} ${n === 1 ? 'stop' : 'stops'}` : 'Nothing to repeat');
    },
    onError: (e: any) => toast.error(e?.message || 'Could not repeat list'),
  });

  const uploadCsv = useMutation({
    mutationFn: async (rows: CsvRow[]) => {
      if (!org || !agentId) throw new Error('Pick a rep first');
      const clean = rows.filter((r) => r.name && r.name.trim());
      if (!clean.length) throw new Error('No valid rows in the file');
      const { ids, matched, created } = await resolveCustomersFromCsv(org.id, user?.id, clean);
      const n = await assignIds(ids);
      return { n, matched, created };
    },
    onSuccess: ({ n, matched, created }) => {
      invalidate();
      const bits = [`${n} assigned`];
      if (created) bits.push(`${created} new`);
      if (matched) bits.push(`${matched} matched`);
      toast.success(bits.join(' · '));
    },
    onError: (e: any) => toast.error(e?.message || 'Upload failed'),
  });

  return { assign, remove, repeatFrom, uploadCsv };
}
