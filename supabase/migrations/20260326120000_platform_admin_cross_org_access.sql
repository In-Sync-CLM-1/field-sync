-- ============================================================================
-- Platform Admin: Cross-Organization Read Access
--
-- Adds SELECT policies so platform_admin users can view data across ALL
-- organizations. The has_role() function already exists.
-- ============================================================================

-- Organizations — platform admin sees all orgs
CREATE POLICY "Platform admin can view all organizations"
  ON public.organizations FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Attendance — platform admin sees all attendance records
CREATE POLICY "Platform admin can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Orders — platform admin sees all orders
CREATE POLICY "Platform admin can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Daily Plans — platform admin sees all daily plans
CREATE POLICY "Platform admin can view all daily_plans"
  ON public.daily_plans FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Products — platform admin sees all products
CREATE POLICY "Platform admin can view all products"
  ON public.products FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Collections — platform admin sees all collections
CREATE POLICY "Platform admin can view all collections"
  ON public.collections FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Field Invoices — platform admin sees all field invoices
CREATE POLICY "Platform admin can view all field_invoices"
  ON public.field_invoices FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Order Collections — platform admin sees all order collections
CREATE POLICY "Platform admin can view all order_collections"
  ON public.order_collections FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));
