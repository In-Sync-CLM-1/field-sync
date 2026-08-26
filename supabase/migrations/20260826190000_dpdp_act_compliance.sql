-- DPDP Act 2023 compliance, ported from the vendor-verification project's proven pattern:
-- field-level PII encryption (pgcrypto, key in Vault) + masked plaintext for display,
-- consent records, data-principal requests, breach notifications, and an audit-logged
-- access path for anyone who needs to see the real value.
--
-- field-sync's PII surfaces: leads.mobile_no (customers), profiles.phone/email
-- (employees), visits.person_met_mobile (third parties met on a visit -- new this
-- month with OTP-witnessed visits). Names are left in plain text, same scope vendor
-- itself uses (mobile/email/bank/PAN-class fields, not names).

-- ────────────────────────────────────────────────────────────────────────────
-- Encryption key + helper functions
-- ────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'PII_ENCRYPTION_KEY') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'PII_ENCRYPTION_KEY', 'PII encryption key for DPDP compliance');
  end if;
end $$;

create or replace function public.encrypt_pii(plaintext text)
returns bytea
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  encryption_key text;
begin
  if plaintext is null or plaintext = '' then
    return null;
  end if;
  select decrypted_secret into encryption_key from vault.decrypted_secrets where name = 'PII_ENCRYPTION_KEY' limit 1;
  if encryption_key is null then
    raise exception 'PII_ENCRYPTION_KEY not found in vault';
  end if;
  return extensions.pgp_sym_encrypt(plaintext, encryption_key);
end;
$$;

create or replace function public.decrypt_pii(ciphertext bytea)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  encryption_key text;
begin
  if ciphertext is null then
    return null;
  end if;
  select decrypted_secret into encryption_key from vault.decrypted_secrets where name = 'PII_ENCRYPTION_KEY' limit 1;
  if encryption_key is null then
    raise exception 'PII_ENCRYPTION_KEY not found in vault';
  end if;
  return extensions.pgp_sym_decrypt(ciphertext, encryption_key);
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Encrypted columns + masking triggers
--
-- IMPORTANT: masked-style columns (left with '****1234' / 'user@***' rather than
-- NULL) MUST guard against re-encrypting an already-masked value on UPDATE, or
-- every later edit destroys the real value by encrypting the mask instead. This
-- burned vendor-verification for real (25 of 29 vendors, unrecoverable). Every
-- masked column below carries the `NOT LIKE` guard from day one.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.leads    add column if not exists mobile_no_encrypted bytea;
alter table public.profiles add column if not exists phone_encrypted bytea;
alter table public.profiles add column if not exists email_encrypted bytea;
alter table public.visits   add column if not exists person_met_mobile_encrypted bytea;

create or replace function public.encrypt_lead_pii()
returns trigger language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  if new.mobile_no is not null and new.mobile_no != '' and new.mobile_no not like '****%' then
    new.mobile_no_encrypted := encrypt_pii(new.mobile_no);
    new.mobile_no := '****' || right(regexp_replace(new.mobile_no, '\D', '', 'g'), 4);
  end if;
  return new;
end;
$$;

create or replace function public.encrypt_profile_pii()
returns trigger language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  if new.phone is not null and new.phone != '' and new.phone not like '****%' then
    new.phone_encrypted := encrypt_pii(new.phone);
    new.phone := '****' || right(regexp_replace(new.phone, '\D', '', 'g'), 4);
  end if;
  if new.email is not null and new.email != '' and new.email not like '%@***' then
    new.email_encrypted := encrypt_pii(new.email);
    new.email := split_part(new.email, '@', 1) || '@***';
  end if;
  return new;
end;
$$;

create or replace function public.encrypt_visit_pii()
returns trigger language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  if new.person_met_mobile is not null and new.person_met_mobile != '' and new.person_met_mobile not like '****%' then
    new.person_met_mobile_encrypted := encrypt_pii(new.person_met_mobile);
    new.person_met_mobile := '****' || right(regexp_replace(new.person_met_mobile, '\D', '', 'g'), 4);
  end if;
  return new;
end;
$$;

drop trigger if exists encrypt_lead_pii_trigger on public.leads;
create trigger encrypt_lead_pii_trigger before insert or update on public.leads
  for each row execute function public.encrypt_lead_pii();

drop trigger if exists encrypt_profile_pii_trigger on public.profiles;
create trigger encrypt_profile_pii_trigger before insert or update on public.profiles
  for each row execute function public.encrypt_profile_pii();

drop trigger if exists encrypt_visit_pii_trigger on public.visits;
create trigger encrypt_visit_pii_trigger before insert or update on public.visits
  for each row execute function public.encrypt_visit_pii();

-- Decrypted views -- fallback read path for anything not yet migrated to the
-- narrow audit-logged RPCs below (security_invoker so RLS on the base table
-- still applies to whoever queries the view).
create or replace view public.leads_decrypted with (security_invoker = on) as
select l.*, coalesce(decrypt_pii(l.mobile_no_encrypted), l.mobile_no) as mobile_no_real
from public.leads l;

create or replace view public.profiles_decrypted with (security_invoker = on) as
select p.*, coalesce(decrypt_pii(p.phone_encrypted), p.phone) as phone_real,
       coalesce(decrypt_pii(p.email_encrypted), p.email) as email_real
from public.profiles p;

-- ────────────────────────────────────────────────────────────────────────────
-- PII access audit log + narrow, audit-logged decrypt RPCs
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.pii_access_log (
  id          uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id     uuid not null,
  table_name  text not null,
  column_name text not null,
  record_id   uuid,
  purpose     text not null default 'display',
  accessed_at timestamptz not null default now()
);

create index if not exists idx_pii_access_log_org  on public.pii_access_log (organization_id, accessed_at desc);
create index if not exists idx_pii_access_log_user on public.pii_access_log (user_id);

alter table public.pii_access_log enable row level security;

drop policy if exists pii_log_select on public.pii_access_log;
create policy pii_log_select on public.pii_access_log for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager());

drop policy if exists pii_log_insert on public.pii_access_log;
create policy pii_log_insert on public.pii_access_log for insert
  with check (true);  -- written only by the security-definer RPCs below

create or replace function public.get_lead_contact_unmasked(p_lead_id uuid)
returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare
  v_org uuid;
  v_mobile_enc bytea;
  v_mobile text;
begin
  if not public.is_org_manager() then
    raise exception 'Unauthorized';
  end if;
  select organization_id, mobile_no_encrypted, mobile_no into v_org, v_mobile_enc, v_mobile
  from public.leads where id = p_lead_id;
  if v_org is null or v_org not in (select p.organization_id from public.profiles p where p.id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;
  insert into public.pii_access_log (organization_id, user_id, table_name, column_name, record_id, purpose)
  values (v_org, auth.uid(), 'leads', 'mobile_no', p_lead_id, 'sensitive_info_lookup');
  return coalesce(decrypt_pii(v_mobile_enc), v_mobile);
end;
$$;

grant execute on function public.get_lead_contact_unmasked(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Consent records, data-principal requests, breach notifications
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.consent_records (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_type    text not null check (subject_type in ('lead', 'employee', 'person_met')),
  subject_name    text,
  subject_mobile  text,
  lead_id         uuid references public.leads(id) on delete set null,
  visit_id        uuid references public.visits(id) on delete set null,
  purpose         text not null default 'field_visit_data_collection',
  consent_version text not null default '1.0',
  consented_at    timestamptz not null default now(),
  withdrawn_at    timestamptz,
  recorded_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_consent_org on public.consent_records (organization_id, created_at desc);

alter table public.consent_records enable row level security;

drop policy if exists consent_select on public.consent_records;
create policy consent_select on public.consent_records for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

drop policy if exists consent_insert on public.consent_records;
create policy consent_insert on public.consent_records for insert
  with check (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()));

create table if not exists public.data_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  request_type    text not null check (request_type in ('access', 'correction', 'erasure', 'withdraw_consent', 'nominate')),
  subject_name    text not null,
  subject_contact text not null,
  details         text,
  status          text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  due_date        timestamptz not null default (now() + interval '90 days'),
  completed_at    timestamptz,
  admin_notes     text,
  logged_by       uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_data_requests_org on public.data_requests (organization_id, status);

alter table public.data_requests enable row level security;

drop policy if exists data_requests_select on public.data_requests;
create policy data_requests_select on public.data_requests for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager());

drop policy if exists data_requests_write on public.data_requests;
create policy data_requests_write on public.data_requests for all
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager())
  with check (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager());

create table if not exists public.breach_notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  description     text not null,
  impact          text not null,
  remedial_steps  text not null,
  contact_info    text not null,
  triggered_by    uuid not null references public.profiles(id),
  triggered_at    timestamptz not null default now()
);

alter table public.breach_notifications enable row level security;

drop policy if exists breach_select on public.breach_notifications;
create policy breach_select on public.breach_notifications for select
  using (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager());

drop policy if exists breach_insert on public.breach_notifications;
create policy breach_insert on public.breach_notifications for insert
  with check (organization_id in (select p.organization_id from public.profiles p where p.id = auth.uid()) and public.is_org_manager());

