// Seed realistic Bangalore Beat Plans for the In-Sync Demo org, then generate
// today's plan_visits so the app + demo video have live data immediately.
// Idempotent: clears the demo org's beats + today's generated plan first.
//
// Run: node scripts/seed-beats.mjs
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

// Curated Bangalore demo customers (d1c000NN), owner-assigned, all located.
// Kavya's route is ordered so the visited stops come first and Harish Khanna
// (the customer the later video scenes visit) is her NEXT planned stop.
const C = (nn) => `d1c000${nn}-0000-4000-8000-0000000000${nn}`;

async function main() {
  // Today (IST) + weekday so generation yields data the moment we seed.
  const [{ ist_today: today, dow }] = await sql(
    `select (now() at time zone 'Asia/Kolkata')::date as ist_today,
            extract(dow from (now() at time zone 'Asia/Kolkata')::date)::int as dow`,
  );
  const todayDow = Number(dow);
  console.log(`Today (IST): ${today}  dow=${todayDow}`);

  // 4 beats; weekdays = themed days + today's dow so each shows the moment we seed.
  // End-of-day: each rep has worked their route. Kavya keeps her LAST stop (Harish)
  // open so the video's navigate/check-in arc has a live "next stop".
  const themes = [
    { key: 'kavya', name: 'Koramangala – Mon/Thu', agent: REPS.kavya, days: [1, 4], customers: ['05', '09', '13', '01'], visited: 3 },
    { key: 'priya', name: 'Indiranagar – Tue/Fri', agent: REPS.priya, days: [2, 5], customers: ['02', '10', '14'], visited: 3 },
    { key: 'arjun', name: 'Whitefield – Mon/Wed', agent: REPS.arjun, days: [1, 3], customers: ['03', '07', '11', '15'], visited: 4 },
    { key: 'deepa', name: 'BTM/JP Nagar – Wed/Sat', agent: REPS.deepa, days: [3, 6], customers: ['04', '08', '16'], visited: 3 },
  ];

  const beats = themes.map((t) => ({
    id: randomUUID(),
    ...t,
    weekdays: [...new Set([...t.days, todayDow])].sort((a, b) => a - b),
    customers: t.customers.map((nn) => ({ id: C(nn) })),
  }));

  const agentIds = themes.map((t) => REPS[t.key]);

  // --- reset prior demo seed (idempotent) ---
  // Only remove THIS seed's progress visits (tagged), so other demo data is untouched.
  await sql(
    `delete from plan_visits where organization_id = ${Q(DEMO)} and plan_date = ${Q(today)};
     delete from visits where organization_id = ${Q(DEMO)}
       and user_id in (${agentIds.map(Q).join(',')}) and check_in_time::date = current_date;
     delete from beats where organization_id = ${Q(DEMO)};
     delete from location_history where organization_id = ${Q(DEMO)} and recorded_at::date = current_date
       and user_id in (${agentIds.map(Q).join(',')});
     delete from attendance where organization_id = ${Q(DEMO)} and date = current_date
       and user_id in (${agentIds.map(Q).join(',')});`,
  );

  // --- insert beats + beat_customers ---
  const beatRows = beats
    .map(
      (b) =>
        `(${Q(b.id)}, ${Q(DEMO)}, ${Q(b.name)}, ${Q(b.agent)}, array[${b.weekdays.join(',')}]::int[], 'weekly', 0, 1, true)`,
    )
    .join(',\n');
  await sql(
    `insert into beats (id, organization_id, name, agent_id, weekdays, cadence, week_parity, week_of_month, active)
     values\n${beatRows};`,
  );

  const bcRows = beats
    .flatMap((b) => b.customers.map((c, seq) => `(${Q(b.id)}, ${Q(c.id)}, ${seq})`))
    .join(',\n');
  await sql(`insert into beat_customers (beat_id, customer_id, seq) values\n${bcRows};`);
  console.log(`Inserted ${beats.length} beats, ${beats.reduce((n, b) => n + b.customers.length, 0)} beat_customers.`);

  // --- generate today's plan for each rep ---
  for (const b of beats) {
    const rows = await sql(`select count(*)::int as n from get_or_generate_daily_plan(${Q(b.agent)}, ${Q(today)})`);
    console.log(`  ${b.name}: ${rows[0].n} plan items for ${b.key}`);
  }

  // --- customer coordinates (for real movement trails) ---
  const allIds = [...new Set(beats.flatMap((b) => b.customers.map((c) => c.id)))];
  const coordRows = await sql(
    `select id::text id, latitude lat, longitude lng from leads where id::text in (${allIds.map(Q).join(',')})`,
  );
  const coord = new Map(coordRows.map((r) => [r.id, { lat: Number(r.lat), lng: Number(r.lng) }]));

  // --- end-of-day: attendance (punched in + out) + completed visits at real coords ---
  // Staggered check-in times across the day so the map trail reads start → A → B → C.
  for (const b of beats) {
    const first = coord.get(b.customers[0].id);
    const att = randomUUID();
    await sql(
      `insert into attendance (id, user_id, organization_id, date, punch_in_time,
         punch_in_latitude, punch_in_longitude, punch_in_accuracy, punch_out_time,
         punch_out_latitude, punch_out_longitude, status)
       values (${Q(att)}, ${Q(b.agent)}, ${Q(DEMO)}, current_date,
         date_trunc('day', now()) + interval '195 minutes',
         ${(first.lat - 0.025).toFixed(6)}, ${(first.lng - 0.025).toFixed(6)}, 9,
         now() - interval '25 minutes', ${first.lat.toFixed(6)}, ${first.lng.toFixed(6)}, 'completed');`,
    );

    const visitedCust = b.customers.slice(0, b.visited);
    for (let idx = 0; idx < visitedCust.length; idx++) {
      const c = coord.get(visitedCust[idx].id);
      const visitId = randomUUID();
      const cmin = 210 + idx * 100; // UTC minutes → ~09:00, 10:40, 12:20, 14:00 IST
      await sql(
        `insert into visits (id, organization_id, user_id, customer_id, check_in_time, check_out_time,
           check_in_latitude, check_in_longitude, status, purpose, notes)
         values (${Q(visitId)}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(visitedCust[idx].id)},
           date_trunc('day', now()) + interval '${cmin} minutes',
           date_trunc('day', now()) + interval '${cmin + 25} minutes',
           ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}, 'completed', 'follow-up', '__beatseed');
         update plan_visits set status='visited', visit_id=${Q(visitId)}
           where agent_id=${Q(b.agent)} and plan_date=${Q(today)} and customer_id=${Q(visitedCust[idx].id)};`,
      );
    }
    console.log(`  ${b.key}: attendance + ${visitedCust.length} completed visits`);
  }

  // --- summary ---
  const summary = await sql(
    `select p.full_name, count(*) filter (where pv.status='visited') visited, count(*) total
     from plan_visits pv join profiles p on p.id = pv.agent_id
     where pv.organization_id = ${Q(DEMO)} and pv.plan_date = ${Q(today)}
     group by p.full_name order by p.full_name`,
  );
  console.log('\nToday plan summary:');
  summary.forEach((s) => console.log(`  ${s.full_name}: ${s.visited}/${s.total} visited`));
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
