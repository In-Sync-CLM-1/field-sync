-- DSA & Sub-DSA channel-partner registry (DSA & Channel Visit Tracking SOP, phase 1).
-- Corporate DSAs each get a unique code; Sub-DSAs nest under a DSA and get their own
-- unique code (auto-generated). Visits and leads can optionally be tagged to the
-- DSA/Sub-DSA that sourced them -- additive, so existing non-channel orgs are unaffected.

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.dsas (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code            text not null,                 -- "DSA-0001", auto-generated
  name            text not null,
  contact_name    text,
  contact_phone   text,
  is_active       bool not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.sub_dsas (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dsa_id          uuid not null references public.dsas(id) on delete cascade,
  code            text not null,                 -- "SUBDSA-0001", auto-generated
  name            text not null,
  phone           text,
  is_active       bool not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, code)
);

create index if not exists idx_dsas_org         on public.dsas (organization_id);
create index if not exists idx_sub_dsas_org_dsa on public.sub_dsas (organization_id, dsa_id);

-- Optional tagging on visits/leads -- nullable, so orgs that don't use channel
-- partners are unaffected.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'visits' and column_name = 'dsa_id'
  ) then
    alter table public.visits add column dsa_id uuid references public.dsas(id) on delete set null;
    alter table public.visits add column sub_dsa_id uuid references public.sub_dsas(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'dsa_id'
  ) then
    alter table public.leads add column dsa_id uuid references public.dsas(id) on delete set null;
    alter table public.leads add column sub_dsa_id uuid references public.sub_dsas(id) on delete set null;
  end if;
end $$;

create index if not exists idx_visits_dsa on public.visits (dsa_id) where dsa_id is not null;
create index if not exists idx_leads_dsa  on public.leads  (dsa_id) where dsa_id is not null;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS -- mirror the beats pattern: any org member reads, managers/admins write
-- ────────────────────────────────────────────────────────────────────────────

alter table public.dsas     enable row level security;
alter table public.sub_dsas enable row level security;

drop policy if exists dsas_select on public.dsas;
create policy dsas_select on public.dsas for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

drop policy if exists dsas_write on public.dsas;
create policy dsas_write on public.dsas for all
  using (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  )
  with check (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  );

drop policy if exists sub_dsas_select on public.sub_dsas;
create policy sub_dsas_select on public.sub_dsas for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

-- Sub-DSA write is intentionally open to any org member (not just managers) --
-- the SOP has field reps add a new Sub-DSA on the spot during a visit.
drop policy if exists sub_dsas_write on public.sub_dsas;
create policy sub_dsas_write on public.sub_dsas for all
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()))
  with check (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────────────
-- Code generation -- next sequential code per org, zero-padded to 4 digits.
-- Advisory-locked per org+kind so two concurrent inserts can't collide.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.generate_dsa_code(p_org uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('dsa_code:' || p_org::text));
  select count(*) + 1 into n from public.dsas where organization_id = p_org;
  return 'DSA-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.generate_sub_dsa_code(p_org uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('sub_dsa_code:' || p_org::text));
  select count(*) + 1 into n from public.sub_dsas where organization_id = p_org;
  return 'SUBDSA-' || lpad(n::text, 4, '0');
end;
$$;

grant execute on function public.generate_dsa_code(uuid) to authenticated, service_role;
grant execute on function public.generate_sub_dsa_code(uuid) to authenticated, service_role;
