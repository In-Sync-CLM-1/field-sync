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
  const themes = [
    // Kavya: Vikram(05), Suresh(09) done earlier; Harish(01) next; Manish(13) after.
    { key: 'kavya', name: 'Koramangala – Mon/Thu', agent: REPS.kavya, days: [1, 4], customers: ['05', '09', '01', '13'], visited: 2 },
    { key: 'priya', name: 'Indiranagar – Tue/Fri', agent: REPS.priya, days: [2, 5], customers: ['02', '10', '14'], visited: 0 },
    { key: 'arjun', name: 'Whitefield – Mon/Wed', agent: REPS.arjun, days: [1, 3], customers: ['03', '07', '11', '15'], visited: 0 },
    { key: 'deepa', name: 'BTM/JP Nagar – Wed/Sat', agent: REPS.deepa, days: [3, 6], customers: ['04', '08', '16'], visited: 0 },
  ];

  const beats = themes.map((t) => ({
    id: randomUUID(),
    ...t,
    weekdays: [...new Set([...t.days, todayDow])].sort((a, b) => a - b),
    customers: t.customers.map((nn) => ({ id: C(nn) })),
  }));

  // --- reset prior demo seed (idempotent) ---
  // Only remove THIS seed's progress visits (tagged), so other demo data is untouched.
  await sql(
    `delete from plan_visits where organization_id = ${Q(DEMO)} and plan_date = ${Q(today)};
     delete from visits where organization_id = ${Q(DEMO)} and notes = '__beatseed';
     delete from beats where organization_id = ${Q(DEMO)};`,
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

  // --- show progress: mark the first N items of each beat visited (real visit rows) ---
  for (const b of beats) {
    if (!b.visited) continue;
    const items = await sql(
      `select pv.id, pv.customer_id from plan_visits pv
       where pv.agent_id = ${Q(b.agent)} and pv.plan_date = ${Q(today)} order by pv.seq limit ${b.visited}`,
    );
    for (const item of items) {
      const visitId = randomUUID();
      await sql(
        `insert into visits (id, organization_id, user_id, customer_id, check_in_time, check_out_time,
           check_in_latitude, check_in_longitude, status, purpose, notes)
         values (${Q(visitId)}, ${Q(DEMO)}, ${Q(b.agent)}, ${Q(item.customer_id)}, now(), now(),
           12.9352, 77.6245, 'completed', 'follow-up', '__beatseed');
         update plan_visits set status = 'visited', visit_id = ${Q(visitId)} where id = ${Q(item.id)};`,
      );
    }
    console.log(`  ${b.key}: marked ${items.length} visited.`);
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
