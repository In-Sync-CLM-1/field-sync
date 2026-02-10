import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

async function sendWhatsAppOTP(phone: string, otp: string): Promise<void> {
  const apiKey = Deno.env.get("EXOTEL_API_KEY")!;
  const apiToken = Deno.env.get("EXOTEL_API_TOKEN")!;
  const sid = Deno.env.get("EXOTEL_SID")!;
  const subdomain = Deno.env.get("EXOTEL_SUBDOMAIN")!;
  const whatsappFrom = Deno.env.get("WHATSAPP_FROM_NUMBER")!;

  const toPhone = phone.replace(/^\+/, "");
  const fromPhone = whatsappFrom.replace(/^\+/, "");

  const payload = {
    custom_data: phone,
    status_callback: "",
    whatsapp: {
      messages: [
        {
          from: fromPhone,
          to: toPhone,
          content: {
            type: "template",
            template: {
              name: "otp",
              language: { code: "en_US" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: otp }],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: otp }],
                },
              ],
            },
          },
        },
      ],
    },
  };

  const url = `https://${subdomain}/v2/accounts/${sid}/messages`;
  const auth = btoa(`${apiKey}:${apiToken}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("Exotel API error:", response.status, responseText);
    throw new Error(`WhatsApp send failed: ${response.status} - ${responseText}`);
  }

  console.log("WhatsApp OTP sent successfully");
}

async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const emailResponse = await resend.emails.send({
    from: "InSync <noreply@in-sync.co.in>",
    to: [email],
    subject: "Your InSync Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">Verify Your Account</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
          Your verification code is:
        </p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px;">
          This code expires in 10 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  });

  console.log("Email OTP sent successfully:", emailResponse);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, channel, phone, email, otp } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine identifier and type
    const isPhone = channel === "whatsapp" || (!channel && phone && !email);
    const identifierType = isPhone ? "phone" : "email";
    const rawIdentifier = isPhone ? phone : email;

    if (!rawIdentifier) {
      throw new Error(`${identifierType === "phone" ? "Phone number" : "Email"} is required`);
    }

    const identifier = isPhone ? normalizePhone(rawIdentifier) : rawIdentifier.trim().toLowerCase();

    // ─── VERIFY MODE ───
    if (action === "verify") {
      if (!otp) throw new Error("OTP is required for verification");

      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("identifier", identifier)
        .eq("identifier_type", identifierType)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching OTP:", fetchError);
        throw new Error("Failed to verify OTP");
      }

      if (!otpRecord) {
        return new Response(
          JSON.stringify({ verified: false, error: "No valid OTP found. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if ((otpRecord.attempts || 0) >= 5) {
        return new Response(
          JSON.stringify({ verified: false, error: "Too many attempts. Please request a new OTP." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const isValid = compareSync(otp, otpRecord.otp_hash);

      if (isValid) {
        await supabase
          .from("otp_verifications")
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        await supabase
          .from("otp_verifications")
          .update({ attempts: (otpRecord.attempts || 0) + 1 })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: false, error: "Invalid OTP" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // ─── SEND MODE ───
    const otpCode = generateOTP();
    const otpHash = hashSync(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing unverified OTPs for this identifier
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("identifier", identifier)
      .eq("identifier_type", identifierType)
      .eq("verified", false);

    // Insert new OTP record with bcrypt hash
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        identifier,
        identifier_type: identifierType,
        code: "hashed",
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error("Failed to insert OTP:", insertError);
      throw new Error("Failed to create OTP");
    }

    // Send via appropriate channel
    if (isPhone) {
      await sendWhatsAppOTP(identifier, otpCode);
    } else {
      await sendEmailOTP(identifier, otpCode);
    }

    return new Response(
      JSON.stringify({ success: true, message: `OTP sent via ${isPhone ? "whatsapp" : "email"}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-public-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
