// Field-Sync unified notification dispatcher.
// One entry point for every manager/admin alert — fans out to BOTH email (Resend)
// and WhatsApp (Exotel approved templates), to the org's configured contacts.
//   POST { event, organization_id, params: {...} }
// WhatsApp sends are best-effort: if a template isn't approved yet, email still goes.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inr = (n: number | string) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n) || 0);

// The full notification taxonomy. Each event maps to an email (title + rows) and a
// WhatsApp template (name + ordered params). Keep param order in sync with the
// approved fieldsync_*_v1 templates.
type Ev = {
  emailTitle: string;
  emoji: string;
  rows: (p: any) => [string, string][];
  waTemplate: string;
  waParams: (p: any, org: string) => string[];
};

const EVENTS: Record<string, Ev> = {
  new_order: {
    emailTitle: "New Sales Order", emoji: "🛒",
    rows: (p) => [["Agent", p.agent], ["Customer", p.customer], ["Product", p.product],
      ["Quantity", String(p.quantity ?? 1)], ["Amount", `₹${inr(p.amount)}`]],
    waTemplate: "fieldsync_new_order_v1",
    waParams: (p, org) => [org, p.agent, p.customer, p.product, inr(p.amount)],
  },
  payment_collected: {
    emailTitle: "Payment Collected", emoji: "💰",
    rows: (p) => [["Agent", p.agent], ["Customer", p.customer], ["Amount", `₹${inr(p.amount)}`],
      ["Payment Mode", p.mode || "—"], ["Reference", p.reference || "—"]],
    waTemplate: "fieldsync_payment_collected_v1",
    waParams: (p, org) => [org, p.agent, p.customer, inr(p.amount), p.mode || "—"],
  },
  visit_checkin: {
    emailTitle: "Visit Check-in", emoji: "📍",
    rows: (p) => [["Agent", p.agent], ["Customer", p.customer], ["Purpose", p.purpose || "—"], ["Time", p.time]],
    waTemplate: "fieldsync_visit_checkin_v1",
    waParams: (p, org) => [org, p.agent, p.customer, p.purpose || "Field visit", p.time],
  },
  visit_completed: {
    emailTitle: "Visit Completed", emoji: "✅",
    rows: (p) => [["Agent", p.agent], ["Customer", p.customer], ["Duration", p.duration]],
    waTemplate: "fieldsync_visit_completed_v1",
    waParams: (p, org) => [org, p.agent, p.customer, p.duration],
  },
  visit_missed: {
    emailTitle: "Visit Missed", emoji: "⚠️",
    rows: (p) => [["Agent", p.agent], ["Customer", p.customer], ["Reason", p.reason || "—"]],
    waTemplate: "fieldsync_visit_missed_v1",
    waParams: (p, org) => [org, p.agent, p.customer, p.reason || "Not specified"],
  },
  new_customer: {
    emailTitle: "New Customer Added", emoji: "👤",
    rows: (p) => [["Added by", p.agent], ["Customer", p.customer], ["Location", p.location || "—"]],
    waTemplate: "fieldsync_new_customer_v1",
    waParams: (p, org) => [org, p.agent, p.customer, p.location || "—"],
  },
  attendance_punchin: {
    emailTitle: "Day Started", emoji: "🟢",
    rows: (p) => [["Agent", p.agent], ["Punched in", p.time]],
    waTemplate: "fieldsync_attendance_punchin_v1",
    waParams: (p, org) => [org, p.agent, p.time],
  },
  day_summary: {
    emailTitle: "End-of-Day Summary", emoji: "📊",
    rows: (p) => [["Agent", p.agent], ["Visits", String(p.visits ?? 0)],
      ["Orders", String(p.orders ?? 0)], ["Collected", `₹${inr(p.collected)}`]],
    waTemplate: "fieldsync_day_summary_v1",
    waParams: (p, org) => [org, p.agent, String(p.visits ?? 0), String(p.orders ?? 0), inr(p.collected)],
  },
};

function emailHtml(ev: Ev, org: string, p: any): string {
  const rows = ev.rows(p).map(([k, v]) => `
    <tr><td style="padding:8px 0;color:#64748b;width:150px;">${k}</td>
        <td style="padding:8px 0;font-weight:600;color:#0f172a;">${v}</td></tr>`).join("");
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0d9488;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;font-size:20px;">${ev.emoji} ${ev.emailTitle}</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.9;">${org}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
        ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · Field-Sync by In-Sync
      </p>
    </div>
  </div>`;
}

async function sendWhatsApp(toPhone: string, template: string, params: string[]): Promise<string> {
  const key = Deno.env.get("EXOTEL_API_KEY"), token = Deno.env.get("EXOTEL_API_TOKEN");
  const sid = Deno.env.get("EXOTEL_SID"), subdomain = Deno.env.get("EXOTEL_SUBDOMAIN");
  const from = (Deno.env.get("WHATSAPP_FROM_NUMBER") || "").replace(/^\+/, "");
  if (!key || !token || !sid || !subdomain || !from) return "wa-not-configured";
  const payload = {
    whatsapp: { messages: [{
      from, to: toPhone.replace(/^\+/, ""),
      content: { type: "template", template: {
        name: template, language: { code: "en" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      } },
    }] },
  };
  const auth = btoa(`${key}:${token}`);
  const r = await fetch(`https://${subdomain}/v2/accounts/${sid}/messages`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify(payload),
  });
  const t = await r.text();
  return r.ok ? "sent" : `wa-failed:${r.status}:${t.slice(0, 120)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { event, organization_id, params } = await req.json();
    const ev = EVENTS[event];
    if (!ev) throw new Error(`Unknown event: ${event}`);
    if (!organization_id) throw new Error("organization_id is required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: org } = await supabase.from("organizations").select("name, settings").eq("id", organization_id).single();
    if (!org) throw new Error("Organization not found");
    const orgName = org.name || "Your Organization";
    const toEmail = org.settings?.notification_email;
    const toWhatsApp = org.settings?.notification_whatsapp;

    const result: Record<string, string> = {};

    // Email
    if (toEmail) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        await resend.emails.send({
          from: "Field-Sync <noreply@in-sync.co.in>",
          to: [toEmail],
          subject: `${ev.emoji} ${ev.emailTitle} — ${params.customer || params.agent || orgName}`,
          html: emailHtml(ev, orgName, params),
        });
        result.email = "sent";
      } catch (e) { result.email = `email-failed:${(e as Error).message}`; }
    } else result.email = "no-email-configured";

    // WhatsApp (best-effort; depends on template approval)
    if (toWhatsApp) {
      result.whatsapp = await sendWhatsApp(toWhatsApp, ev.waTemplate, ev.waParams(params, orgName)).catch(
        (e) => `wa-error:${(e as Error).message}`);
    } else result.whatsapp = "no-whatsapp-configured";

    return new Response(JSON.stringify({ success: true, event, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("notify-event error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
