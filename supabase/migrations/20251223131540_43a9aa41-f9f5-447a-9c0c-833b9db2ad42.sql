-- Remove CRM-specific columns from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS crm_customer_id;
ALTER TABLE public.customers DROP COLUMN IF EXISTS last_synced_from_crm;

-- Remove CRM-specific columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS crm_user_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS crm_role;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_synced_from_crm;