-- Create table to store OTP codes
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone number
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'phone')),
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTPs (needed for registration before auth)
CREATE POLICY "Anyone can create OTP verification"
ON public.otp_verifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading own OTP by identifier (for verification)
CREATE POLICY "Anyone can read OTP by identifier"
ON public.otp_verifications FOR SELECT
TO anon, authenticated
USING (true);

-- Allow updating (marking as verified)
CREATE POLICY "Anyone can update OTP verification"
ON public.otp_verifications FOR UPDATE
TO anon, authenticated
USING (true);

-- Index for faster lookups
CREATE INDEX idx_otp_verifications_identifier ON public.otp_verifications(identifier, identifier_type);

-- Auto-cleanup old OTPs (function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;