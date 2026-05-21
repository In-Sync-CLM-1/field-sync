-- ============================================================================
-- Field-Sync v2 Simplification Migration
--
-- Additive migration: creates new tables and columns, maps legacy roles.
-- Does NOT drop any existing tables.
-- ============================================================================

-- ============================================================================
-- 1. NEW TABLE: products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric,
  description text,
  organization_id uuid REFERENCES public.organizations(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org products" ON public.products
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org products" ON public.products
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org products" ON public.products
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Updated_at trigger for products
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_products_updated_at();

-- ============================================================================
-- 2. NEW TABLE: orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.leads(id),
  user_id uuid REFERENCES public.profiles(id),
  items_text text,
  total_amount numeric,
  notes text,
  photo_url text,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org orders" ON public.orders
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org orders" ON public.orders
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 3. NEW TABLE: field_invoices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.field_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.leads(id),
  user_id uuid REFERENCES public.profiles(id),
  extracted_data jsonb,
  photo_url text,
  amount numeric,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.field_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org field_invoices" ON public.field_invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org field_invoices" ON public.field_invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own field_invoices" ON public.field_invoices
  FOR UPDATE USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 4. NEW TABLE: collections
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.leads(id),
  user_id uuid REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  description text,
  receipt_photo_url text,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org collections" ON public.collections
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org collections" ON public.collections
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 5. COLUMN ADDITIONS
-- ============================================================================

-- Add assigned_by to daily_plans (if the table and column don't already exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'daily_plans'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'assigned_by'
  ) THEN
    ALTER TABLE public.daily_plans
      ADD COLUMN assigned_by uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- Add address to leads (if the column doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN address text;
  END IF;
END $$;

-- ============================================================================
-- 6. ROLE MIGRATION
-- ============================================================================

-- Add 'agent' to app_role enum if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'agent'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'agent';
  END IF;
END $$;

-- Map legacy role values in user_roles table:
--   sales_officer  -> agent
--   branch_manager -> manager
--   super_admin    -> admin
-- These are safe UPDATEs that only touch rows with the legacy values.
-- Note: the 'agent' enum value was added above. 'manager' and 'admin' already exist.
UPDATE public.user_roles SET role = 'agent'   WHERE role = 'sales_officer';
UPDATE public.user_roles SET role = 'manager' WHERE role = 'branch_manager';
UPDATE public.user_roles SET role = 'admin'   WHERE role = 'super_admin';
