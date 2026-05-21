
-- Add otp_hash and attempts columns to otp_verifications
ALTER TABLE public.otp_verifications 
  ADD COLUMN IF NOT EXISTS otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
