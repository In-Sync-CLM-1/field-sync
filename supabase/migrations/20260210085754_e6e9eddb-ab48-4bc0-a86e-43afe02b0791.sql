
-- ============================================
-- Attendance table
-- ============================================
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  date date NOT NULL,
  punch_in_time timestamptz,
  punch_in_latitude double precision,
  punch_in_longitude double precision,
  punch_in_accuracy double precision,
  punch_out_time timestamptz,
  punch_out_latitude double precision,
  punch_out_longitude double precision,
  punch_out_accuracy double precision,
  status text NOT NULL DEFAULT 'active',
  total_hours double precision,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own attendance"
  ON public.attendance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view org attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Managers can view team attendance"
  ON public.attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = attendance.user_id AND p.reporting_manager_id = auth.uid()
  ));

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_attendance_user_date ON public.attendance(user_id, date);

-- ============================================
-- Location history table
-- ============================================
CREATE TABLE public.location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  attendance_id uuid NOT NULL REFERENCES public.attendance(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own location history"
  ON public.location_history FOR INSERT
  WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can view own location history"
  ON public.location_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view org location history"
  ON public.location_history FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Managers can view team location history"
  ON public.location_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = location_history.user_id AND p.reporting_manager_id = auth.uid()
  ));

CREATE INDEX idx_location_history_attendance ON public.location_history(attendance_id, recorded_at);

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_history;

-- ============================================
-- Route deviations table
-- ============================================
CREATE TABLE public.route_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  attendance_id uuid NOT NULL REFERENCES public.attendance(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  distance_from_route_km double precision NOT NULL,
  nearest_visit_id uuid REFERENCES public.visits(id),
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false
);

ALTER TABLE public.route_deviations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own deviations"
  ON public.route_deviations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can view own deviations"
  ON public.route_deviations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view org deviations"
  ON public.route_deviations FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can update org deviations"
  ON public.route_deviations FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Managers can view team deviations"
  ON public.route_deviations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = route_deviations.user_id AND p.reporting_manager_id = auth.uid()
  ));

CREATE POLICY "Managers can update team deviations"
  ON public.route_deviations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = route_deviations.user_id AND p.reporting_manager_id = auth.uid()
  ));

CREATE INDEX idx_route_deviations_attendance ON public.route_deviations(attendance_id, detected_at);
