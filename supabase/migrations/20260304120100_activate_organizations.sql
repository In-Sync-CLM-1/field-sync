-- Fix: All organizations have is_active = false, preventing them from appearing
-- in the sign-in dropdown. Set all existing organizations to active.
UPDATE public.organizations SET is_active = true WHERE is_active = false;
