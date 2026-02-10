import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");
  // Ensure +91 prefix for storage
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

  // Phone for Exotel: digits only, no "+" prefix
  const toPhone = phone.replace(/^\+/, "");

  const payload = {
    custom_field: phone,
    status_callback: "",
    to: toPhone,
    from: whatsappFrom,
    whatsapp: {
      content_type: "template",
      template: {
        name: "psotp1",
        language: "en_US",
        body_values: {
          "1": otp,
        },
        buttons: {
          "0": {
            sub_type: "url",
            index: "0",
            parameters: [otp],
          },
        },
      },
    },
  };

  const url = `https://${subdomain}/v2/accounts/${sid}/messages`;
  const auth = btoa(`${apiKey}:${apiToken}`);

  console.log("Exotel request URL:", url);
  console.log("Exotel from number:", whatsappFrom);
  console.log("Exotel to number:", toPhone);
  console.log("Exotel SID:", sid);
  console.log("Exotel subdomain:", subdomain);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  console.log("Exotel response status:", response.status);
  console.log("Exotel response body:", responseText);
  console.log("Exotel response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));

  if (!response.ok) {
    console.error("Exotel API error:", response.status, responseText);
    throw new Error(`WhatsApp send failed: ${response.status} - ${responseText}`);
  }

  if (!responseText || responseText.trim() === "") {
    console.warn("Exotel returned 200 but empty body - message may not have been sent");
  }

  console.log("WhatsApp OTP sent successfully:", responseText);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, channel, otp, action } = body;

    if (!phone) {
      throw new Error("Phone number is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedPhone = normalizePhone(phone);

    // ─── VERIFY MODE ───
    if (action === "verify") {
      if (!otp) throw new Error("OTP is required for verification");

      // Find latest unverified, non-expired OTP for this phone
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("identifier", normalizedPhone)
        .eq("identifier_type", "phone")
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

      // Check attempt limit
      if ((otpRecord.attempts || 0) >= 5) {
        return new Response(
          JSON.stringify({ verified: false, error: "Too many attempts. Please request a new OTP." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Compare OTP against bcrypt hash
      const isValid = compareSync(otp, otpRecord.otp_hash);

      if (isValid) {
        // Mark as verified
        await supabase
          .from("otp_verifications")
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Increment attempts
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified OTPs for this phone
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("identifier", normalizedPhone)
      .eq("identifier_type", "phone")
      .eq("verified", false);

    // Insert new OTP record
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        identifier: normalizedPhone,
        identifier_type: "phone",
        code: "hashed", // placeholder since column is NOT NULL
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error("Failed to insert OTP:", insertError);
      throw new Error("Failed to create OTP");
    }

    // Send via WhatsApp (default) or SMS
    if (channel === "whatsapp" || !channel) {
      await sendWhatsAppOTP(normalizedPhone, otpCode);
    } else {
      // SMS fallback - log for now
      console.log(`SMS OTP for ${normalizedPhone}: ${otpCode}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `OTP sent via ${channel || "whatsapp"}` }),
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
