
-- Create visit_photos table
CREATE TABLE public.visit_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy NUMERIC,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_visit_photos_visit_id ON public.visit_photos(visit_id);
CREATE INDEX idx_visit_photos_organization_id ON public.visit_photos(organization_id);

-- Enable RLS
ALTER TABLE public.visit_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies scoped to organization
CREATE POLICY "Users can view photos in their organization"
ON public.visit_photos FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert photos in their organization"
ON public.visit_photos FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete their own photos"
ON public.visit_photos FOR DELETE
USING (user_id = auth.uid());

-- Create visit-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('visit-photos', 'visit-photos', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload visit photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view visit photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-photos');

CREATE POLICY "Users can delete their own visit photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');
