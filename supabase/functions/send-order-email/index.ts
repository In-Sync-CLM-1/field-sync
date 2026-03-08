import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildSalesOrderHtml(data: any, agentName: string, orgName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #0f172a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New Sales Order</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">${orgName}</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Submitted By</td>
            <td style="padding: 8px 0; font-weight: 600;">${agentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Customer Name</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.customer_name || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Customer Phone</td>
            <td style="padding: 8px 0;">${data.customer_phone || "—"}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #e2e8f0; padding: 4px 0;"></td></tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Product / Service</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.product_name || "—"}</td>
          </tr>
          ${data.product_description ? `<tr>
            <td style="padding: 8px 0; color: #64748b;">Description</td>
            <td style="padding: 8px 0;">${data.product_description}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Quantity</td>
            <td style="padding: 8px 0;">${data.quantity || 1}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Unit Price</td>
            <td style="padding: 8px 0;">${formatCurrency(data.unit_price || 0)}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #e2e8f0; padding: 4px 0;"></td></tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Total Amount</td>
            <td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #059669;">${formatCurrency(data.total_amount || 0)}</td>
          </tr>
          ${data.remarks ? `<tr>
            <td style="padding: 8px 0; color: #64748b;">Remarks</td>
            <td style="padding: 8px 0;">${data.remarks}</td>
          </tr>` : ""}
        </table>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          Submitted on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>
      </div>
    </div>
  `;
}

function buildPaymentCollectionHtml(data: any, agentName: string, orgName: string): string {
  const modeLabels: Record<string, string> = {
    cash: "Cash",
    cheque: "Cheque",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    online: "Online",
    other: "Other",
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #0f172a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Payment Collection</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">${orgName}</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Collected By</td>
            <td style="padding: 8px 0; font-weight: 600;">${agentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Customer Name</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.customer_name || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Customer Phone</td>
            <td style="padding: 8px 0;">${data.customer_phone || "—"}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #e2e8f0; padding: 4px 0;"></td></tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Amount Collected</td>
            <td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #059669;">${formatCurrency(data.total_amount || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Payment Mode</td>
            <td style="padding: 8px 0; font-weight: 600;">${modeLabels[data.payment_mode] || data.payment_mode || "—"}</td>
          </tr>
          ${data.payment_reference ? `<tr>
            <td style="padding: 8px 0; color: #64748b;">Reference No.</td>
            <td style="padding: 8px 0; font-family: monospace;">${data.payment_reference}</td>
          </tr>` : ""}
          ${data.remarks ? `<tr>
            <td style="padding: 8px 0; color: #64748b;">Remarks</td>
            <td style="padding: 8px 0;">${data.remarks}</td>
          </tr>` : ""}
        </table>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          Submitted on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>
      </div>
    </div>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_collection_id } = await req.json();

    if (!order_collection_id) {
      throw new Error("order_collection_id is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the order/collection record
    const { data: record, error: fetchErr } = await supabase
      .from("order_collections")
      .select("*")
      .eq("id", order_collection_id)
      .single();

    if (fetchErr || !record) {
      throw new Error("Order/collection record not found");
    }

    // Fetch organization details and notification email
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("name, settings")
      .eq("id", record.organization_id)
      .single();

    if (orgErr || !org) {
      throw new Error("Organization not found");
    }

    const notificationEmail = org.settings?.notification_email;
    if (!notificationEmail) {
      console.log("No notification email configured, skipping email send");
      return new Response(
        JSON.stringify({ success: false, message: "No notification email configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch agent name
    const { data: agent } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.user_id)
      .single();

    const agentName = agent?.full_name || "Field Agent";
    const orgName = org.name || "Organization";

    // Build email
    const isSalesOrder = record.type === "sales_order";
    const subject = isSalesOrder
      ? `Sales Order: ${record.product_name || "New Order"} — ${record.customer_name || "Customer"}`
      : `Payment Collected: ${formatCurrency(record.total_amount)} — ${record.customer_name || "Customer"}`;

    const html = isSalesOrder
      ? buildSalesOrderHtml(record, agentName, orgName)
      : buildPaymentCollectionHtml(record, agentName, orgName);

    // Send email via Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const emailResponse = await resend.emails.send({
      from: "InSync <noreply@in-sync.co.in>",
      to: [notificationEmail],
      subject,
      html,
    });

    console.log("Order email sent:", emailResponse);

    // Mark record as email sent
    await supabase
      .from("order_collections")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", order_collection_id);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-order-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
