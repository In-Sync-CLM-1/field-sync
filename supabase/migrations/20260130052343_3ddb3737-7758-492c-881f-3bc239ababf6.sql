-- Add razorpay_plan_id column to subscription_plans table
ALTER TABLE public.subscription_plans
ADD COLUMN razorpay_plan_id TEXT;