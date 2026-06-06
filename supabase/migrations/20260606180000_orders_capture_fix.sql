-- Field capture fix: orders & payments are stored in order_collections (the bare
-- orders/collections tables never existed), and the Invoices tab now has a real
-- backing table. Standalone captures aren't tied to a visit, so visit_id is optional.
-- Idempotent.

-- Standalone order/payment captures have no visit.
alter table order_collections alter column visit_id drop not null;

-- Backing table for the Invoices (supplier/purchase invoice) capture tab.
create table if not exists field_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  vendor text,
  extracted_data jsonb,
  amount numeric not null default 0,
  gst text,
  status text not null default 'captured',
  created_at timestamptz not null default now()
);
alter table field_invoices enable row level security;

drop policy if exists field_invoices_org_all on field_invoices;
create policy field_invoices_org_all on field_invoices for all
  using (organization_id in (select organization_id from profiles where id = auth.uid()))
  with check (organization_id in (select organization_id from profiles where id = auth.uid()));
