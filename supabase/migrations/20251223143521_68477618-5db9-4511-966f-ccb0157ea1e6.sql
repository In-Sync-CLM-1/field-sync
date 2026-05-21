-- Create daily_plans table for planning feature
CREATE TABLE public.daily_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  -- Agent fields
  leads_target INTEGER NOT NULL DEFAULT 0,
  logins_target INTEGER NOT NULL DEFAULT 0,
  enroll_target INTEGER NOT NULL DEFAULT 0,
  leads_actual INTEGER NOT NULL DEFAULT 0,
  logins_actual INTEGER NOT NULL DEFAULT 0,
  enroll_actual INTEGER NOT NULL DEFAULT 0,
  -- Manager fields (FI and DB)
  fi_target INTEGER DEFAULT 0,
  db_target INTEGER DEFAULT 0,
  fi_actual INTEGER DEFAULT 0,
  db_actual INTEGER DEFAULT 0,
  -- Status and correction tracking
  status TEXT NOT NULL DEFAULT 'draft',
  corrected_by UUID REFERENCES public.profiles(id),
  original_values JSONB,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint: one plan per user per date
  UNIQUE (user_id, plan_date)
);

-- Enable RLS
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can view their own plans
CREATE POLICY "Agents can view own plans"
ON public.daily_plans
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Agents can create their own plans
CREATE POLICY "Agents can create own plans"
ON public.daily_plans
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Policy: Agents can update their own plans
CREATE POLICY "Agents can update own plans"
ON public.daily_plans
FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Agents can delete their own plans
CREATE POLICY "Agents can delete own plans"
ON public.daily_plans
FOR DELETE
USING (user_id = auth.uid());

-- Policy: Managers can view plans of their direct reports
CREATE POLICY "Managers can view team plans"
ON public.daily_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = daily_plans.user_id
    AND p.reporting_manager_id = auth.uid()
  )
);

-- Policy: Managers can update plans of their direct reports (for corrections)
CREATE POLICY "Managers can update team plans"
ON public.daily_plans
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = daily_plans.user_id
    AND p.reporting_manager_id = auth.uid()
  )
);

-- Policy: Admins can view all plans in their organization
CREATE POLICY "Admins can view org plans"
ON public.daily_plans
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Policy: Admins can manage all plans in their organization
CREATE POLICY "Admins can manage org plans"
ON public.daily_plans
FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Add updated_at trigger
CREATE TRIGGER update_daily_plans_updated_at
BEFORE UPDATE ON public.daily_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();