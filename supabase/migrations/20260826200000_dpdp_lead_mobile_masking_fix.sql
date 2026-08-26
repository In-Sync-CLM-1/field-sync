-- Correction: leads.mobile_no must stay in plain text.
--
-- Masking it in place (like profiles.phone/email and visits.person_met_mobile)
-- broke two real things discovered in live e2e testing right after shipping:
--   1. Call/WhatsApp buttons on the lead detail page and agent dashboard dial
--      the masked string ("****1234") instead of a real number.
--   2. useAssignments.ts's bulk-import dedup does `.in('mobile_no', phones)`
--      against real incoming numbers -- against a masked column this never
--      matches, so every re-import would silently create duplicate leads
--      instead of updating the existing lead.
--
-- Unlike profiles.phone/email (only ever displayed, never dialed or used as a
-- lookup key) and visits.person_met_mobile (write-once, never read back),
-- leads.mobile_no is a live business key this app dials and dedupes against
-- throughout. Keep the encrypted backup column (still populated, still gives
-- the audit-logged decrypt RPC and defense-in-depth if the DB is ever
-- exfiltrated) but stop overwriting the plaintext.

create or replace function public.encrypt_lead_pii()
returns trigger language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  if new.mobile_no is not null and new.mobile_no != '' then
    new.mobile_no_encrypted := encrypt_pii(new.mobile_no);
  end if;
  return new;
end;
$$;

-- Restore the real number for every row the earlier (masking) version of this
-- trigger already touched.
update public.leads
set mobile_no = decrypt_pii(mobile_no_encrypted)
where mobile_no_encrypted is not null and mobile_no like '****%';
