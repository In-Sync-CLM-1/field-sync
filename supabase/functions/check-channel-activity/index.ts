// DSA & Channel Visit Tracking SOP §8: automated alerts + escalation.
// Runs daily (cron-worker). Scans every org that has at least one DSA, checks each of
// the SOP's 5 trigger scenarios, writes an audit row per finding, and emails the right
// recipient(s) for that escalation level. WhatsApp is not wired here -- the SOP's alert
// channels include it, but that needs a Meta-approved template per scenario, which is a
// business step (template submission + review), not something this run can do.
//
// Thresholds are defaults, not SOP-mandated numbers (the SOP says "a defined period"
// without naming it) -- tune the consts below once real usage data exists.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const LOW_VISIT_DAYS = 3;      // Level 1: no DSA-channel visit in this many days
const NO_VISIT_DAYS = 5;       // Level 2: escalate to reporting senior
const NO_VISIT_DAYS_CRITICAL = 10; // Level 3: escalate further + flag for review
const WINDOW_DAYS = 14;        // trailing window for "visits but no business" / conversion / inactive-channel
const MIN_VISITS_FOR_CONVERSION_CHECK = 5;
const LOW_CONVERSION_RATE = 0.10;

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

async function emailAlert(resend: Resend, to: string[], subject: string, message: string) {
  if (to.length === 0) return;
  try {
    await resend.emails.send({
      from: "Field-Sync <noreply@in-sync.co.in>",
      to,
      subject: `⚠️ ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <div style="background:#b91c1c;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:18px;">⚠️ ${subject}</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:20px;">
          <p style="font-size:14px;color:#0f172a;">${message}</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Field-Sync channel activity monitor</p>
        </div>
      </div>`,
    });
  } catch (e) {
    console.error("email failed:", (e as Error).message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400000).toISOString();

    const { data: orgsWithDsas } = await supabase.from("dsas").select("organization_id").eq("is_active", true);
    const orgIds = [...new Set((orgsWithDsas || []).map((r: any) => r.organization_id))];

    const summary: any[] = [];

    for (const orgId of orgIds) {
      const [{ data: profilesRaw }, { data: dsas }, { data: subDsas }] = await Promise.all([
        // profiles.email is masked (DPDP PII encryption) -- use the decrypted view so
        // escalation emails actually reach a real, deliverable address.
        supabase.from("profiles_decrypted").select("id, full_name, email_real, reporting_manager_id, is_active").eq("organization_id", orgId).eq("is_active", true),
        supabase.from("dsas").select("id, name, created_at").eq("organization_id", orgId).eq("is_active", true),
        supabase.from("sub_dsas").select("id, name, dsa_id, created_at").eq("organization_id", orgId).eq("is_active", true),
      ]);
      const profiles = (profilesRaw || []).map((p: any) => ({ ...p, email: p.email_real }));
      const profileById = new Map(profiles.map((p: any) => [p.id, p]));

      const { data: admin_roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "super_admin", "platform_admin"]);
      const orgAdminEmails = [...new Set(
        (admin_roles || [])
          .filter((r: any) => profileById.has(r.user_id))
          .map((r: any) => profileById.get(r.user_id)?.email)
          .filter((e: any): e is string => !!e)
      )];

      // ── recent DSA-tagged visits for this org (covers both the employee and inactive-channel checks) ──
      const { data: recentVisits } = await supabase
        .from("visits")
        .select("id, user_id, dsa_id, sub_dsa_id, check_in_time")
        .eq("organization_id", orgId)
        .not("dsa_id", "is", null)
        .gte("check_in_time", windowStart);
      const visits = recentVisits || [];

      const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, assigned_user_id, dsa_id, login_at, created_at")
        .eq("organization_id", orgId)
        .not("dsa_id", "is", null)
        .gte("created_at", windowStart);
      const leads = recentLeads || [];

      async function raise(
        scenario: string, level: number,
        opts: { employeeId?: string; dsaId?: string; subDsaId?: string; message: string; recipients: string[] },
      ) {
        let dedupeQuery = supabase
          .from("channel_activity_alerts")
          .select("id")
          .eq("organization_id", orgId)
          .eq("scenario", scenario)
          .eq("resolved", false);
        dedupeQuery = opts.employeeId ? dedupeQuery.eq("employee_id", opts.employeeId) : dedupeQuery.is("employee_id", null);
        dedupeQuery = opts.dsaId ? dedupeQuery.eq("dsa_id", opts.dsaId) : dedupeQuery.is("dsa_id", null);
        dedupeQuery = opts.subDsaId ? dedupeQuery.eq("sub_dsa_id", opts.subDsaId) : dedupeQuery.is("sub_dsa_id", null);
        const { data: open } = await dedupeQuery.maybeSingle();
        if (open) return; // already open, don't re-alert daily

        await supabase.from("channel_activity_alerts").insert({
          organization_id: orgId, scenario, level,
          employee_id: opts.employeeId || null, dsa_id: opts.dsaId || null, sub_dsa_id: opts.subDsaId || null,
          message: opts.message, notified_emails: opts.recipients, needs_review: level >= 3,
        });
        await emailAlert(resend, opts.recipients, `${scenario.replace(/_/g, " ")} (Level ${level})`, opts.message);
        summary.push({ orgId, scenario, level, employeeId: opts.employeeId, dsaId: opts.dsaId });
      }

      // ── Low / No visit activity, per employee who has ever done a DSA-channel visit ──
      const { data: everVisited } = await supabase
        .from("visits").select("user_id").eq("organization_id", orgId).not("dsa_id", "is", null);
      const channelEmployeeIds = [...new Set((everVisited || []).map((v: any) => v.user_id))];

      for (const empId of channelEmployeeIds) {
        const emp = profileById.get(empId);
        if (!emp) continue;
        const { data: last } = await supabase
          .from("visits").select("check_in_time").eq("organization_id", orgId).eq("user_id", empId)
          .not("dsa_id", "is", null).order("check_in_time", { ascending: false }).limit(1).maybeSingle();
        const gap = daysAgo(last?.check_in_time || null);
        if (gap == null) continue;

        if (gap >= NO_VISIT_DAYS_CRITICAL) {
          const manager = emp.reporting_manager_id ? profileById.get(emp.reporting_manager_id) : null;
          const grandManager = manager?.reporting_manager_id ? profileById.get(manager.reporting_manager_id) : null;
          const recipients = [emp.email, manager?.email, grandManager?.email].filter((e): e is string => !!e);
          if (recipients.length === 0) recipients.push(...orgAdminEmails);
          await raise("no_visit_activity", 3, {
            employeeId: empId,
            message: `${emp.full_name || "This employee"} has made no DSA/Sub-DSA visit in ${gap} days. Persistent non-compliance -- flagged for review.`,
            recipients,
          });
        } else if (gap >= NO_VISIT_DAYS) {
          const manager = emp.reporting_manager_id ? profileById.get(emp.reporting_manager_id) : null;
          const recipients = [emp.email, manager?.email].filter((e): e is string => !!e);
          await raise("no_visit_activity", 2, {
            employeeId: empId,
            message: `${emp.full_name || "This employee"} has made no DSA/Sub-DSA visit in ${gap} days.`,
            recipients,
          });
        } else if (gap >= LOW_VISIT_DAYS) {
          if (emp.email) {
            await raise("low_visit_activity", 1, {
              employeeId: empId,
              message: `${emp.full_name || "This employee"} hasn't made a DSA/Sub-DSA visit in ${gap} days.`,
              recipients: [emp.email],
            });
          }
        }
      }

      // ── Visits-but-no-business & high-visits-low-conversion, per employee, trailing window ──
      const visitCountByEmp = new Map<string, number>();
      visits.forEach((v: any) => visitCountByEmp.set(v.user_id, (visitCountByEmp.get(v.user_id) || 0) + 1));
      const loginCountByEmp = new Map<string, number>();
      leads.forEach((l: any) => { if (l.login_at && l.assigned_user_id) loginCountByEmp.set(l.assigned_user_id, (loginCountByEmp.get(l.assigned_user_id) || 0) + 1); });

      for (const [empId, visitCount] of visitCountByEmp) {
        if (visitCount < MIN_VISITS_FOR_CONVERSION_CHECK) continue;
        const emp = profileById.get(empId);
        if (!emp) continue;
        const logins = loginCountByEmp.get(empId) || 0;
        const rate = logins / visitCount;

        if (logins === 0) {
          const recipients = [emp.email].filter((e): e is string => !!e);
          await raise("visits_no_business", 1, {
            employeeId: empId,
            message: `${emp.full_name || "This employee"} made ${visitCount} DSA visits in the last ${WINDOW_DAYS} days with no resulting lead reaching Login.`,
            recipients,
          });
        } else if (rate < LOW_CONVERSION_RATE) {
          const manager = emp.reporting_manager_id ? profileById.get(emp.reporting_manager_id) : null;
          const recipients = [emp.email, manager?.email].filter((e): e is string => !!e);
          await raise("high_visits_low_conversion", 2, {
            employeeId: empId,
            message: `${emp.full_name || "This employee"} made ${visitCount} DSA visits in the last ${WINDOW_DAYS} days but only ${logins} reached Login (${Math.round(rate * 100)}%).`,
            recipients,
          });
        }
      }

      // ── Inactive channel: DSA/Sub-DSA older than the window with zero visits in it ──
      const visitedDsaIds = new Set(visits.map((v: any) => v.dsa_id));
      const visitedSubDsaIds = new Set(visits.filter((v: any) => v.sub_dsa_id).map((v: any) => v.sub_dsa_id));

      for (const dsa of dsas || []) {
        if (daysAgo(dsa.created_at)! < WINDOW_DAYS) continue;
        if (visitedDsaIds.has(dsa.id)) continue;
        await raise("inactive_channel", 1, {
          dsaId: dsa.id,
          message: `DSA "${dsa.name}" has had no visit in the last ${WINDOW_DAYS} days.`,
          recipients: orgAdminEmails,
        });
      }
      for (const sub of subDsas || []) {
        if (daysAgo(sub.created_at)! < WINDOW_DAYS) continue;
        if (visitedSubDsaIds.has(sub.id)) continue;
        await raise("inactive_channel", 1, {
          dsaId: sub.dsa_id, subDsaId: sub.id,
          message: `Sub-DSA "${sub.name}" has had no visit in the last ${WINDOW_DAYS} days.`,
          recipients: orgAdminEmails,
        });
      }

      // ── Auto-resolve: any open alert whose condition no longer holds ──
      const { data: openAlerts } = await supabase
        .from("channel_activity_alerts").select("*").eq("organization_id", orgId).eq("resolved", false);
      for (const a of openAlerts || []) {
        let stillOpen = true;
        if (a.employee_id && (a.scenario === "low_visit_activity" || a.scenario === "no_visit_activity")) {
          const { data: last } = await supabase.from("visits").select("check_in_time").eq("organization_id", orgId)
            .eq("user_id", a.employee_id).not("dsa_id", "is", null).order("check_in_time", { ascending: false }).limit(1).maybeSingle();
          const gap = daysAgo(last?.check_in_time || null);
          stillOpen = gap == null || gap >= LOW_VISIT_DAYS;
        } else if (a.dsa_id && a.scenario === "inactive_channel") {
          stillOpen = a.sub_dsa_id ? !visitedSubDsaIds.has(a.sub_dsa_id) : !visitedDsaIds.has(a.dsa_id);
        }
        if (!stillOpen) {
          await supabase.from("channel_activity_alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", a.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, orgsScanned: orgIds.length, alertsRaised: summary.length, summary }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("check-channel-activity error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
