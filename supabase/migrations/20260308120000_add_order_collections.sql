-- Create order_collections table for sales orders and payment collections
CREATE TABLE IF NOT EXISTS public.order_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Type: sales_order or payment_collection
  type text NOT NULL CHECK (type IN ('sales_order', 'payment_collection')),

  -- Product/Service details (for sales orders)
  product_name text,
  product_description text,
  quantity integer DEFAULT 1,
  unit_price numeric(12, 2) DEFAULT 0,

  -- Amount
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,

  -- Payment details (for collections)
  payment_mode text CHECK (payment_mode IN ('cash', 'cheque', 'upi', 'bank_transfer', 'online', 'other')),
  payment_reference text,

  -- Customer info snapshot
  customer_name text,
  customer_phone text,

  -- Additional
  remarks text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'confirmed', 'cancelled')),
  email_sent boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_order_collections_visit ON public.order_collections(visit_id);
CREATE INDEX idx_order_collections_org ON public.order_collections(organization_id);
CREATE INDEX idx_order_collections_user ON public.order_collections(user_id);
CREATE INDEX idx_order_collections_type ON public.order_collections(type);

-- RLS
ALTER TABLE public.order_collections ENABLE ROW LEVEL SECURITY;

-- Policy: users can see order_collections in their organization
CREATE POLICY "Users can view order_collections in their org"
  ON public.order_collections FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: users can insert order_collections in their org
CREATE POLICY "Users can create order_collections"
  ON public.order_collections FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: users can update their own order_collections
CREATE POLICY "Users can update own order_collections"
  ON public.order_collections FOR UPDATE
  USING (user_id = auth.uid());

-- Allow anon/service role for edge functions
CREATE POLICY "Service role full access to order_collections"
  ON public.order_collections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_order_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_collections_updated_at
  BEFORE UPDATE ON public.order_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_order_collections_updated_at();
