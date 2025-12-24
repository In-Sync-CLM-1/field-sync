-- Create leads table with new schema
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Core Lead Fields
  branch TEXT,
  lead_id TEXT,  -- Custom lead identifier (e.g., LD-001)
  customer_id TEXT,  -- Custom customer identifier (e.g., CUST-001)
  status TEXT NOT NULL DEFAULT 'new',
  assigned_user_id UUID REFERENCES profiles(id),
  entity_name TEXT,
  name TEXT NOT NULL,
  
  -- Loan Details
  loan_amount NUMERIC,
  loan_purpose TEXT,
  
  -- Location
  village_city TEXT,
  district TEXT,
  state TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Contact & Follow-up
  customer_response TEXT,
  mobile_no TEXT,
  follow_up_date DATE,
  lead_source TEXT,
  
  -- Audit Fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can view leads in their organization" 
ON public.leads 
FOR SELECT 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can create leads in their organization" 
ON public.leads 
FOR INSERT 
WITH CHECK (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can update leads in their organization" 
ON public.leads 
FOR UPDATE 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can delete leads in their organization" 
ON public.leads 
FOR DELETE 
USING (organization_id IN (
  SELECT profiles.organization_id
  FROM profiles
  WHERE profiles.id = auth.uid()
));

-- Create index for common queries
CREATE INDEX idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_assigned_user_id ON public.leads(assigned_user_id);
CREATE INDEX idx_leads_follow_up_date ON public.leads(follow_up_date);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();