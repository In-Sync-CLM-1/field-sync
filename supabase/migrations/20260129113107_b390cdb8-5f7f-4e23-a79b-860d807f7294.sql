-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_user NUMERIC(10,2) NOT NULL DEFAULT 99.00,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  trial_days INTEGER DEFAULT 14,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add subscription columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES public.subscription_plans(id);

-- Payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT,
  invoice_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  billing_period_start DATE,
  billing_period_end DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from payment_transactions to invoices
ALTER TABLE public.payment_transactions 
  ADD CONSTRAINT payment_transactions_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Subscription Plans RLS: Everyone can view active plans, platform admins can manage
CREATE POLICY "Anyone can view active subscription plans" 
  ON public.subscription_plans FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Platform admins can manage subscription plans" 
  ON public.subscription_plans FOR ALL 
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Payment Transactions RLS: Org admins can view their own, platform admins can view all
CREATE POLICY "Org admins can view own payment transactions" 
  ON public.payment_transactions FOR SELECT 
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Platform admins can view all payment transactions" 
  ON public.payment_transactions FOR SELECT 
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can manage payment transactions" 
  ON public.payment_transactions FOR ALL 
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Invoices RLS: Org admins can view their own, platform admins can manage all
CREATE POLICY "Org admins can view own invoices" 
  ON public.invoices FOR SELECT 
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Platform admins can view all invoices" 
  ON public.invoices FOR SELECT 
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can manage invoices" 
  ON public.invoices FOR ALL 
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Function to set trial_ends_at when organization is created
CREATE OR REPLACE FUNCTION public.set_organization_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial_ends_at to 14 days from now if not already set
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + INTERVAL '14 days';
    NEW.subscription_status := 'trial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-set trial period on new organizations
CREATE TRIGGER set_organization_trial_trigger
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_trial();

-- Function to update user_count on organization
CREATE OR REPLACE FUNCTION public.update_organization_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.organizations 
    SET user_count = (
      SELECT COUNT(*) FROM public.profiles 
      WHERE organization_id = NEW.organization_id AND is_active = true
    )
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.organizations 
    SET user_count = (
      SELECT COUNT(*) FROM public.profiles 
      WHERE organization_id = OLD.organization_id AND is_active = true
    )
    WHERE id = OLD.organization_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to keep user_count in sync
CREATE TRIGGER update_org_user_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_user_count();

-- Insert default subscription plan
INSERT INTO public.subscription_plans (name, description, price_per_user, billing_cycle, trial_days, features)
VALUES (
  'Professional',
  'Full access to all Field Force Automation features',
  99.00,
  'monthly',
  14,
  '{"leads": true, "visits": true, "planning": true, "analytics": true, "team_management": true, "territory_map": true}'
);

-- Update existing organizations to have trial period (for existing data)
UPDATE public.organizations 
SET 
  trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days'),
  subscription_status = CASE 
    WHEN subscription_active = true THEN 'active'::subscription_status
    ELSE 'trial'::subscription_status
  END
WHERE trial_ends_at IS NULL;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();