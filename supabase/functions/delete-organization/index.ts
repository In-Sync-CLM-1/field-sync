import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is a platform_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check platform_admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Forbidden: platform_admin role required");

    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id is required");

    // Prevent deleting org if the caller belongs to it
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (callerProfile?.organization_id === organization_id) {
      throw new Error("Cannot delete your own organization");
    }

    // Delete related data in order (respecting foreign keys)
    // 1. Plan enrollments (references daily_plans and leads)
    await supabaseAdmin.from("plan_enrollments").delete().eq("organization_id", organization_id);
    
    // 2. Visits (references leads/customers)
    await supabaseAdmin.from("visits").delete().eq("organization_id", organization_id);
    
    // 3. Daily plans
    await supabaseAdmin.from("daily_plans").delete().eq("organization_id", organization_id);
    
    // 4. Leads
    await supabaseAdmin.from("leads").delete().eq("organization_id", organization_id);
    
    // 5. Customers
    await supabaseAdmin.from("customers").delete().eq("organization_id", organization_id);
    
    // 6. Agent locations
    await supabaseAdmin.from("agent_locations").delete().eq("organization_id", organization_id);
    
    // 7. Monthly incentive targets
    await supabaseAdmin.from("monthly_incentive_targets").delete().eq("organization_id", organization_id);
    
    // 8. Form templates, dispositions, sub_dispositions
    await supabaseAdmin.from("sub_dispositions").delete().eq("organization_id", organization_id);
    await supabaseAdmin.from("dispositions").delete().eq("organization_id", organization_id);
    await supabaseAdmin.from("form_templates").delete().eq("organization_id", organization_id);
    
    // 9. Branches
    await supabaseAdmin.from("branches").delete().eq("organization_id", organization_id);
    
    // 10. Invoices & payment transactions
    await supabaseAdmin.from("payment_transactions").delete().eq("organization_id", organization_id);
    await supabaseAdmin.from("invoices").delete().eq("organization_id", organization_id);
    
    // 11. User sessions for org users
    const { data: orgProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("organization_id", organization_id);

    if (orgProfiles && orgProfiles.length > 0) {
      const userIds = orgProfiles.map(p => p.id);
      
      // Delete user sessions
      await supabaseAdmin.from("user_sessions").delete().in("user_id", userIds);
      
      // Delete user roles
      await supabaseAdmin.from("user_roles").delete().in("user_id", userIds);
      
      // Delete auth users (this cascades to profiles via trigger)
      for (const uid of userIds) {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      }
    }
    
    // 12. Finally delete the organization
    const { error: deleteError } = await supabaseAdmin
      .from("organizations")
      .delete()
      .eq("id", organization_id);

    if (deleteError) {
      console.error("Failed to delete organization:", deleteError);
      throw new Error(`Failed to delete organization: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Organization deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in delete-organization:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes("Forbidden") ? 403 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
