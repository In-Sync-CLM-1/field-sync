-- Phase 1: Insurance Terminology Migration
-- Rename loan-focused fields to insurance terminology

-- 1.1 Update leads table - rename columns
ALTER TABLE public.leads RENAME COLUMN loan_amount TO premium_amount;
ALTER TABLE public.leads RENAME COLUMN loan_purpose TO policy_type;
ALTER TABLE public.leads RENAME COLUMN entity_name TO policy_type_category;
ALTER TABLE public.leads RENAME COLUMN lead_id TO proposal_number;

-- 1.2 Update daily_plans table - rename columns
ALTER TABLE public.daily_plans RENAME COLUMN leads_target TO prospects_target;
ALTER TABLE public.daily_plans RENAME COLUMN leads_actual TO prospects_actual;
ALTER TABLE public.daily_plans RENAME COLUMN leads_market TO prospects_market;
ALTER TABLE public.daily_plans RENAME COLUMN logins_target TO quotes_target;
ALTER TABLE public.daily_plans RENAME COLUMN logins_actual TO quotes_actual;
ALTER TABLE public.daily_plans RENAME COLUMN logins_market TO quotes_market;
ALTER TABLE public.daily_plans RENAME COLUMN enroll_target TO policies_target;
ALTER TABLE public.daily_plans RENAME COLUMN enroll_actual TO policies_actual;
ALTER TABLE public.daily_plans RENAME COLUMN fi_target TO life_insurance_target;
ALTER TABLE public.daily_plans RENAME COLUMN fi_actual TO life_insurance_actual;
ALTER TABLE public.daily_plans RENAME COLUMN db_target TO health_insurance_target;
ALTER TABLE public.daily_plans RENAME COLUMN db_actual TO health_insurance_actual;

-- 1.3 Update monthly_incentive_targets table - rename column
ALTER TABLE public.monthly_incentive_targets RENAME COLUMN enrollment_target TO policy_target;