
-- Add new columns to visits table for scheduling, status, cancellation, rescheduling, and checklists
ALTER TABLE public.visits 
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time time without time zone,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES public.visits(id),
  ADD COLUMN IF NOT EXISTS checklist jsonb;

-- Set existing visits with check_out_time to 'completed'
UPDATE public.visits SET status = 'completed' WHERE check_out_time IS NOT NULL;

-- Create visit_checklist_templates table
CREATE TABLE public.visit_checklist_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on visit_checklist_templates
ALTER TABLE public.visit_checklist_templates ENABLE ROW LEVEL SECURITY;

-- RLS: All org users can view active templates
CREATE POLICY "Users can view checklist templates in their org"
ON public.visit_checklist_templates
FOR SELECT
USING (organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- RLS: Admins can manage templates
CREATE POLICY "Admins can manage checklist templates"
ON public.visit_checklist_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
);

-- Add index for scheduled_date lookups
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON public.visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
