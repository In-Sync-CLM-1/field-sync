-- Create monthly_incentive_targets table
CREATE TABLE public.monthly_incentive_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_month DATE NOT NULL, -- First day of month (e.g., 2025-12-01)
  enrollment_target INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_month)
);

-- Enable RLS
ALTER TABLE public.monthly_incentive_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own targets"
ON public.monthly_incentive_targets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own targets"
ON public.monthly_incentive_targets
FOR INSERT
WITH CHECK (user_id = auth.uid() AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own targets"
ON public.monthly_incentive_targets
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own targets"
ON public.monthly_incentive_targets
FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_monthly_incentive_targets_updated_at
BEFORE UPDATE ON public.monthly_incentive_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();