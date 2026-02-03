import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the caller's user info
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !callerUser) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if caller has admin, super_admin, or platform_admin role
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'admin'
    })

    const { data: isSuperAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'super_admin'
    })

    const { data: isPlatformAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'platform_admin'
    })

    if (!isAdmin && !isSuperAdmin && !isPlatformAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, fullName, phone, role, organizationId } = await req.json()

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, fullName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating user: ${email} with role: ${role}`)

    // Create user using admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError) {
      console.error('Create user error:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created: ${newUser.user.id}`)

    // Update profile with phone and organization
    const profileUpdate: Record<string, unknown> = {}
    if (phone) profileUpdate.phone = phone
    if (organizationId) profileUpdate.organization_id = organizationId

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', newUser.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Don't fail the whole operation, just log it
      }
    }

    // Add role to user_roles table (use upsert to handle case where role already exists)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: newUser.user.id, role },
        { onConflict: 'user_id,role' }
      )

    if (roleError) {
      console.error('Role insert error:', roleError)
      return new Response(
        JSON.stringify({ error: `User created but failed to assign role: ${roleError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${email} created successfully with role ${role}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
