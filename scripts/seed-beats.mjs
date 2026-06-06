// Seed realistic Bangalore Beat Plans for the In-Sync Demo org, then stage a
// believable MID-DAY snapshot (~1:30 PM) so the live map + reports show an active
// field team: reps punched in, some currently ON a visit (pulsing), partial routes.
//
// Also re-clusters the demo customers into 4 TIGHT neighbourhoods so each rep's
// route reads as a compact loop and the team map zooms in nicely.
//
// Idempotent: clears the demo org's beats + today's generated plan/visits first.
// Run: node scripts/seed-beats.mjs   (then: node scripts/seed-movement.mjs)
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// --- env ---
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const REF = 'jmxpudhpdltktuupfbxs';
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const DEMO = 'eebd91f7-5e43-46ae-b956-5765ea842eb3';

const REPS = {
  kavya: '95b1cc7a-3067-42ca-9df3-0cdb08d2cdb5',
  priya: 'd1a00001-0000-4000-8000-000000000001',
  arjun: 'd1a00002-0000-4000-8000-000000000002',
  deepa: 'd1a00003-0000-4000-8000-000000000003',
};

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`SQL failed (${r.status}): ${t}`);
  return t ? JSON.parse(t) : [];
}

const Q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const C = (nn) => `d1c000${nn}-0000-4000-8000-0000000000${nn}`;

// Neighbourhood coords — 4 compact loops, each a legible squiggle, kept in distinct
// quadrants so routes never overlap. RAW positions are then compressed ~30% toward a
// common centre so the whole-team map fits at a properly zoomed-in level.
const RAW = {
  // Koramangala (Kavya): 05 → 09 → 13 → 01(Harish)
  '05': [12.9320, 77.6210], '09': [12.9360, 77.6260], '13': [12.9395, 77.6225], '01': [12.9345, 77.6180], '06': [12.9300, 77.6240],
  // Indiranagar (Priya): 02 → 10 → 14
  '02': [12.9690, 77.6385], '10': [12.9725, 77.6420], '14': [12.9755, 77.6380], '12': [12.9710, 77.6350],
  // HSR Layout (Arjun): 03 → 07 → 11 → 15
  '03': [12.9100, 77.6430], '07': [12.9140, 77.6470], '11': [12.9085, 77.6505], '15': [12.9060, 77.6450],
  // Jayanagar / BTM (Deepa): 04 → 08 → 16
  '04': [12.9230, 77.5930], '08': [12.9180, 77.5965], '16': [12.9205, 77.5995],
};
const CEN = [12.9344, 77.6258], K = 0.7; // compress toward centre
const COORD = Object.fromEntries(Object.entries(RAW).map(([nn, [lat, lng]]) => [nn,
  [Number((CEN[0] + (lat - CEN[0]) * K).toFixed(6)), Number((CEN[1] + (lng - CEN[1]) * K).toFixed(6))]]));

async function main() {
  const [{ ist_today: today, dow }] = await sql(
    `select (now() at time zone 'Asia/Kolkata')::date as ist_today,
            extract(dow from (now() at time zone 'Asia/Kolkata')::date)::int as dow`,
  );
  const todayDow = Number(dow);
  console.log(`Today (IST): ${today}  dow=${todayDow}`);

  // 4 beats, themed by the tight neighbourhoods above.
  //   visited  = stops already completed (checked out)
  //   onVisit  = currently AT the next stop (open visit → pulses on the map)
  // Kavya keeps Harish (01) as her NEXT planned stop for the video's navigate/check-in arc.
  const themes = [
    { key: 'kavya', name: 'Koramangala – Mon/Thu', agent: REPS.kavya, days: [1, 4], customers: ['05', '09', '13', '01'], visited: 2, onVisit: true },
    { key: 'priya', name: 'Indiranagar – Tue/Fri', agent: REPS.priya, days: [2, 5], customers: ['02', '10', '14'], visited: 1, onVisit: true },
    { key: 'arjun', name: 'HSR Layout – Mon/Wed', agent: REPS.arjun, days: [1, 3], customers: ['03', '07', '11', '15'], visited: 2, onVisit: false },
    { key: 'deepa', name: 'Jayanagar/BTM – Wed/Sat', agent: REPS.deepa, days: [3, 6], customers: ['04', '08', '16'], visited: 1, onVisit: true },
  ];

  const beats = themes.map((t) => ({
    id: randomUUID(),
    ...t,
    weekdays: [...new Set([...t.days, todayDow])].sort((a, b) => a - b),
    custIds: t.customers.map((nn) => C(nn)),
  }));

  const agentIds = themes.map((t) => REPS[t.key]);

  // --- re-cluster demo customer coordinates (tight neighbourhoods) ---
  await sql(
    `update leads set latitude = case ${Object.entries(COORD).map(([nn, [lat]]) => `when id = ${Q(C(nn))} then ${lat}`).join(' ')} else latitude end,
            longitude = case ${Object.entries(COORD).map(([nn, [, lng]]) => `when id = ${Q(C(nn))} then ${lng}`).join(' ')} else longitude end
     where organization_id = ${Q(DEMO)} and id in (${Object.keys(COORD).map((nn) => Q(C(nn))).join(',')});`,
  );
  console.log(`Re-clustered ${Object.keys(COORD).length} customers into 4 neighbourhoods.`);

  // --- reset prior demo seed (idempotent) ---
  await sql(
    `delete from plan_visits where organization_id = ${Q(DEMO)} and plan_date = ${Q(today)};
     delete from order_collections where organization_id = ${Q(DEMO)} and created_at::date = current_date
       and user_id in (${agentIds.map(Q).join(',')});
     delete from location_history where organization_id = ${Q(DEMO)} and recorded_at::date = current_date
       and user_id in (${agentIds.map(Q).join(',')});
     delete from visits where organization_id = ${Q(DEMO)}
       and user_id in (${agentIds.map(Q).join(',')}) and check_in_time::date = current_date;
     delete from beats where organization_id = ${Q(DEMO)};
     delete from attendance where organization_id = ${Q(DEMO)} and date = current_date
       and user_id in (${agentIds.map(Q).join(',')});`,
  );

  // --- insert beats + beat_customers ---
  const beatRows = beats
    .map((b) => `(${Q(b.id)}, ${Q(DEMO)}, ${Q(b.name)}, ${Q(b.agent)}, array[${b.weekdays.join(',')}]::int[], 'weekly', 0, 1, true)`)
    .join(',\n');
  await sql(
    `insert into beats (id, organization_id, name, agent_id, weekdays, cadence, week_parity, week_of_month, active)
     values\n${beatRows};`,
  );
  const bcRows = beats
    .flatMap((b) => b.custIds.map((id, seq) => `(${Q(b.id)}, ${Q(id)}, ${seq})`))
    .join(',\n');
  await sql(`insert into beat_customers (beat_id, customer_id, seq) values\n${bcRows};`);
  console.log(`Inserted ${beats.length} beats, ${beats.reduce((n, b) => n + b.custIds.length, 0)} beat_customers.`);

  // --- generate today's plan for each rep ---
  for (const b of beats) {
    const rows = await sql(`select count(*)::int as n from get_or_generate_daily_plan(${Q(b.agent)}, ${Q(today)})`);
    console.log(`  ${b.name}: ${rows[0].n} plan items`);
  }

  // --- coords for trails ---
  const coord = new Map(Object.entries(COORD).map(([nn, [lat, lng]]) => [C(nn), { lat, lng }]));

  // customer names (for orders/collections customer_name)
  const allCustIds = [...new Set(beats.flatMap((b) => b.custIds))];
  const nameRows = await sql(`select id::text id, name from leads where id::text in (${allCustIds.map(Q).join(',')})`);
  const nameOf = new Map(nameRows.map((r) => [r.id, r.name || 'Customer']));

  // Orders + collections per rep, tied to a completed visit (visit index within the route).
  const ORDERS = {
    kavya: { orders: [{ i: 0, p: 'Aashirvaad Atta 5kg', q: 20, pr: 285 }, { i: 1, p: 'Tata Sampann Dal 1kg', q: 30, pr: 140 }], coll: [{ i: 0, amt: 6000, mode: 'upi' }] },
    priya: { orders: [{ i: 0, p: 'Surf Excel 1kg', q: 24, pr: 115 }], coll: [{ i: 0, amt: 2500, mode: 'cash' }] },
    arjun: { orders: [{ i: 0, p: 'Maggi Noodles (pack of 12)', q: 48, pr: 60 }, { i: 1, p: 'Red Label Tea 500g', q: 15, pr: 260 }], coll: [{ i: 1, amt: 4000, mode: 'upi' }] },
    deepa: { orders: [{ i: 0, p: 'Colgate MaxFresh 150g', q: 36, pr: 95 }], coll: [{ i: 0, amt: 3000, mode: 'cash' }] },
  };

  // --- MID-DAY: attendance (punched in, NOT out) + completed + in-progress visits ---
  for (const b of beats) {
    const first = coord.get(b.custIds[0]);
    const att = randomUUID();
    // Times anchored to now() so the snapshot always reads as "mid-shift" (a few hours
    // in), regardless of the wall-clock when seeded/rendered. Punched in ~5h ago, on duty.
    await sql(
      `insert into attendance (id, user_id, organization_id, date, punch_in_time,
         punch_in_latitude, punch_in_longitude, punch_in_accuracy, status)
       values (${Q(att)}, ${Q(b.agent)}, ${Q(DEMO)}, current_date,
         now() - interval '300 minutes',
         ${(first.lat - 0.02).toFixed(6)}, ${(first.lng - 0.02).toFixed(6)}, 9, 'present');`,
    );

    // completed visits (checked out), most-recent ~1h ago, earlier ones spaced back
    const doneVisitIds = [];
    for (let idx = 0; idx < b.visited; idx++) {
      const c = coord.get(b.custIds[idx]);
      const visitId = randomUUID();
      doneVisitIds[idx] = visitId;
      const inAgo = (b.visited - idx) * 95 + 55; // minutes ago for check-in
      await sql(
        `insert into visits (id, organization_id, user_id, customer_id, check_in_time, check_out_time,
           check_in_latitude, check_in_longitude, status, purpose, notes)
         values (${Q(visitId)}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(b.custIds[idx])},
           now() - interval '${inAgo} minutes', now() - interval '${inAgo - 28} minutes',
           ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}, 'completed', 'follow-up', '__beatseed');
         update plan_visits set status='visited', visit_id=${Q(visitId)}
           where agent_id=${Q(b.agent)} and plan_date=${Q(today)} and customer_id=${Q(b.custIds[idx])};`,
      );
    }

    // orders + collections booked on those visits (drives the report money columns)
    const od = ORDERS[b.key] || { orders: [], coll: [] };
    for (const o of od.orders) {
      if (doneVisitIds[o.i] == null) continue;
      const cid = b.custIds[o.i];
      const total = o.q * o.pr;
      const ago = (b.visited - o.i) * 95 + 40;
      await sql(
        `insert into order_collections (id, visit_id, organization_id, user_id, lead_id, type,
           product_name, quantity, unit_price, total_amount, customer_name, status, created_at)
         values (${Q(randomUUID())}, ${Q(doneVisitIds[o.i])}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(cid)}, 'sales_order',
           ${Q(o.p)}, ${o.q}, ${o.pr}, ${total}, ${Q(nameOf.get(cid) || 'Customer')}, 'confirmed',
           now() - interval '${ago} minutes');`,
      );
    }
    for (const c of od.coll) {
      if (doneVisitIds[c.i] == null) continue;
      const cid = b.custIds[c.i];
      const ago = (b.visited - c.i) * 95 + 36;
      await sql(
        `insert into order_collections (id, visit_id, organization_id, user_id, lead_id, type,
           total_amount, payment_mode, customer_name, status, created_at)
         values (${Q(randomUUID())}, ${Q(doneVisitIds[c.i])}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(cid)}, 'payment_collection',
           ${c.amt}, ${Q(c.mode)}, ${Q(nameOf.get(cid) || 'Customer')}, 'confirmed',
           now() - interval '${ago} minutes');`,
      );
    }

    // in-progress visit (open, no check_out) at the CURRENT stop → "on visit" + pulse
    if (b.onVisit && b.custIds[b.visited]) {
      const c = coord.get(b.custIds[b.visited]);
      const visitId = randomUUID();
      await sql(
        `insert into visits (id, organization_id, user_id, customer_id, check_in_time,
           check_in_latitude, check_in_longitude, status, purpose, notes)
         values (${Q(visitId)}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(b.custIds[b.visited])},
           now() - interval '18 minutes', ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}, 'in_progress', 'sales', '__beatseed');`,
      );
    }
    console.log(`  ${b.key}: punched in · ${b.visited} done · ${b.onVisit ? 'ON a visit now' : 'between stops'}`);
  }

  // --- summary ---
  const summary = await sql(
    `select p.full_name, count(*) filter (where pv.status='visited') visited, count(*) total
     from plan_visits pv join profiles p on p.id = pv.agent_id
     where pv.organization_id = ${Q(DEMO)} and pv.plan_date = ${Q(today)}
     group by p.full_name order by p.full_name`,
  );
  const onVisit = await sql(
    `select count(distinct user_id) n from visits where organization_id = ${Q(DEMO)}
       and check_in_time::date = current_date and check_out_time is null`,
  );
  console.log('\nMid-day plan summary:');
  summary.forEach((s) => console.log(`  ${s.full_name}: ${s.visited}/${s.total} done`));
  console.log(`Currently on a visit (pulsing): ${onVisit[0].n} reps`);
  console.log('\nNext: node scripts/seed-movement.mjs  (builds the GPS trails)');
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
