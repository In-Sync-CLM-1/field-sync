
-- Create lead_activities table for communication history
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- call, whatsapp, visit, note, status_change, follow_up
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities in their organization
CREATE POLICY "Users can view lead activities in their organization"
ON public.lead_activities
FOR SELECT
USING (organization_id IN (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
));

-- Users can create activities in their organization
CREATE POLICY "Users can create lead activities in their organization"
ON public.lead_activities
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
));

-- Create index for fast lookups
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_org_id ON public.lead_activities(organization_id);
