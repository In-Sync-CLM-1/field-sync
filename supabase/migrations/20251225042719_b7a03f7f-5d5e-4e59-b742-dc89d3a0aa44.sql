-- Add market fields for leads and logins to daily_plans table
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS leads_market text,
ADD COLUMN IF NOT EXISTS logins_market text;