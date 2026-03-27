import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  organization_id: string;
  email: string;
  name: string;
}

interface RazorpayCustomer {
  id: string;
  email: string;
  name: string;
}

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id: string;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { organization_id, email, name }: RequestBody = await req.json();

    if (!organization_id || !email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organization_id, email, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating subscription for organization: ${organization_id}`);

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, user_count, razorpay_customer_id, current_plan_id')
      .eq('id', organization_id)
      .single();

    if (orgError || !organization) {
      console.error('Organization fetch error:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch subscription plan with razorpay_plan_id
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, razorpay_plan_id, price_per_user')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (planError || !plan) {
      console.error('Plan fetch error:', planError);
      return new Response(
        JSON.stringify({ error: 'No active subscription plan found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan.razorpay_plan_id) {
      return new Response(
        JSON.stringify({ error: 'Razorpay plan not configured. Please contact support.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base64 encode credentials for Razorpay API
    const authHeader = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayHeaders = {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    };

    let customerId = organization.razorpay_customer_id;

    // Create Razorpay customer if not exists
    if (!customerId) {
      console.log('Creating new Razorpay customer...');
      
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: razorpayHeaders,
        body: JSON.stringify({
          name: name,
          email: email,
          notes: {
            organization_id: organization_id,
          },
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error('Razorpay customer creation failed:', errorData);
        return new Response(
          JSON.stringify({ error: 'Failed to create customer with payment provider' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const customer: RazorpayCustomer = await customerResponse.json();
      customerId = customer.id;

      // Update organization with razorpay_customer_id
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ razorpay_customer_id: customerId })
        .eq('id', organization_id);

      if (updateError) {
        console.error('Failed to update organization with customer ID:', updateError);
      }
    }

    // Calculate quantity (minimum 1)
    const quantity = Math.max(1, organization.user_count || 1);

    console.log(`Creating subscription with plan: ${plan.razorpay_plan_id}, quantity: ${quantity}`);

    // Create Razorpay subscription
    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: razorpayHeaders,
      body: JSON.stringify({
        plan_id: plan.razorpay_plan_id,
        customer_id: customerId,
        quantity: quantity,
        total_count: 120, // Allow up to 10 years of monthly payments
        customer_notify: 1,
        notes: {
          organization_id: organization_id,
          organization_name: organization.name,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Razorpay subscription creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription with payment provider' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscription: RazorpaySubscription = await subscriptionResponse.json();

    console.log(`Subscription created successfully: ${subscription.id}`);

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        key_id: razorpayKeyId,
        organization_name: organization.name,
        user_count: quantity,
        price_per_user: plan.price_per_user,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
