-- DSA & Channel Visit Tracking SOP, phase 4: automated alerts + escalation audit trail.
-- check-channel-activity (edge fn) writes rows here on each daily run; this table is
-- the SOP's "full audit trail of every alert and escalation".

create table if not exists public.channel_activity_alerts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario        text not null check (scenario in (
                    'low_visit_activity', 'no_visit_activity', 'visits_no_business',
                    'high_visits_low_conversion', 'inactive_channel'
                  )),
  level           int not null check (level between 1 and 3),
  employee_id     uuid references public.profiles(id) on delete cascade,
  dsa_id          uuid references public.dsas(id) on delete cascade,
  sub_dsa_id      uuid references public.sub_dsas(id) on delete cascade,
  message         text not null,
  notified_emails text[] not null default '{}',
  needs_review    bool not null default false,   -- set at level 3, per SOP "system flag for review"
  resolved        bool not null default false,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_channel_alerts_org_open
  on public.channel_activity_alerts (organization_id, resolved, created_at desc);
create index if not exists idx_channel_alerts_dedupe
  on public.channel_activity_alerts (organization_id, scenario, employee_id, dsa_id, sub_dsa_id, resolved);

alter table public.channel_activity_alerts enable row level security;

drop policy if exists channel_alerts_select on public.channel_activity_alerts;
create policy channel_alerts_select on public.channel_activity_alerts for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

-- Only managers/admins can mark alerts reviewed/resolved by hand; inserts are service-role only (the edge fn).
drop policy if exists channel_alerts_update on public.channel_activity_alerts;
create policy channel_alerts_update on public.channel_activity_alerts for update
  using (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  )
  with check (
    organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid())
    and public.is_org_manager()
  );
