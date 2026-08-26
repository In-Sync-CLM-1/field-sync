-- DSA & Channel Visit Tracking SOP, phase 2: OTP-witnessed visits + fixed outcome list.
-- Additive columns on visits; only exercised by the channel-visit flow (a DSA selected),
-- so plain non-channel visits are unaffected.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'visits' and column_name = 'person_met_name'
  ) then
    alter table public.visits add column person_met_name text;
    alter table public.visits add column person_met_mobile text;
    alter table public.visits add column otp_verified boolean not null default false;
    alter table public.visits add column outcome text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'visits_outcome_check'
  ) then
    alter table public.visits add constraint visits_outcome_check
      check (outcome is null or outcome in ('satisfactory', 'positive', 'follow_up_required', 'no_business_opportunity', 'other'));
  end if;
end $$;
