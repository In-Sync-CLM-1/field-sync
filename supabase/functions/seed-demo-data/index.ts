import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helpers
function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPhone(): string { return `+91${randomInt(7000000000, 9999999999)}`; }
function isWeekday(d: Date): boolean { const day = d.getDay(); return day !== 0 && day !== 6; }
function randomFloat(min: number, max: number): number { return min + Math.random() * (max - min); }

const cityCoords: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.076, lng: 72.8777 },
  'New Delhi': { lat: 28.6139, lng: 77.209 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

const custFirstNames = ['Rajesh','Priya','Amit','Sneha','Vikram','Anjali','Arjun','Divya','Rohit','Kavya',
  'Sanjay','Pooja','Arun','Neha','Karthik','Ritu','Manoj','Swati','Deepak','Meera',
  'Suresh','Lakshmi','Ganesh','Nisha','Harish','Sunita','Prakash','Geeta','Ramesh','Rekha',
  'Vijay','Ananya','Pankaj','Tanvi','Naveen','Bhavna','Dinesh','Pallavi','Kishore','Aarti',
  'Mohan','Shalini','Sunil','Jaya','Ashok','Usha','Girish','Smita','Nitin','Vandana'];
const custLastNames = ['Kumar','Sharma','Singh','Patel','Reddy','Nair','Gupta','Rao','Mehta','Iyer',
  'Desai','Joshi','Verma','Agarwal','Khanna','Malhotra','Bhat','Shetty','Pillai','Saxena'];
const industries = ['Insurance','Banking','Healthcare','Education','IT Services','Manufacturing','Retail','Agriculture','Real Estate','Pharma'];
const visitPurposes = ['Policy Review','Premium Collection','New Policy Pitch','Claim Follow-up','Renewal Discussion','Document Collection','KYC Verification','Complaint Resolution'];

// Agent performance profiles - some are high performers, some low
const performanceProfiles = [
  { targetMultiplier: 1.2, visitCompletion: 0.95, attendanceRate: 0.98, label: 'star' },
  { targetMultiplier: 1.1, visitCompletion: 0.90, attendanceRate: 0.95, label: 'strong' },
  { targetMultiplier: 1.0, visitCompletion: 0.85, attendanceRate: 0.92, label: 'average' },
  { targetMultiplier: 0.85, visitCompletion: 0.80, attendanceRate: 0.90, label: 'average' },
  { targetMultiplier: 0.7, visitCompletion: 0.70, attendanceRate: 0.85, label: 'below' },
  { targetMultiplier: 0.6, visitCompletion: 0.65, attendanceRate: 0.75, label: 'struggling' },
  { targetMultiplier: 1.15, visitCompletion: 0.88, attendanceRate: 0.96, label: 'strong' },
  { targetMultiplier: 0.9, visitCompletion: 0.82, attendanceRate: 0.88, label: 'average' },
  { targetMultiplier: 0.75, visitCompletion: 0.75, attendanceRate: 0.82, label: 'below' },
  { targetMultiplier: 1.05, visitCompletion: 0.87, attendanceRate: 0.93, label: 'strong' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    const mode = body.mode || 'default';
    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[Seed] Starting mode=${mode} for org: ${organizationId}`);

    // Fetch users for this org
    const { data: users, error: usersErr } = await supabase
      .from('profiles')
      .select('id, full_name, branch_id, email')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (usersErr) throw usersErr;
    if (!users || users.length === 0) throw new Error('No users found for this organization');

    const { data: branches } = await supabase
      .from('branches')
      .select('id, name, city')
      .eq('organization_id', organizationId);

    const branchMap = new Map((branches || []).map(b => [b.id, b]));
    const fieldUsers = users.filter(u => u.branch_id);
    const agentsForSeeding = fieldUsers.length > 0 ? fieldUsers : users.slice(0, 8);

    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId);
    const leadIds = (leads || []).map(l => l.id);

    const results = { customers: 0, attendance: 0, visits: 0, location_history: 0, daily_plans: 0 };

    if (mode === 'performance-review') {
      // ====== PERFORMANCE REVIEW MODE ======
      // Dense data for 30 days with varied performance profiles
      const today = new Date();
      
      // Assign performance profiles to agents
      const agentProfiles = agentsForSeeding.map((agent, i) => ({
        ...agent,
        profile: performanceProfiles[i % performanceProfiles.length],
      }));

      // ====== 1. DAILY PLANS - 30 days for all agents ======
      const dailyPlanRecords = [];
      for (const agent of agentProfiles) {
        for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          if (!isWeekday(date)) continue;

          const dateStr = date.toISOString().split('T')[0];
          const p = agent.profile;
          
          // Targets
          const prospectsTarget = randomInt(4, 8);
          const quotesTarget = randomInt(2, 5);
          const salesTarget = randomInt(1, 3);
          
          // Actuals with variance based on profile
          const dayVariance = randomFloat(0.7, 1.3);
          const prospectsActual = Math.max(0, Math.round(prospectsTarget * p.targetMultiplier * dayVariance));
          const quotesActual = Math.max(0, Math.round(quotesTarget * p.targetMultiplier * dayVariance));
          const salesActual = Math.max(0, Math.round(salesTarget * p.targetMultiplier * dayVariance));

          dailyPlanRecords.push({
            user_id: agent.id,
            organization_id: organizationId,
            plan_date: dateStr,
            prospects_target: prospectsTarget,
            prospects_actual: prospectsActual,
            quotes_target: quotesTarget,
            quotes_actual: quotesActual,
            policies_target: salesTarget,
            policies_actual: salesActual,
            status: daysAgo === 0 ? 'draft' : 'submitted',
          });
        }
      }

      // Insert daily plans in batches
      for (let i = 0; i < dailyPlanRecords.length; i += 50) {
        const batch = dailyPlanRecords.slice(i, i + 50);
        const { data: inserted, error: dpErr } = await supabase.from('daily_plans').upsert(batch, { onConflict: 'user_id,plan_date' }).select('id');
        if (dpErr) { console.error('[Seed] Daily plans batch error:', dpErr); continue; }
        results.daily_plans += inserted?.length || 0;
      }
      console.log(`[Seed] Inserted ${results.daily_plans} daily plans`);

      // ====== 2. ATTENDANCE - 30 days, varied rates per agent ======
      const attendanceRecords = [];
      for (const agent of agentProfiles) {
        const branch = agent.branch_id ? branchMap.get(agent.branch_id) : null;
        const city = branch?.city || 'Mumbai';
        const coords = cityCoords[city] || cityCoords['Mumbai'];

        for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          if (!isWeekday(date)) continue;
          // Skip based on agent's attendance profile
          if (Math.random() > agent.profile.attendanceRate) continue;

          const dateStr = date.toISOString().split('T')[0];
          const punchInHour = randomInt(8, 10);
          const punchInMin = randomInt(0, 59);
          const punchIn = new Date(date);
          punchIn.setHours(punchInHour, punchInMin, 0, 0);

          const punchOutHour = randomInt(17, 19);
          const punchOutMin = randomInt(0, 59);
          const punchOut = new Date(date);
          punchOut.setHours(punchOutHour, punchOutMin, 0, 0);

          const totalHours = (punchOut.getTime() - punchIn.getTime()) / 3600000;

          attendanceRecords.push({
            user_id: agent.id,
            organization_id: organizationId,
            date: dateStr,
            punch_in_time: punchIn.toISOString(),
            punch_in_latitude: jitter(coords.lat, 0.02),
            punch_in_longitude: jitter(coords.lng, 0.02),
            punch_in_accuracy: randomInt(5, 30),
            punch_out_time: punchOut.toISOString(),
            punch_out_latitude: jitter(coords.lat, 0.02),
            punch_out_longitude: jitter(coords.lng, 0.02),
            punch_out_accuracy: randomInt(5, 30),
            total_hours: Math.round(totalHours * 100) / 100,
            status: 'completed',
          });
        }
      }

      for (let i = 0; i < attendanceRecords.length; i += 50) {
        const batch = attendanceRecords.slice(i, i + 50);
        const { data: inserted, error: attErr } = await supabase.from('attendance').upsert(batch, { onConflict: 'user_id,date' }).select('id');
        if (attErr) { console.error('[Seed] Attendance batch error:', attErr); continue; }
        results.attendance += inserted?.length || 0;
      }
      console.log(`[Seed] Inserted ${results.attendance} attendance records`);

      // ====== 3. VISITS - 300+ with varying completion rates ======
      if (leadIds.length > 0) {
        const visitRecords = [];
        for (const agent of agentProfiles) {
          const branch = agent.branch_id ? branchMap.get(agent.branch_id) : null;
          const city = branch?.city || 'Mumbai';
          const coords = cityCoords[city] || cityCoords['Mumbai'];
          
          // Each agent gets 25-40 visits over the month
          const numVisits = randomInt(25, 40);
          for (let v = 0; v < numVisits; v++) {
            const daysAgo = randomInt(0, 29);
            const visitDate = new Date(today);
            visitDate.setDate(visitDate.getDate() - daysAgo);
            if (!isWeekday(visitDate)) continue;
            
            const checkInHour = randomInt(9, 16);
            visitDate.setHours(checkInHour, randomInt(0, 59), 0, 0);
            const durationMins = randomInt(15, 90);
            const checkOut = new Date(visitDate.getTime() + durationMins * 60000);
            
            const isCompleted = Math.random() < agent.profile.visitCompletion;
            const isCancelled = !isCompleted && Math.random() > 0.5;

            visitRecords.push({
              organization_id: organizationId,
              user_id: agent.id,
              customer_id: randomFrom(leadIds),
              purpose: randomFrom(visitPurposes),
              notes: `${randomFrom(visitPurposes)} - demo visit`,
              check_in_time: visitDate.toISOString(),
              check_in_latitude: jitter(coords.lat, 0.1),
              check_in_longitude: jitter(coords.lng, 0.1),
              check_out_time: isCompleted ? checkOut.toISOString() : null,
              check_out_latitude: isCompleted ? jitter(coords.lat, 0.1) : null,
              check_out_longitude: isCompleted ? jitter(coords.lng, 0.1) : null,
              status: isCompleted ? 'completed' : (isCancelled ? 'cancelled' : 'in_progress'),
              cancel_reason: isCancelled ? randomFrom(['Customer not available', 'Rescheduled', 'Bad weather']) : null,
              cancelled_at: isCancelled ? visitDate.toISOString() : null,
              scheduled_date: visitDate.toISOString().split('T')[0],
            });
          }
        }

        for (let i = 0; i < visitRecords.length; i += 50) {
          const batch = visitRecords.slice(i, i + 50);
          const { data: inserted, error: visitErr } = await supabase.from('visits').insert(batch).select('id');
          if (visitErr) { console.error('[Seed] Visit batch error:', visitErr); continue; }
          results.visits += inserted?.length || 0;
        }
        console.log(`[Seed] Inserted ${results.visits} visits`);
      }

      // ====== 4. LOCATION HISTORY - Dense for last 7 days ======
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('id, user_id, punch_in_time, punch_out_time')
        .eq('organization_id', organizationId)
        .not('punch_in_time', 'is', null)
        .not('punch_out_time', 'is', null)
        .order('date', { ascending: false })
        .limit(100);

      if (recentAttendance && recentAttendance.length > 0) {
        const locationRecords = [];
        for (const att of recentAttendance) {
          const agent = users.find(u => u.id === att.user_id);
          const branch = agent?.branch_id ? branchMap.get(agent.branch_id) : null;
          const city = branch?.city || 'Mumbai';
          const coords = cityCoords[city] || cityCoords['Mumbai'];

          const punchIn = new Date(att.punch_in_time!);
          const punchOut = new Date(att.punch_out_time!);
          const totalMinutes = (punchOut.getTime() - punchIn.getTime()) / 60000;
          // More dense breadcrumbs: every 15-20 minutes
          const numPoints = Math.min(30, Math.max(8, Math.round(totalMinutes / 15)));
          const intervalMinutes = totalMinutes / numPoints;

          // Simulate a walking path
          let currentLat = jitter(coords.lat, 0.02);
          let currentLng = jitter(coords.lng, 0.02);

          for (let p = 0; p < numPoints; p++) {
            const recordedAt = new Date(punchIn.getTime() + p * intervalMinutes * 60000);
            currentLat += (Math.random() - 0.5) * 0.005;
            currentLng += (Math.random() - 0.5) * 0.005;
            
            locationRecords.push({
              user_id: att.user_id,
              organization_id: organizationId,
              attendance_id: att.id,
              latitude: currentLat,
              longitude: currentLng,
              accuracy: randomInt(5, 30),
              recorded_at: recordedAt.toISOString(),
            });
          }
        }

        for (let i = 0; i < locationRecords.length; i += 100) {
          const batch = locationRecords.slice(i, i + 100);
          const { data: inserted, error: locErr } = await supabase.from('location_history').insert(batch).select('id');
          if (locErr) { console.error('[Seed] Location batch error:', locErr); continue; }
          results.location_history += inserted?.length || 0;
        }
        console.log(`[Seed] Inserted ${results.location_history} location history records`);
      }

    } else {
      // ====== DEFAULT MODE (existing behavior) ======
      const today = new Date();

      // 1. CUSTOMERS
      const customerRecords = [];
      for (let i = 0; i < 50; i++) {
        const user = randomFrom(agentsForSeeding);
        const branch = user.branch_id ? branchMap.get(user.branch_id) : null;
        const city = branch?.city || 'Mumbai';
        const coords = cityCoords[city] || cityCoords['Mumbai'];

        customerRecords.push({
          organization_id: organizationId,
          name: `${randomFrom(custFirstNames)} ${randomFrom(custLastNames)}`,
          phone: randomPhone(),
          email: `customer${i + 1}@example.com`,
          address: `${randomInt(1, 500)}, ${randomFrom(['MG Road','Park Street','Brigade Road','Connaught Place','Marine Drive','Linking Road','Commercial Street','Banjara Hills'])}, ${city}`,
          city,
          state: city === 'Mumbai' ? 'Maharashtra' : city === 'New Delhi' ? 'Delhi' : city === 'Bangalore' ? 'Karnataka' : 'Gujarat',
          country: 'India',
          postal_code: `${randomInt(100000, 999999)}`,
          territory: branch?.name || 'General',
          status: randomFrom(['active', 'active', 'active', 'inactive', 'prospect']),
          customer_type: randomFrom(['Individual', 'Business', 'Corporate']),
          industry: randomFrom(industries),
          company_name: Math.random() > 0.5 ? `${randomFrom(custLastNames)} ${randomFrom(['Enterprises','Industries','Solutions','Services','Trading'])}` : null,
          assigned_user_id: user.id,
          latitude: jitter(coords.lat, 0.15),
          longitude: jitter(coords.lng, 0.15),
          tags: [randomFrom(['VIP', 'Regular', 'New', 'High-Value', 'Loyal'])],
          notes: `Seeded demo customer in ${city}`,
        });
      }

      const { data: insertedCustomers, error: custErr } = await supabase.from('customers').insert(customerRecords).select('id');
      if (custErr) { console.error('[Seed] Customer insert error:', custErr); throw custErr; }
      results.customers = insertedCustomers?.length || 0;

      // 2. ATTENDANCE
      const attendanceRecords = [];
      for (const agent of agentsForSeeding) {
        const branch = agent.branch_id ? branchMap.get(agent.branch_id) : null;
        const city = branch?.city || 'Mumbai';
        const coords = cityCoords[city] || cityCoords['Mumbai'];
        for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          if (!isWeekday(date)) continue;
          if (Math.random() < 0.1) continue;
          const dateStr = date.toISOString().split('T')[0];
          const punchIn = new Date(date); punchIn.setHours(randomInt(8, 10), randomInt(0, 59), 0, 0);
          const punchOut = new Date(date); punchOut.setHours(randomInt(17, 19), randomInt(0, 59), 0, 0);
          const totalHours = (punchOut.getTime() - punchIn.getTime()) / 3600000;
          attendanceRecords.push({
            user_id: agent.id, organization_id: organizationId, date: dateStr,
            punch_in_time: punchIn.toISOString(), punch_in_latitude: jitter(coords.lat, 0.02), punch_in_longitude: jitter(coords.lng, 0.02), punch_in_accuracy: randomInt(5, 30),
            punch_out_time: punchOut.toISOString(), punch_out_latitude: jitter(coords.lat, 0.02), punch_out_longitude: jitter(coords.lng, 0.02), punch_out_accuracy: randomInt(5, 30),
            total_hours: Math.round(totalHours * 100) / 100, status: 'completed',
          });
        }
      }
      for (let i = 0; i < attendanceRecords.length; i += 50) {
        const batch = attendanceRecords.slice(i, i + 50);
        const { data: inserted, error: attErr } = await supabase.from('attendance').insert(batch).select('id');
        if (attErr) { console.error('[Seed] Attendance batch error:', attErr); continue; }
        results.attendance += inserted?.length || 0;
      }

      // 3. VISITS
      if (leadIds.length > 0) {
        const visitRecords = [];
        for (let i = 0; i < 100; i++) {
          const agent = randomFrom(agentsForSeeding);
          const branch = agent.branch_id ? branchMap.get(agent.branch_id) : null;
          const city = branch?.city || 'Mumbai';
          const coords = cityCoords[city] || cityCoords['Mumbai'];
          const daysAgo = randomInt(1, 30);
          const visitDate = new Date(today); visitDate.setDate(visitDate.getDate() - daysAgo);
          visitDate.setHours(randomInt(9, 16), randomInt(0, 59), 0, 0);
          const durationMins = randomInt(15, 90);
          const checkOut = new Date(visitDate.getTime() + durationMins * 60000);
          const isCompleted = Math.random() > 0.2;
          const isCancelled = !isCompleted && Math.random() > 0.5;
          visitRecords.push({
            organization_id: organizationId, user_id: agent.id, customer_id: randomFrom(leadIds),
            purpose: randomFrom(visitPurposes), notes: `${randomFrom(visitPurposes)} - demo visit`,
            check_in_time: visitDate.toISOString(), check_in_latitude: jitter(coords.lat, 0.1), check_in_longitude: jitter(coords.lng, 0.1),
            check_out_time: isCompleted ? checkOut.toISOString() : null,
            check_out_latitude: isCompleted ? jitter(coords.lat, 0.1) : null, check_out_longitude: isCompleted ? jitter(coords.lng, 0.1) : null,
            status: isCompleted ? 'completed' : (isCancelled ? 'cancelled' : 'in_progress'),
            cancel_reason: isCancelled ? randomFrom(['Customer not available', 'Rescheduled', 'Bad weather']) : null,
            cancelled_at: isCancelled ? visitDate.toISOString() : null,
            scheduled_date: visitDate.toISOString().split('T')[0],
          });
        }
        for (let i = 0; i < visitRecords.length; i += 50) {
          const batch = visitRecords.slice(i, i + 50);
          const { data: inserted, error: visitErr } = await supabase.from('visits').insert(batch).select('id');
          if (visitErr) { console.error('[Seed] Visit batch error:', visitErr); continue; }
          results.visits += inserted?.length || 0;
        }
      }

      // 4. LOCATION HISTORY
      const { data: attendanceData } = await supabase
        .from('attendance').select('id, user_id, punch_in_time, punch_out_time, organization_id')
        .eq('organization_id', organizationId).not('punch_in_time', 'is', null).not('punch_out_time', 'is', null)
        .order('date', { ascending: false }).limit(200);

      if (attendanceData && attendanceData.length > 0) {
        const locationRecords = [];
        const sampleAttendance = attendanceData.slice(0, 50);
        for (const att of sampleAttendance) {
          const agent = users.find(u => u.id === att.user_id);
          const branch = agent?.branch_id ? branchMap.get(agent.branch_id) : null;
          const city = branch?.city || 'Mumbai';
          const coords = cityCoords[city] || cityCoords['Mumbai'];
          const punchIn = new Date(att.punch_in_time!);
          const punchOut = new Date(att.punch_out_time!);
          const totalMinutes = (punchOut.getTime() - punchIn.getTime()) / 60000;
          const numPoints = randomInt(5, 10);
          const intervalMinutes = totalMinutes / numPoints;
          for (let p = 0; p < numPoints; p++) {
            const recordedAt = new Date(punchIn.getTime() + p * intervalMinutes * 60000);
            locationRecords.push({
              user_id: att.user_id, organization_id: organizationId, attendance_id: att.id,
              latitude: jitter(coords.lat, 0.08), longitude: jitter(coords.lng, 0.08),
              accuracy: randomInt(5, 50), recorded_at: recordedAt.toISOString(),
            });
          }
        }
        for (let i = 0; i < locationRecords.length; i += 100) {
          const batch = locationRecords.slice(i, i + 100);
          const { data: inserted, error: locErr } = await supabase.from('location_history').insert(batch).select('id');
          if (locErr) { console.error('[Seed] Location batch error:', locErr); continue; }
          results.location_history += inserted?.length || 0;
        }
      }
    }

    console.log('[Seed] Complete!', results);
    return new Response(
      JSON.stringify({ success: true, mode, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Seed] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
