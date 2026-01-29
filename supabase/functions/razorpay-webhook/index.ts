import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

interface RazorpayEvent {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        notes?: Record<string, string>;
      };
    };
    subscription?: {
      entity: {
        id: string;
        plan_id: string;
        customer_id: string;
        status: string;
        current_start: number;
        current_end: number;
        notes?: Record<string, string>;
      };
    };
  };
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: RazorpayEvent = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment?.entity;
        if (!payment) break;

        const organizationId = payment.notes?.organization_id;
        if (!organizationId) {
          console.error('Missing organization_id in payment notes');
          break;
        }

        // Record the transaction
        await supabase.from('payment_transactions').insert({
          organization_id: organizationId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100, // Razorpay amounts are in paise
          currency: payment.currency,
          status: 'captured',
          payment_method: payment.method,
        });

        console.log(`Payment captured for org ${organizationId}: ${payment.id}`);
        break;
      }

      case 'subscription.activated': {
        const subscription = event.payload.subscription?.entity;
        if (!subscription) break;

        const organizationId = subscription.notes?.organization_id;
        if (!organizationId) {
          console.error('Missing organization_id in subscription notes');
          break;
        }

        // Update organization subscription status
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'active',
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id,
          })
          .eq('id', organizationId);

        console.log(`Subscription activated for org ${organizationId}: ${subscription.id}`);
        break;
      }

      case 'subscription.charged': {
        const subscription = event.payload.subscription?.entity;
        const payment = event.payload.payment?.entity;
        if (!subscription || !payment) break;

        const organizationId = subscription.notes?.organization_id;
        if (!organizationId) {
          console.error('Missing organization_id in subscription notes');
          break;
        }

        // Record the payment transaction
        await supabase.from('payment_transactions').insert({
          organization_id: organizationId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: 'captured',
          payment_method: payment.method,
        });

        // Generate invoice
        const startDate = new Date(subscription.current_start * 1000);
        const endDate = new Date(subscription.current_end * 1000);
        const invoiceNumber = `INV-${organizationId.slice(0, 8).toUpperCase()}-${Date.now()}`;

        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            organization_id: organizationId,
            invoice_number: invoiceNumber,
            amount: payment.amount / 100,
            tax_amount: 0,
            total_amount: payment.amount / 100,
            status: 'paid',
            billing_period_start: startDate.toISOString().split('T')[0],
            billing_period_end: endDate.toISOString().split('T')[0],
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Link invoice to transaction
        if (invoice) {
          await supabase
            .from('payment_transactions')
            .update({ invoice_id: invoice.id })
            .eq('razorpay_payment_id', payment.id);
        }

        console.log(`Subscription charged for org ${organizationId}, invoice: ${invoiceNumber}`);
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment?.entity;
        if (!payment) break;

        const organizationId = payment.notes?.organization_id;
        if (!organizationId) {
          console.error('Missing organization_id in payment notes');
          break;
        }

        // Record failed transaction
        await supabase.from('payment_transactions').insert({
          organization_id: organizationId,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: 'failed',
          payment_method: payment.method,
        });

        // Update organization to past_due status
        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('id', organizationId);

        console.log(`Payment failed for org ${organizationId}: ${payment.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
