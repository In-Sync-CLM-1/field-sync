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
    const { organization_id, branch_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Get current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch all data in parallel
    const [branchesRes, profilesRes, plansRes, visitsRes, attendanceRes] = await Promise.all([
      supabase.from('branches').select('id, name, city').eq('organization_id', organization_id),
      supabase.from('profiles').select('id, full_name, branch_id').eq('organization_id', organization_id).eq('is_active', true),
      supabase.from('daily_plans').select('user_id, plan_date, policies_target, policies_actual, prospects_target, prospects_actual, quotes_target, quotes_actual').eq('organization_id', organization_id).gte('plan_date', monthStart).lte('plan_date', monthEnd),
      supabase.from('visits').select('id, user_id, status, check_in_time, check_out_time').eq('organization_id', organization_id).gte('check_in_time', `${monthStart}T00:00:00`).lte('check_in_time', `${monthEnd}T23:59:59`),
      supabase.from('attendance').select('id, user_id, date, total_hours').eq('organization_id', organization_id).gte('date', monthStart).lte('date', monthEnd),
    ]);

    const branches = branchesRes.data || [];
    const profiles = profilesRes.data || [];
    const plans = plansRes.data || [];
    const visits = visitsRes.data || [];
    const attendance = attendanceRes.data || [];

    // Build summary per branch
    const branchSummaries = branches.map(branch => {
      const branchUsers = profiles.filter(p => p.branch_id === branch.id);
      const branchUserIds = new Set(branchUsers.map(u => u.id));
      const branchPlans = plans.filter(p => branchUserIds.has(p.user_id));
      const branchVisits = visits.filter(v => branchUserIds.has(v.user_id));
      const branchAtt = attendance.filter(a => branchUserIds.has(a.user_id));

      const salesTarget = branchPlans.reduce((s, p) => s + (p.policies_target || 0), 0);
      const salesActual = branchPlans.reduce((s, p) => s + (p.policies_actual || 0), 0);
      const prospectsTarget = branchPlans.reduce((s, p) => s + (p.prospects_target || 0), 0);
      const prospectsActual = branchPlans.reduce((s, p) => s + (p.prospects_actual || 0), 0);
      const completedVisits = branchVisits.filter(v => v.status === 'completed').length;
      const totalVisits = branchVisits.length;
      const uniqueAttDays = new Set(branchAtt.map(a => `${a.user_id}-${a.date}`)).size;

      // Per-employee breakdown
      const employeeBreakdown = branchUsers.map(u => {
        const uPlans = branchPlans.filter(p => p.user_id === u.id);
        const uVisits = branchVisits.filter(v => v.user_id === u.id);
        const uAtt = branchAtt.filter(a => a.user_id === u.id);
        return {
          name: u.full_name,
          salesTarget: uPlans.reduce((s, p) => s + (p.policies_target || 0), 0),
          salesActual: uPlans.reduce((s, p) => s + (p.policies_actual || 0), 0),
          visits: uVisits.length,
          completedVisits: uVisits.filter(v => v.status === 'completed').length,
          attendanceDays: new Set(uAtt.map(a => a.date)).size,
        };
      });

      return {
        branch: branch.name,
        city: branch.city,
        agents: branchUsers.length,
        salesTarget,
        salesActual,
        salesAchievement: salesTarget > 0 ? Math.round((salesActual / salesTarget) * 100) : 0,
        prospectsTarget,
        prospectsActual,
        totalVisits,
        completedVisits,
        visitCompletionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
        attendanceDays: uniqueAttDays,
        employees: employeeBreakdown,
      };
    });

    // Day-of-week analysis
    const dayVisits: Record<string, number> = {};
    visits.forEach(v => {
      const day = new Date(v.check_in_time).toLocaleDateString('en-US', { weekday: 'long' });
      dayVisits[day] = (dayVisits[day] || 0) + 1;
    });

    const dataSummary = JSON.stringify({
      period: `${monthStart} to ${monthEnd}`,
      totalAgents: profiles.length,
      branchSummaries,
      dayOfWeekVisits: dayVisits,
    });

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a sales performance analyst for a field force management application. Analyze the provided performance data and return exactly 5-7 key insights as JSON. Each insight should have: title (short), description (1-2 sentences), type ("positive", "warning", or "action"), and recommendation (1 sentence actionable advice). Focus on: top/bottom performers, attendance vs sales correlation, branch comparisons, trend anomalies, day-of-week patterns, and improvement opportunities. Be specific with numbers and percentages. Return ONLY valid JSON array.`
          },
          {
            role: 'user',
            content: `Analyze this performance data and return insights as a JSON array:\n\n${dataSummary}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_insights',
              description: 'Return performance insights',
              parameters: {
                type: 'object',
                properties: {
                  insights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string', enum: ['positive', 'warning', 'action'] },
                        recommendation: { type: 'string' },
                      },
                      required: ['title', 'description', 'type', 'recommendation'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['insights'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_insights' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let insights = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Performance insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
