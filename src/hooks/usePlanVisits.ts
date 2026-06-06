import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { db, PlanVisitLocal } from '@/lib/db';
import { toast } from 'sonner';

// New tables/RPC aren't in the generated Database types yet — cast to keep TS quiet.
const sb = supabase as any;

/** Today's date in IST as yyyy-mm-dd (the rep's working day). */
export function istToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export type PlanItem = PlanVisitLocal;

/**
 * Mark a plan item visited and link the visit it produced.
 * Standalone (not a hook) so the check-in flow can call it on success.
 * Updates the local cache immediately; pushes to the server when online.
 */
export async function markPlanVisitVisited(planVisitId: string, visitId?: string | null) {
  const online = navigator.onLine;
  await db.planVisits.update(planVisitId, {
    status: 'visited',
    visitId: visitId ?? null,
    syncStatus: online ? 'synced' : 'pending',
    updatedAt: new Date(),
  });
  if (online) {
    const { error } = await sb
      .from('plan_visits')
      .update({ status: 'visited', visit_id: visitId ?? null })
      .eq('id', planVisitId);
    if (error) await db.planVisits.update(planVisitId, { syncStatus: 'pending' });
  }
}

async function cachedPlan(agentId: string, date: string): Promise<PlanItem[]> {
  const rows = await db.planVisits
    .where('agentId')
    .equals(agentId)
    .and((p) => p.planDate === date)
    .toArray();
  return rows.sort((a, b) => a.seq - b.seq);
}

/** Push any locally-pending status edits up to the server (called on each online load). */
async function flushPending() {
  if (!navigator.onLine) return;
  const pending = await db.planVisits.where('syncStatus').equals('pending').toArray();
  for (const p of pending) {
    const { error } = await sb
      .from('plan_visits')
      .update({ status: p.status, visit_id: p.visitId ?? null })
      .eq('id', p.id);
    if (!error) await db.planVisits.update(p.id, { syncStatus: 'synced' });
  }
}

/**
 * Returns the rep's plan for a date — generating the beat items on the server if
 * they don't exist yet (lazy + idempotent), enriched with customer info, and
 * cached to IndexedDB for offline use.
 */
export function useTodayPlan(agentId?: string, planDate?: string) {
  const user = useAuthStore((s) => s.user);
  const targetAgent = agentId || user?.id;
  const date = planDate || istToday();

  return useQuery({
    queryKey: ['plan-visits', targetAgent, date],
    enabled: !!targetAgent,
    queryFn: async (): Promise<PlanItem[]> => {
      if (!targetAgent) return [];

      // Offline: serve whatever we cached last time.
      if (!navigator.onLine) return cachedPlan(targetAgent, date);

      await flushPending();

      const { data: rows, error } = await sb.rpc('get_or_generate_daily_plan', {
        p_agent: targetAgent,
        p_date: date,
      });
      if (error) {
        console.error('[plan] generate failed, using cache:', error.message);
        return cachedPlan(targetAgent, date);
      }

      const planRows = (rows || []) as any[];
      const custIds = [...new Set(planRows.map((r) => r.customer_id))];
      const beatIds = [...new Set(planRows.map((r) => r.beat_id).filter(Boolean))];

      const [leadsRes, beatsRes] = await Promise.all([
        custIds.length
          ? sb.from('leads').select('id,name,village_city,district,mobile_no,latitude,longitude').in('id', custIds)
          : Promise.resolve({ data: [] }),
        beatIds.length
          ? sb.from('beats').select('id,name').in('id', beatIds)
          : Promise.resolve({ data: [] }),
      ]);
      const leadMap = new Map((leadsRes.data || []).map((l: any) => [l.id, l]));
      const beatMap = new Map((beatsRes.data || []).map((b: any) => [b.id, b.name]));

      const items: PlanVisitLocal[] = planRows.map((r) => {
        const l: any = leadMap.get(r.customer_id) || {};
        return {
          id: r.id,
          organizationId: r.organization_id,
          agentId: r.agent_id,
          planDate: r.plan_date,
          customerId: r.customer_id,
          beatId: r.beat_id,
          beatName: r.beat_id ? beatMap.get(r.beat_id) || 'Beat' : null,
          seq: r.seq,
          source: r.source,
          status: r.status,
          visitId: r.visit_id,
          customerName: l.name || 'Customer',
          area: l.village_city || l.district || '',
          mobileNo: l.mobile_no,
          latitude: l.latitude ?? null,
          longitude: l.longitude ?? null,
          syncStatus: 'synced',
          updatedAt: new Date(),
        };
      });

      // Refresh the cache, but never clobber a still-pending local edit.
      const existing = await cachedPlan(targetAgent, date);
      const pendingById = new Map(existing.filter((e) => e.syncStatus === 'pending').map((e) => [e.id, e]));
      const merged = items.map((it) =>
        pendingById.has(it.id)
          ? { ...it, status: pendingById.get(it.id)!.status, visitId: pendingById.get(it.id)!.visitId, syncStatus: 'pending' as const }
          : it,
      );
      await db.transaction('rw', db.planVisits, async () => {
        const keep = new Set(items.map((i) => i.id));
        const stale = existing.filter((e) => !keep.has(e.id) && e.syncStatus !== 'pending').map((e) => e.id);
        if (stale.length) await db.planVisits.bulkDelete(stale);
        await db.planVisits.bulkPut(merged);
      });

      return merged.sort((a, b) => a.seq - b.seq);
    },
  });
}

/** Status mutations for a plan item (visited / skipped / undo) + ad-hoc add. */
export function usePlanVisitActions(agentId?: string, planDate?: string) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentOrganization = useAuthStore((s) => s.currentOrganization);
  const targetAgent = agentId || user?.id;
  const date = planDate || istToday();
  const key = ['plan-visits', targetAgent, date];

  const setStatus = async (id: string, status: PlanItem['status'], visitId?: string | null) => {
    const online = navigator.onLine;
    await db.planVisits.update(id, {
      status,
      visitId: visitId ?? null,
      syncStatus: online ? 'synced' : 'pending',
      updatedAt: new Date(),
    });
    if (online) {
      const { error } = await sb.from('plan_visits').update({ status, visit_id: visitId ?? null }).eq('id', id);
      if (error) await db.planVisits.update(id, { syncStatus: 'pending' });
    }
    qc.invalidateQueries({ queryKey: key });
  };

  const markVisited = useMutation({
    mutationFn: ({ id, visitId }: { id: string; visitId?: string | null }) => setStatus(id, 'visited', visitId),
    onError: () => toast.error('Could not update visit'),
  });

  const markSkipped = useMutation({
    mutationFn: (id: string) => setStatus(id, 'skipped'),
    onError: () => toast.error('Could not update visit'),
  });

  const undoStatus = useMutation({
    mutationFn: (id: string) => setStatus(id, 'planned', null),
    onError: () => toast.error('Could not update visit'),
  });

  const addAdHoc = useMutation({
    mutationFn: async (customerId: string) => {
      if (!currentOrganization || !targetAgent) throw new Error('Not ready');
      if (!navigator.onLine) throw new Error('offline');
      const existing = await cachedPlan(targetAgent, date);
      const nextSeq = existing.reduce((m, e) => Math.max(m, e.seq), 0) + 1;
      const { error } = await sb.from('plan_visits').insert({
        organization_id: currentOrganization.id,
        agent_id: targetAgent,
        plan_date: date,
        customer_id: customerId,
        beat_id: null,
        seq: nextSeq,
        source: 'ad_hoc',
        status: 'planned',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) =>
      toast.error(e?.message === 'offline' ? 'Adding a visit needs an internet connection' : 'Could not add visit (already on today’s list?)'),
  });

  return { markVisited, markSkipped, undoStatus, addAdHoc };
}
