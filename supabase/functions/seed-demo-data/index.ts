import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Indian names, cities, and data
const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Divya', 'Rohit', 'Kavya', 'Sanjay', 'Pooja', 'Arun', 'Neha', 'Karthik', 'Ritu', 'Manoj', 'Swati', 'Deepak', 'Meera'];
const lastNames = ['Kumar', 'Sharma', 'Singh', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Rao', 'Mehta', 'Iyer', 'Desai', 'Joshi', 'Verma', 'Agarwal', 'Khanna'];
const territories = ['North', 'South', 'East', 'West'];
const cities = {
  North: ['Delhi', 'Chandigarh', 'Jaipur', 'Lucknow', 'Amritsar'],
  South: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore'],
  East: ['Kolkata', 'Bhubaneswar', 'Patna', 'Guwahati', 'Ranchi'],
  West: ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Nagpur']
};
const visitPurposes = ['Sales Call', 'Service Visit', 'Follow-up', 'Product Demo', 'Support', 'Delivery', 'Installation'];
const customerStatuses = ['active', 'inactive', 'pending'];
const tags = ['VIP', 'Regular', 'New', 'High-Value', 'Potential', 'Loyal'];

function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone(): string {
  return `+91${randomInt(7000000000, 9999999999)}`;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  date.setHours(randomInt(9, 18), randomInt(0, 59), 0, 0);
  return date.toISOString();
}

function generateGPS(territory: string): { lat: number; lng: number } {
  const coords = {
    North: { lat: 28.7, lng: 77.1 },
    South: { lat: 12.97, lng: 77.59 },
    East: { lat: 22.57, lng: 88.36 },
    West: { lat: 19.07, lng: 72.87 }
  };
  const base = coords[territory as keyof typeof coords];
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.5,
    lng: base.lng + (Math.random() - 0.5) * 0.5
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reset = false } = await req.json().catch(() => ({}));

    console.log('[Seed Demo Data] Starting data generation...');
    const results = {
      users: 0,
      contacts: 0,
      visits: 0,
      photos: 0,
      forms: 0,
      communications: 0
    };

    // Clear existing demo data if reset requested
    if (reset) {
      console.log('[Seed Demo Data] Clearing existing demo data...');
      // Note: In production, you'd want to mark demo data with a flag and delete only that
    }

    // Create 20 team members
    const roleDistribution = [
      { role: 'super_admin', count: 1, territory: 'North' },
      { role: 'admin', count: 2, territory: 'South' },
      { role: 'manager', count: 3, territory: 'East' },
      { role: 'field_agent', count: 14, territory: null }
    ];

    const createdUsers: any[] = [];

    for (const roleGroup of roleDistribution) {
      for (let i = 0; i < roleGroup.count; i++) {
        const firstName = randomFrom(firstNames);
        const lastName = randomFrom(lastNames);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@demo.com`;
        const territory = roleGroup.territory || randomFrom(territories);

        try {
          // Create auth user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Demo@123',
            email_confirm: true,
            user_metadata: {
              full_name: `${firstName} ${lastName}`
            }
          });

          if (createError) {
            console.error(`[Seed] Error creating user ${email}:`, createError.message);
            continue;
          }

          // Update profile
          await supabaseAdmin
            .from('profiles')
            .update({
              full_name: `${firstName} ${lastName}`,
              phone: randomPhone(),
              crm_user_id: `CRM${randomInt(1000, 9999)}`
            })
            .eq('id', newUser.user!.id);

          // Assign role
          await supabaseAdmin
            .from('user_roles')
            .update({ role: roleGroup.role })
            .eq('user_id', newUser.user!.id);

          createdUsers.push({
            id: newUser.user!.id,
            email,
            name: `${firstName} ${lastName}`,
            role: roleGroup.role,
            territory
          });

          results.users++;
          console.log(`[Seed] Created ${roleGroup.role}: ${firstName} ${lastName}`);
        } catch (error) {
          console.error(`[Seed] Error creating user:`, error);
        }
      }
    }

    // Generate dummy data for IndexedDB (to be synced)
    const demoData = {
      contacts: [] as any[],
      visits: [] as any[],
      photos: [] as any[],
      forms: [] as any[],
      communications: [] as any[]
    };

    // Create 100 contacts
    for (let i = 0; i < 100; i++) {
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);
      const territory = randomFrom(territories);
      const city = randomFrom(cities[territory as keyof typeof cities]);
      const gps = generateGPS(territory);

      demoData.contacts.push({
        id: crypto.randomUUID(),
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@customer.com`,
        phone: randomPhone(),
        address: `${randomInt(1, 999)} MG Road, ${city}`,
        city,
        territory,
        status: randomFrom(customerStatuses),
        tags: [randomFrom(tags)],
        latitude: gps.lat,
        longitude: gps.lng,
        notes: `Demo customer from ${city}`,
        lastVisit: randomDate(60),
        createdAt: randomDate(180),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
        crmCustomerId: `CRM-CUST-${randomInt(10000, 99999)}`
      });
      results.contacts++;
    }

    // Create 300 visits (distributed among field agents)
    const fieldAgents = createdUsers.filter(u => u.role === 'field_agent' || u.role === 'manager');

    for (let i = 0; i < 300; i++) {
      const agent = randomFrom(fieldAgents);
      const contact = randomFrom(demoData.contacts);
      const checkInDate = randomDate(30);
      const checkInTime = new Date(checkInDate);
      const duration = randomInt(15, 120);
      const checkOutTime = new Date(checkInTime.getTime() + duration * 60000);
      const isCompleted = Math.random() > 0.25; // 75% completed

      const visit = {
        id: crypto.randomUUID(),
        userId: agent.id,
        customerId: contact.id,
        customerName: contact.name,
        purpose: randomFrom(visitPurposes),
        notes: `${randomFrom(visitPurposes)} completed successfully`,
        checkInTime: checkInDate,
        checkInLatitude: contact.latitude + (Math.random() - 0.5) * 0.01,
        checkInLongitude: contact.longitude + (Math.random() - 0.5) * 0.01,
        checkOutTime: isCompleted ? checkOutTime.toISOString() : null,
        checkOutLatitude: isCompleted ? contact.latitude + (Math.random() - 0.5) * 0.01 : null,
        checkOutLongitude: isCompleted ? contact.longitude + (Math.random() - 0.5) * 0.01 : null,
        duration: isCompleted ? duration : null,
        status: isCompleted ? 'completed' : (Math.random() > 0.8 ? 'cancelled' : 'in_progress'),
        createdAt: checkInDate,
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced'
      };

      demoData.visits.push(visit);
      results.visits++;

      // Add photos to some visits (60% of completed visits)
      if (isCompleted && Math.random() > 0.4) {
        const photoCount = randomInt(1, 3);
        for (let p = 0; p < photoCount; p++) {
          demoData.photos.push({
            id: crypto.randomUUID(),
            visitId: visit.id,
            uri: `https://picsum.photos/seed/${crypto.randomUUID()}/800/600`,
            caption: randomFrom(['Store front', 'Product display', 'Signage', 'Interior', 'Customer meeting']),
            latitude: visit.checkInLatitude,
            longitude: visit.checkInLongitude,
            timestamp: checkInDate,
            syncStatus: 'synced'
          });
          results.photos++;
        }
      }

      // Add communications
      const commCount = randomInt(1, 2);
      for (let c = 0; c < commCount; c++) {
        demoData.communications.push({
          id: crypto.randomUUID(),
          customerId: contact.id,
          visitId: Math.random() > 0.5 ? visit.id : null,
          type: randomFrom(['call', 'whatsapp', 'sms', 'email']),
          notes: `Follow-up discussion about ${randomFrom(visitPurposes).toLowerCase()}`,
          timestamp: randomDate(30),
          syncStatus: 'synced'
        });
        results.communications++;
      }
    }

    console.log('[Seed Demo Data] Data generation complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo data generated successfully',
        results,
        users: createdUsers.map(u => ({ email: u.email, password: 'Demo@123', role: u.role })),
        note: 'IndexedDB data structure provided. Import contacts/visits manually or via sync.',
        demoData // Return this for client-side IndexedDB population
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Seed Demo Data] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});