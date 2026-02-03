import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendOTPRequest {
  identifier: string;
  identifier_type: "email" | "phone";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, identifier_type }: SendOTPRequest = await req.json();

    if (!identifier || !identifier_type) {
      throw new Error("Identifier and type are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this identifier
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("identifier", identifier)
      .eq("identifier_type", identifier_type);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        identifier,
        identifier_type,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to insert OTP:", insertError);
      throw new Error("Failed to create OTP");
    }

    // Send OTP based on type
    if (identifier_type === "email") {
      const emailResponse = await resend.emails.send({
        from: "InSync <noreply@in-sync.co.in>",
        to: [identifier],
        subject: "Your InSync Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">Verify Your Account</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
              Your verification code is:
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
            </div>
            <p style="color: #999; font-size: 14px;">
              This code expires in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });

      console.log("Email OTP sent:", emailResponse);
    } else if (identifier_type === "phone") {
      // For phone, we'd integrate with an SMS provider
      // For now, log the OTP (in production, use Twilio/MSG91/etc.)
      console.log(`SMS OTP for ${identifier}: ${code}`);
      // TODO: Integrate SMS provider
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
