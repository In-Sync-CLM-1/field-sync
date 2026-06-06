-- Beat Plan (Permanent Journey Plan / PJP)
-- Recurring routes -> generated dated "Today" list reps work from.
-- Schema adapted to Field-Sync: customers = leads, users = profiles, org = organization_id.

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────

-- A recurring route owned by one rep
create table if not exists public.beats (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,                       -- "Koramangala - Mon/Thu"
  agent_id        uuid not null references public.profiles(id),
  weekdays        int[] not null default '{}',         -- 0=Sun .. 6=Sat (matches extract(dow))
  cadence         text not null default 'weekly',      -- 'weekly' | 'fortnightly' | 'monthly'
  week_parity     int  not null default 0,             -- 0/1, used by 'fortnightly' (Week A / Week B)
  week_of_month   int  not null default 1,             -- 1..5, used by 'monthly' (Nth occurrence of weekday)
  active          bool not null default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Customers on a beat, in visit order
create table if not exists public.beat_customers (
  id          uuid primary key default gen_random_uuid(),
  beat_id     uuid not null references public.beats(id) on delete cascade,
  customer_id uuid not null references public.leads(id) on delete cascade,
  seq         int  not null default 0,
  unique (beat_id, customer_id)
);

-- The generated, dated plan the rep works ("Today")
create table if not exists public.plan_visits (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id        uuid not null references public.profiles(id),
  plan_date       date not null,
  customer_id     uuid not null references public.leads(id) on delete cascade,
  beat_id         uuid references public.beats(id) on delete set null,  -- null for ad-hoc
  seq             int  not null default 0,
  source          text not null default 'beat',     -- 'beat' | 'ad_hoc'
  status          text not null default 'planned',  -- 'planned' | 'visited' | 'skipped'
  visit_id        uuid references public.visits(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (agent_id, plan_date, customer_id)
);

create index if not exists idx_beats_org_agent       on public.beats (organization_id, agent_id);
create index if not exists idx_beat_customers_beat    on public.beat_customers (beat_id, seq);
create index if not exists idx_plan_visits_agent_date on public.plan_visits (agent_id, plan_date);
create index if not exists idx_plan_visits_org_date   on public.plan_visits (organization_id, plan_date);

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — mirror the visits pattern (org read via profiles; manager writes on beats)
-- ────────────────────────────────────────────────────────────────────────────

alter table public.beats          enable row level security;
alter table public.beat_customers enable row level security;
alter table public.plan_visits    enable row level security;

-- helper: caller is an admin/manager-type role in this org
create or replace function public.is_org_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin','super_admin','manager','branch_manager','sales_manager','support_manager')
  ) or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_platform_admin = true
  );
$$;

-- beats: any org member reads; managers/admins write
drop policy if exists beats_select on public.beats;
create policy beats_select on public.beats for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

drop policy if exists beats_write on public.beats;
create policy beats_write on public.beats for all
  using (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  )
  with check (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  );

-- beat_customers: gated through the parent beat's org; managers write
drop policy if exists bc_select on public.beat_customers;
create policy bc_select on public.beat_customers for select
  using (exists (
    select 1 from public.beats b
    where b.id = beat_id
      and b.organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
  ));

drop policy if exists bc_write on public.beat_customers;
create policy bc_write on public.beat_customers for all
  using (exists (
    select 1 from public.beats b
    where b.id = beat_id
      and b.organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
  ) and public.is_org_manager())
  with check (exists (
    select 1 from public.beats b
    where b.id = beat_id
      and b.organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
  ) and public.is_org_manager());

-- plan_visits: org members read; org members write (rep updates own list; manager can reassign)
drop policy if exists pv_select on public.plan_visits;
create policy pv_select on public.plan_visits for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

drop policy if exists pv_write on public.plan_visits;
create policy pv_write on public.plan_visits for all
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()))
  with check (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────────────
-- Generation RPC — lazy + idempotent. Returns the rep's plan for a date,
-- generating beat items first if missing.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.get_or_generate_daily_plan(p_agent uuid, p_date date)
returns setof public.plan_visits
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plan_visits (organization_id, agent_id, plan_date, customer_id, beat_id, seq, source)
  select b.organization_id, b.agent_id, p_date, bc.customer_id, b.id, bc.seq, 'beat'
  from public.beats b
  join public.beat_customers bc on bc.beat_id = b.id
  join public.leads c on c.id = bc.customer_id and coalesce(c.status,'active') <> 'lost'  -- 'lost' = inactive
  where b.agent_id = p_agent
    and b.active
    and extract(dow from p_date)::int = any (b.weekdays)
    and (
      b.cadence = 'weekly'
      or (b.cadence = 'fortnightly'
          and (floor((p_date - date '2024-01-01') / 7.0)::int % 2) = coalesce(b.week_parity, 0))
      or (b.cadence = 'monthly'
          and ceil(extract(day from p_date) / 7.0)::int = coalesce(b.week_of_month, 1))
    )
  on conflict (agent_id, plan_date, customer_id) do nothing;   -- idempotent

  return query
    select * from public.plan_visits
    where agent_id = p_agent and plan_date = p_date
    order by seq, created_at;
end;
$$;

grant execute on function public.get_or_generate_daily_plan(uuid, date) to authenticated, service_role;
grant execute on function public.is_org_manager() to authenticated, service_role;
