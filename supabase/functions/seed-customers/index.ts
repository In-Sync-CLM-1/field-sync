import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPhone(): string { return `+91${randomInt(7000000000, 9999999999)}`; }
function jitter(base: number, range: number): number { return base + (Math.random() - 0.5) * range; }
function isWeekday(d: Date): boolean { const day = d.getDay(); return day !== 0 && day !== 6; }

const cityData: { city: string; state: string; lat: number; lng: number; streets: string[] }[] = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, streets: ['MG Road', 'Linking Road', 'Hill Road', 'SV Road', 'Carter Road', 'Marine Drive'] },
  { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, streets: ['Connaught Place', 'Chandni Chowk', 'Rajpath', 'Karol Bagh', 'Lajpat Nagar'] },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946, streets: ['Brigade Road', 'MG Road', 'Commercial Street', 'Indiranagar', 'Koramangala'] },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, streets: ['CG Road', 'SG Highway', 'Ashram Road', 'Satellite Road', 'Law Garden'] },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, streets: ['FC Road', 'JM Road', 'MG Road', 'Koregaon Park', 'Hinjewadi'] },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, streets: ['Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Ameerpet', 'Kukatpally'] },
];

const firstNames = ['Rajesh','Priya','Amit','Sneha','Vikram','Anjali','Arjun','Divya','Rohit','Kavya',
  'Sanjay','Pooja','Arun','Neha','Karthik','Ritu','Manoj','Swati','Deepak','Meera',
  'Suresh','Lakshmi','Ganesh','Nisha','Harish','Sunita','Prakash','Geeta','Ramesh','Rekha'];
const lastNames = ['Kumar','Sharma','Singh','Patel','Reddy','Nair','Gupta','Rao','Mehta','Iyer',
  'Desai','Joshi','Verma','Agarwal','Khanna','Malhotra','Bhat','Shetty','Pillai','Saxena'];

const visitPurposes = ['Policy Review', 'Premium Collection', 'New Policy Pitch', 'Claim Follow-up',
  'Renewal Discussion', 'Document Collection', 'KYC Verification', 'Product Demo'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[Seed] Seeding customers for org: ${organizationId}`);

    // Get users in this org
    const { data: orgUsers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const users = orgUsers || [];
    const results = { leads_with_location: 0, leads_without_location: 0, visits: 0, attendance: 0, orders: 0 };

    // ====== 1. LEADS — 25 with location, 25 without ======
    const leadRecords = [];
    const today = new Date();

    for (let i = 0; i < 50; i++) {
      const hasLocation = i < 25; // first 25 have GPS coords
      const loc = randomFrom(cityData);
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);
      const daysAgo = randomInt(1, 60);
      const followUpDays = randomInt(-5, 14); // some overdue, some future

      const followUpDate = new Date(today);
      followUpDate.setDate(followUpDate.getDate() + followUpDays);

      const record: Record<string, unknown> = {
        organization_id: organizationId,
        name: `${firstName} ${lastName}`,
        mobile_no: randomPhone(),
        village_city: loc.city,
        district: loc.city,
        state: loc.state,
        status: randomFrom(['active', 'active', 'active', 'converted', 'lost']),
        lead_source: randomFrom(['Walk-in', 'Referral', 'Cold Call', 'Online', 'Campaign', 'Partner']),
        customer_response: randomFrom(['Interested', 'Follow-up needed', 'Call back later', 'Highly interested', null]),
        follow_up_date: followUpDate.toISOString().split('T')[0],
      };

      if (users.length > 0) {
        record.assigned_user_id = randomFrom(users).id;
        record.created_by = record.assigned_user_id;
      }

      if (hasLocation) {
        record.latitude = jitter(loc.lat, 0.08);
        record.longitude = jitter(loc.lng, 0.08);
      }
      // else: no lat/lng — location-less customer

      leadRecords.push(record);
    }

    const { data: insertedLeads, error: leadErr } = await supabase
      .from('leads')
      .insert(leadRecords)
      .select('id');

    if (leadErr) { console.error('[Seed] Leads error:', leadErr); throw leadErr; }
    const leadIds = (insertedLeads || []).map(l => l.id);
    results.leads_with_location = 25;
    results.leads_without_location = 25;
    console.log(`[Seed] Inserted ${leadIds.length} leads`);

    // ====== 2. ATTENDANCE — last 7 days for each user ======
    if (users.length > 0) {
      const attendanceRecords = [];
      for (const user of users) {
        for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          if (!isWeekday(date)) continue;
          if (daysAgo > 0 && Math.random() < 0.1) continue; // 10% absent

          const dateStr = date.toISOString().split('T')[0];
          const loc = randomFrom(cityData);
          const punchIn = new Date(date); punchIn.setHours(randomInt(8, 10), randomInt(0, 59), 0, 0);
          const punchOut = daysAgo === 0 ? null : new Date(date); // today = still working
          if (punchOut) punchOut.setHours(randomInt(17, 19), randomInt(0, 59), 0, 0);
          const totalHours = punchOut ? (punchOut.getTime() - punchIn.getTime()) / 3600000 : null;

          attendanceRecords.push({
            user_id: user.id,
            organization_id: organizationId,
            date: dateStr,
            punch_in_time: punchIn.toISOString(),
            punch_in_latitude: jitter(loc.lat, 0.02),
            punch_in_longitude: jitter(loc.lng, 0.02),
            punch_in_accuracy: randomInt(5, 20),
            punch_out_time: punchOut?.toISOString() || null,
            punch_out_latitude: punchOut ? jitter(loc.lat, 0.02) : null,
            punch_out_longitude: punchOut ? jitter(loc.lng, 0.02) : null,
            punch_out_accuracy: punchOut ? randomInt(5, 20) : null,
            total_hours: totalHours ? Math.round(totalHours * 100) / 100 : null,
            status: punchOut ? 'completed' : 'active',
          });
        }
      }

      for (let i = 0; i < attendanceRecords.length; i += 50) {
        const batch = attendanceRecords.slice(i, i + 50);
        const { data: inserted, error: attErr } = await supabase
          .from('attendance')
          .upsert(batch, { onConflict: 'user_id,date' })
          .select('id');
        if (attErr) { console.error('[Seed] Attendance error:', attErr); continue; }
        results.attendance += inserted?.length || 0;
      }
      console.log(`[Seed] Inserted ${results.attendance} attendance records`);
    }

    // ====== 3. VISITS — 40 completed, 10 in-progress, 5 cancelled ======
    if (users.length > 0 && leadIds.length > 0) {
      const visitRecords = [];
      for (let i = 0; i < 55; i++) {
        const user = randomFrom(users);
        const loc = randomFrom(cityData);
        const daysAgo = randomInt(0, 14);
        const visitDate = new Date(today);
        visitDate.setDate(visitDate.getDate() - daysAgo);
        visitDate.setHours(randomInt(9, 16), randomInt(0, 59), 0, 0);

        const durationMins = randomInt(15, 90);
        const checkOut = new Date(visitDate.getTime() + durationMins * 60000);

        let status: string;
        if (i < 40) status = 'completed';
        else if (i < 50) status = 'in_progress';
        else status = 'cancelled';

        visitRecords.push({
          organization_id: organizationId,
          user_id: user.id,
          customer_id: randomFrom(leadIds),
          purpose: randomFrom(visitPurposes),
          notes: `${randomFrom(visitPurposes)} — ${loc.city}`,
          check_in_time: visitDate.toISOString(),
          check_in_latitude: jitter(loc.lat, 0.1),
          check_in_longitude: jitter(loc.lng, 0.1),
          check_out_time: status === 'completed' ? checkOut.toISOString() : null,
          check_out_latitude: status === 'completed' ? jitter(loc.lat, 0.1) : null,
          check_out_longitude: status === 'completed' ? jitter(loc.lng, 0.1) : null,
          status,
          cancel_reason: status === 'cancelled' ? randomFrom(['Customer not available', 'Rescheduled', 'Bad weather']) : null,
          cancelled_at: status === 'cancelled' ? visitDate.toISOString() : null,
          scheduled_date: visitDate.toISOString().split('T')[0],
        });
      }

      for (let i = 0; i < visitRecords.length; i += 50) {
        const batch = visitRecords.slice(i, i + 50);
        const { data: inserted, error: visitErr } = await supabase.from('visits').insert(batch).select('id');
        if (visitErr) { console.error('[Seed] Visit error:', visitErr); continue; }
        results.visits += inserted?.length || 0;
      }
      console.log(`[Seed] Inserted ${results.visits} visits`);
    }

    // ====== 4. ORDERS — 20 recent orders ======
    if (users.length > 0 && leadIds.length > 0) {
      const orderRecords = [];
      const items = ['Widget A x5', 'Premium Package', 'Basic Plan', 'Gold Membership',
        'Service Contract', 'Product Bundle', 'Annual Subscription', 'Starter Kit'];

      for (let i = 0; i < 20; i++) {
        const daysAgo = randomInt(0, 14);
        const orderDate = new Date(today);
        orderDate.setDate(orderDate.getDate() - daysAgo);

        orderRecords.push({
          organization_id: organizationId,
          user_id: randomFrom(users).id,
          customer_id: randomFrom(leadIds),
          items_text: randomFrom(items),
          total_amount: randomInt(500, 25000),
          notes: `Demo order #${i + 1}`,
          created_at: orderDate.toISOString(),
        });
      }

      const { data: inserted, error: orderErr } = await supabase.from('orders').insert(orderRecords).select('id');
      if (orderErr) { console.error('[Seed] Orders error:', orderErr); }
      else results.orders = inserted?.length || 0;
      console.log(`[Seed] Inserted ${results.orders} orders`);
    }

    return new Response(JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[Seed] Error:', err);
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
