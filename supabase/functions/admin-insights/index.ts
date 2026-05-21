import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');

    // Date ranges
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = `${todayStr}T00:00:00`;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    // Fetch data in parallel
    const [profilesRes, attendanceRes, visitsRes, ordersRes, collectionsRes, leadsRes, attendanceWeekRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('organization_id', organization_id).eq('is_active', true),
      supabase.from('attendance').select('user_id, date, punch_in_time, punch_out_time, total_hours').eq('organization_id', organization_id).gte('date', thirtyDaysAgo.split('T')[0]),
      supabase.from('visits').select('id, user_id, status, check_in_time, check_out_time, purpose').eq('organization_id', organization_id).gte('check_in_time', thirtyDaysAgo),
      supabase.from('orders').select('id, user_id, total_amount, created_at').eq('organization_id', organization_id).gte('created_at', thirtyDaysAgo),
      supabase.from('collections').select('id, user_id, amount, created_at').eq('organization_id', organization_id).gte('created_at', thirtyDaysAgo),
      supabase.from('leads').select('id, status, assigned_user_id, created_at').eq('organization_id', organization_id),
      supabase.from('attendance').select('user_id, date, total_hours').eq('organization_id', organization_id).gte('date', sevenDaysAgo.split('T')[0]),
    ]);

    const profiles = profilesRes.data || [];
    const attendance = attendanceRes.data || [];
    const visits = visitsRes.data || [];
    const orders = ordersRes.data || [];
    const collections = collectionsRes.data || [];
    const leads = leadsRes.data || [];
    const attendanceWeek = attendanceWeekRes.data || [];

    const profileMap = new Map(profiles.map(p => [p.id, p.full_name || 'Unknown']));

    // Build per-agent performance
    const agentPerformance = profiles.map(p => {
      const agentVisits = visits.filter(v => v.user_id === p.id);
      const agentOrders = orders.filter(o => o.user_id === p.id);
      const agentCollections = collections.filter(c => c.user_id === p.id);
      const agentAttendance = attendance.filter(a => a.user_id === p.id);
      const weekAttendance = attendanceWeek.filter(a => a.user_id === p.id);

      const completedVisits = agentVisits.filter(v => v.status === 'completed').length;
      const avgHours = weekAttendance.length > 0
        ? (weekAttendance.reduce((s, a) => s + (a.total_hours || 0), 0) / weekAttendance.length).toFixed(1)
        : '0';

      return {
        name: p.full_name,
        visits30d: agentVisits.length,
        completedVisits,
        visitCompletionRate: agentVisits.length > 0 ? Math.round((completedVisits / agentVisits.length) * 100) : 0,
        orders: agentOrders.length,
        orderValue: agentOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
        collections: agentCollections.reduce((s, c) => s + (c.amount || 0), 0),
        attendanceDays30d: new Set(agentAttendance.map(a => a.date)).size,
        avgDailyHoursThisWeek: avgHours,
      };
    });

    // Aggregate stats
    const todayVisits = visits.filter(v => v.check_in_time >= todayStart).length;
    const todayOrders = orders.filter(o => o.created_at >= todayStart);
    const weekVisits = visits.filter(v => v.check_in_time >= sevenDaysAgo).length;
    const totalOrderValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const totalCollections = collections.reduce((s, c) => s + (c.amount || 0), 0);
    const activeLeads = leads.filter(l => l.status === 'active' || l.status === 'new').length;

    // Day-of-week patterns
    const dayVisits: Record<string, number> = {};
    visits.forEach(v => {
      const day = new Date(v.check_in_time).toLocaleDateString('en-US', { weekday: 'long' });
      dayVisits[day] = (dayVisits[day] || 0) + 1;
    });

    const dataSummary = JSON.stringify({
      period: '30 days',
      today: todayStr,
      teamSize: profiles.length,
      todayVisits,
      todayOrders: todayOrders.length,
      todayOrderValue: todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      weekVisits,
      totalVisits30d: visits.length,
      totalOrders30d: orders.length,
      totalOrderValue30d: totalOrderValue,
      totalCollections30d: totalCollections,
      collectionRate: totalOrderValue > 0 ? Math.round((totalCollections / totalOrderValue) * 100) : 0,
      totalLeads: leads.length,
      activeLeads,
      dayOfWeekVisits: dayVisits,
      agentPerformance,
    });

    // Call Anthropic Haiku
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `You are a field force performance analyst. Analyze this team performance data and return exactly 5-7 key insights as a JSON array.

Each insight must have these fields:
- "title": short headline (5-8 words)
- "description": 1-2 sentence analysis with specific numbers
- "type": one of "positive", "warning", or "action"
- "recommendation": 1 sentence actionable advice

Focus on: top/bottom performers, attendance-sales correlation, visit efficiency, order conversion, collection rates, day-of-week patterns, and growth opportunities.

Be specific with numbers, percentages, and agent names. Return ONLY the JSON array, no other text.

Data:
${dataSummary}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text || '[]';

    let insights = [];
    try {
      // Extract JSON array from response (handle markdown wrapping)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e, content);
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
