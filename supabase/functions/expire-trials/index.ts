import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting trial expiration check...')

    // Find all organizations with expired trials
    const { data: expiredOrgs, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, trial_ends_at')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired trials:', fetchError)
      throw fetchError
    }

    if (!expiredOrgs || expiredOrgs.length === 0) {
      console.log('No expired trials found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired trials found',
          expired_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiredOrgs.length} organizations with expired trials`)

    // Update all expired organizations
    const orgIds = expiredOrgs.map(org => org.id)
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ 
        subscription_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .in('id', orgIds)

    if (updateError) {
      console.error('Error updating organizations:', updateError)
      throw updateError
    }

    // Log each expired organization
    expiredOrgs.forEach(org => {
      console.log(`Expired trial for organization: ${org.name} (${org.id})`)
    })

    console.log(`Successfully expired ${expiredOrgs.length} organization trials`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Expired ${expiredOrgs.length} organization trials`,
        expired_count: expiredOrgs.length,
        organizations: expiredOrgs.map(org => ({ id: org.id, name: org.name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Trial expiration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
