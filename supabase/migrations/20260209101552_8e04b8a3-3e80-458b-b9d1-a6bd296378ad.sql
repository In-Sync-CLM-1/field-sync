
-- Create agent_locations table
CREATE TABLE public.agent_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.agent_locations ENABLE ROW LEVEL SECURITY;

-- Agents can upsert their own location
CREATE POLICY "Agents can insert own location"
ON public.agent_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Agents can update own location"
ON public.agent_locations
FOR UPDATE
USING (auth.uid() = user_id);

-- Agents can view their own location
CREATE POLICY "Agents can view own location"
ON public.agent_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all locations in their org
CREATE POLICY "Admins can view org locations"
ON public.agent_locations
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Managers can view their team's locations
CREATE POLICY "Managers can view team locations"
ON public.agent_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = agent_locations.user_id
    AND p.reporting_manager_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_locations;
