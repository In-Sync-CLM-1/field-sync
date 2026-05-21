-- Add application_id column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS application_id text;

-- Create index for faster lookups on application_id
CREATE INDEX IF NOT EXISTS idx_customers_application_id ON public.customers(application_id);

-- Create plan_enrollments junction table to track enrolled contacts per daily plan
CREATE TABLE IF NOT EXISTS public.plan_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id uuid NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  enrolled_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(daily_plan_id, customer_id)
);

-- Enable RLS on plan_enrollments
ALTER TABLE public.plan_enrollments ENABLE ROW LEVEL SECURITY;

-- Agents can view their own plan enrollments (via daily_plans ownership)
CREATE POLICY "Agents can view own plan enrollments" 
ON public.plan_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.daily_plans dp 
    WHERE dp.id = plan_enrollments.daily_plan_id 
    AND dp.user_id = auth.uid()
  )
);

-- Agents can create enrollments for their own plans
CREATE POLICY "Agents can create own plan enrollments" 
ON public.plan_enrollments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_plans dp 
    WHERE dp.id = plan_enrollments.daily_plan_id 
    AND dp.user_id = auth.uid()
  )
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Agents can delete their own plan enrollments
CREATE POLICY "Agents can delete own plan enrollments" 
ON public.plan_enrollments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.daily_plans dp 
    WHERE dp.id = plan_enrollments.daily_plan_id 
    AND dp.user_id = auth.uid()
  )
);

-- Managers can view team plan enrollments
CREATE POLICY "Managers can view team plan enrollments" 
ON public.plan_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.daily_plans dp
    JOIN public.profiles p ON p.id = dp.user_id
    WHERE dp.id = plan_enrollments.daily_plan_id 
    AND p.reporting_manager_id = auth.uid()
  )
);

-- Admins can manage all org plan enrollments
CREATE POLICY "Admins can manage org plan enrollments" 
ON public.plan_enrollments 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
);