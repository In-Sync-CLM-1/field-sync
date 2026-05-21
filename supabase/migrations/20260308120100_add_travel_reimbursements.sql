-- Create travel_reimbursements table
CREATE TABLE IF NOT EXISTS public.travel_reimbursements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attendance_id uuid REFERENCES public.attendance(id) ON DELETE SET NULL,

  -- Claim details
  claim_date date NOT NULL,
  distance_km numeric(10, 2) NOT NULL DEFAULT 0,
  rate_per_km numeric(10, 2) NOT NULL DEFAULT 0,
  calculated_amount numeric(12, 2) NOT NULL DEFAULT 0,

  -- Route info
  visit_ids jsonb DEFAULT '[]'::jsonb,
  route_summary text,

  -- Workflow status
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'recommended', 'approved', 'rejected')),

  -- Manager recommendation
  recommended_by uuid,
  recommended_at timestamptz,
  manager_remarks text,

  -- HQ approval/rejection
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_reimbursements_org ON public.travel_reimbursements(organization_id);
CREATE INDEX idx_reimbursements_user ON public.travel_reimbursements(user_id);
CREATE INDEX idx_reimbursements_status ON public.travel_reimbursements(status);
CREATE INDEX idx_reimbursements_date ON public.travel_reimbursements(claim_date);
CREATE UNIQUE INDEX idx_reimbursements_user_date ON public.travel_reimbursements(user_id, claim_date);

-- RLS
ALTER TABLE public.travel_reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reimbursements in their org"
  ON public.travel_reimbursements FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create own reimbursements"
  ON public.travel_reimbursements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update reimbursements in their org"
  ON public.travel_reimbursements FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to reimbursements"
  ON public.travel_reimbursements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_reimbursements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reimbursements_updated_at
  BEFORE UPDATE ON public.travel_reimbursements
  FOR EACH ROW
  EXECUTE FUNCTION update_reimbursements_updated_at();
