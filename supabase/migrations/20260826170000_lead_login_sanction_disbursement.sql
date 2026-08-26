-- DSA & Channel Visit Tracking SOP, phase 3: Login -> Sanction -> Disbursement chain.
-- The chain sits directly on the lead row it extends, so it automatically inherits
-- that lead's dsa_id/sub_dsa_id/assigned_user_id -- the SOP's "same source information
-- flows automatically" requirement, with no extra tagging needed at each stage.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'login_at'
  ) then
    alter table public.leads add column login_at timestamptz;
    alter table public.leads add column login_by uuid references public.profiles(id);
    alter table public.leads add column sanction_at timestamptz;
    alter table public.leads add column sanction_amount numeric;
    alter table public.leads add column disbursement_at timestamptz;
    alter table public.leads add column disbursement_amount numeric;
  end if;
end $$;

create index if not exists idx_leads_login_at        on public.leads (organization_id, login_at)        where login_at is not null;
create index if not exists idx_leads_sanction_at      on public.leads (organization_id, sanction_at)      where sanction_at is not null;
create index if not exists idx_leads_disbursement_at  on public.leads (organization_id, disbursement_at)  where disbursement_at is not null;
