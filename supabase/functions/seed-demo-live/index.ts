// seed-demo-live — keeps the In-Sync Demo org looking ALIVE for demos.
// Idempotently rebuilds "today" on every run (designed to be called hourly):
//   • today's attendance (punched in, on-duty)
//   • agent movement: agent_locations + a location_history trail progressing by time-of-day
//   • active + completed visits for today (the live map + "Active Visits")
//   • today's plan_visits generated per agent (via get_or_generate_daily_plan) with
//     a time-proportional slice marked visited (the rep "Today's Plan" progress)
//   • an occasional recent order
// Seeded rows are tagged so re-runs replace only what this function created.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEMO_MARKER = '[demo-live]';
const WORK_START = 9 * 60;   // 09:00 IST
const WORK_END = 18 * 60;    // 18:00 IST
const MUMBAI = { lat: 19.076, lng: 72.8777 };

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const jitter = (b: number, r: number) => b + (Math.random() - 0.5) * r;

// IST wall-clock helpers (Deno runs in UTC).
function istParts() {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const date = ist.toISOString().slice(0, 10);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return { date, minutes };
}
// A real instant for "today HH:MM IST".
const istInstant = (date: string, min: number) =>
  new Date(`${date}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00+05:30`);

const VISIT_PURPOSES = ['Policy Review', 'Premium Collection', 'New Policy Pitch', 'Renewal Discussion', 'KYC Verification', 'Document Collection'];
const PRODUCTS = ['Term Life Plan', 'Health Shield', 'Motor Insurance', 'Savings Plus', 'Pension Secure'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { date: today, minutes: nowMin } = istParts();
    // Fraction of the workday elapsed (0 before 9am, 1 after 6pm).
    const dayFrac = Math.max(0, Math.min(1, (nowMin - WORK_START) / (WORK_END - WORK_START)));
    const results: Record<string, number> = { agents: 0, attendance: 0, locations: 0, trail: 0, visits_active: 0, visits_done: 0, plan_generated: 0, plan_visited: 0, orders: 0 };

    // 1. Field agents = active profiles that own an active beat.
    const { data: beats } = await supabase.from('beats').select('agent_id').eq('organization_id', organizationId).eq('active', true);
    const agentIds = [...new Set((beats || []).map((b) => b.agent_id))];
    if (agentIds.length === 0) {
      return new Response(JSON.stringify({ success: true, note: 'no agents with active beats', results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: agents } = await supabase.from('profiles').select('id, full_name').in('id', agentIds).eq('is_active', true);
    const fieldAgents = agents || [];
    results.agents = fieldAgents.length;

    // 2. Clear the slice this function owns for today, so the run is idempotent.
    await supabase.from('location_history').delete().eq('organization_id', organizationId).gte('recorded_at', `${today}T00:00:00+05:30`);
    await supabase.from('visits').delete().eq('organization_id', organizationId).ilike('notes', `%${DEMO_MARKER}%`).gte('check_in_time', `${today}T00:00:00+05:30`);
    // Prune old breadcrumbs (keep ~2 days).
    await supabase.from('location_history').delete().eq('organization_id', organizationId).lt('recorded_at', new Date(Date.now() - 2 * 86400_000).toISOString());

    // Org leads with geo — fallback route waypoints.
    const { data: geoLeads } = await supabase
      .from('leads').select('id, name, mobile_no, latitude, longitude')
      .eq('organization_id', organizationId).not('latitude', 'is', null).limit(500);
    const orgGeo = (geoLeads || []).filter((l) => l.latitude && l.longitude);

    const attendanceRows: any[] = [];
    const locationRows: any[] = [];
    const visitRows: any[] = [];
    const orderRows: any[] = [];

    for (const agent of fieldAgents) {
      // ---- Today's plan (lazy-generate via the real RPC), then progress it ----
      const { data: planRows } = await supabase.rpc('get_or_generate_daily_plan', { p_agent: agent.id, p_date: today });
      let plan = (planRows || []) as any[];
      // Demo robustness: if this agent's beat doesn't run today, give them an
      // ad-hoc route so "Today's Plan" is never empty in a demo (any agent, any day).
      // Idempotent: reuse any plan rows already present for today before inserting.
      if (plan.length === 0) {
        const { data: existing } = await supabase.from('plan_visits').select('id, customer_id, seq').eq('agent_id', agent.id).eq('plan_date', today);
        if (existing && existing.length) {
          plan = existing;
        } else if (orgGeo.length) {
          const picks = [...orgGeo].sort(() => Math.random() - 0.5).slice(0, rndInt(4, 6));
          const adhoc = picks.map((l, i) => ({
            organization_id: organizationId, agent_id: agent.id, plan_date: today,
            customer_id: l.id, beat_id: null, seq: i + 1, source: 'ad_hoc', status: 'planned',
          }));
          const { data: ins } = await supabase.from('plan_visits').insert(adhoc).select('id, customer_id, seq');
          plan = (ins || []) as any[];
        }
      }
      results.plan_generated += plan.length;

      // Route waypoints: this agent's planned customers (geo), else org geo leads.
      const planCustIds = plan.map((p) => p.customer_id);
      let route = orgGeo.filter((l) => planCustIds.includes(l.id));
      if (route.length < 2) route = orgGeo.slice(0, 8);
      if (route.length === 0) route = [{ id: null, name: 'Customer', mobile_no: null, latitude: MUMBAI.lat, longitude: MUMBAI.lng }];

      // Mark a time-proportional slice of the plan as visited (progress bar).
      const visitedCount = Math.min(plan.length, Math.floor(dayFrac * plan.length));
      const toVisit = plan.slice(0, visitedCount).map((p) => p.id);
      if (toVisit.length) {
        await supabase.from('plan_visits').update({ status: 'visited' }).in('id', toVisit);
        results.plan_visited += toVisit.length;
      }
      if (plan.length > visitedCount) {
        // ensure the rest are 'planned' (in case a prior run over-marked)
        await supabase.from('plan_visits').update({ status: 'planned' }).eq('agent_id', agent.id).eq('plan_date', today).eq('status', 'visited').not('id', 'in', `(${toVisit.length ? toVisit.map((x) => `"${x}"`).join(',') : '""'})`);
      }

      // ---- Attendance: punched in this morning, still on duty ----
      const punchInMin = rndInt(540, 585); // 09:00–09:45
      const punchIn = istInstant(today, punchInMin);
      const base = route[0];
      attendanceRows.push({
        user_id: agent.id, organization_id: organizationId, date: today,
        punch_in_time: punchIn.toISOString(),
        punch_in_latitude: jitter(base.latitude, 0.01), punch_in_longitude: jitter(base.longitude, 0.01), punch_in_accuracy: rndInt(5, 20),
        punch_out_time: null, status: 'present',
      });

      // ---- Movement trail from punch-in → now, interpolating along the route ----
      const trailPts: { lat: number; lng: number; t: Date }[] = [];
      const stepMin = 25;
      for (let m = punchInMin; m <= nowMin; m += stepMin) {
        const f = Math.max(0, Math.min(1, (m - WORK_START) / (WORK_END - WORK_START)));
        const segF = f * (route.length - 1);
        const i = Math.min(route.length - 1, Math.floor(segF));
        const j = Math.min(route.length - 1, i + 1);
        const local = segF - i;
        const lat = jitter(route[i].latitude + (route[j].latitude - route[i].latitude) * local, 0.004);
        const lng = jitter(route[i].longitude + (route[j].longitude - route[i].longitude) * local, 0.004);
        trailPts.push({ lat, lng, t: istInstant(today, m) });
      }
      const cur = trailPts[trailPts.length - 1] || { lat: base.latitude, lng: base.longitude, t: punchIn };

      // agent_locations (one row per user) — the live dot.
      await supabase.from('agent_locations').upsert({
        user_id: agent.id, organization_id: organizationId,
        latitude: cur.lat, longitude: cur.lng, accuracy: rndInt(5, 20), updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      results.locations += 1;

      // location_history needs an attendance_id — fetch/ensure after upsert below; collect for now.
      (agent as any)._trail = trailPts;
      (agent as any)._cur = cur;
      (agent as any)._route = route;
    }

    // Upsert attendance, then map user → attendance_id for location_history + visits.
    if (attendanceRows.length) {
      await supabase.from('attendance').upsert(attendanceRows, { onConflict: 'user_id,date' });
      results.attendance = attendanceRows.length;
    }
    const { data: attToday } = await supabase.from('attendance').select('id, user_id').eq('organization_id', organizationId).eq('date', today);
    const attByUser = new Map((attToday || []).map((a) => [a.user_id, a.id]));

    for (const agent of fieldAgents) {
      const attId = attByUser.get(agent.id);
      const trail = (agent as any)._trail as { lat: number; lng: number; t: Date }[];
      const cur = (agent as any)._cur;
      const route = (agent as any)._route as any[];
      if (attId) {
        for (const p of trail) {
          locationRows.push({ user_id: agent.id, organization_id: organizationId, attendance_id: attId, latitude: p.lat, longitude: p.lng, accuracy: rndInt(5, 20), recorded_at: p.t.toISOString() });
        }
      }
      // ---- Visits: completed earlier today + maybe one active right now ----
      const doneTarget = Math.floor(dayFrac * Math.min(route.length, 5));
      for (let k = 0; k < doneTarget; k++) {
        const wp = route[Math.min(route.length - 1, k)];
        const ci = istInstant(today, WORK_START + Math.floor(((k + 0.3) / Math.max(1, route.length)) * (nowMin - WORK_START)));
        const co = new Date(ci.getTime() + rndInt(20, 60) * 60000);
        visitRows.push({
          organization_id: organizationId, user_id: agent.id, customer_id: wp.id,
          purpose: pick(VISIT_PURPOSES), notes: `${pick(VISIT_PURPOSES)} ${DEMO_MARKER}`,
          check_in_time: ci.toISOString(), check_in_latitude: jitter(wp.latitude, 0.005), check_in_longitude: jitter(wp.longitude, 0.005),
          check_out_time: co.toISOString(), check_out_latitude: jitter(wp.latitude, 0.005), check_out_longitude: jitter(wp.longitude, 0.005),
          status: 'completed', scheduled_date: today,
        });
        results.visits_done += 1;
      }
      // Active visit "right now" for ~half the agents during work hours.
      if (dayFrac > 0 && dayFrac < 1 && Math.random() < 0.5) {
        const wp = route[Math.min(route.length - 1, doneTarget)] || cur;
        const ci = new Date(Date.now() - rndInt(5, 35) * 60000);
        visitRows.push({
          organization_id: organizationId, user_id: agent.id, customer_id: wp.id ?? null,
          purpose: pick(VISIT_PURPOSES), notes: `${pick(VISIT_PURPOSES)} ${DEMO_MARKER}`,
          check_in_time: ci.toISOString(), check_in_latitude: jitter(cur.lat, 0.003), check_in_longitude: jitter(cur.lng, 0.003),
          check_out_time: null, status: 'in_progress', scheduled_date: today,
        });
        results.visits_active += 1;
      }
      // ---- Occasional recent order ----
      if (Math.random() < 0.3 && route.length) {
        const wp = pick(route);
        const qty = rndInt(1, 5);
        const price = rndInt(800, 6000);
        orderRows.push({
          organization_id: organizationId, user_id: agent.id, lead_id: wp.id ?? null,
          type: 'order', product_name: pick(PRODUCTS), quantity: qty, unit_price: price, total_amount: qty * price,
          payment_mode: pick(['cash', 'upi', 'cheque']), customer_name: wp.name || 'Customer', customer_phone: wp.mobile_no || null,
          status: 'completed', remarks: DEMO_MARKER, email_sent: false,
        });
      }
    }

    // Batch inserts.
    for (let i = 0; i < locationRows.length; i += 200) {
      const { error } = await supabase.from('location_history').insert(locationRows.slice(i, i + 200));
      if (!error) results.trail += Math.min(200, locationRows.length - i);
    }
    if (visitRows.length) await supabase.from('visits').insert(visitRows);
    if (orderRows.length) { await supabase.from('order_collections').insert(orderRows); results.orders = orderRows.length; }

    console.log('[demo-live] done', results);
    return new Response(JSON.stringify({ success: true, today, dayFrac: Math.round(dayFrac * 100) / 100, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[demo-live] error', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
