-- Fix: Allow unauthenticated (anon) users to read active organizations on the sign-in page.
-- The RLS policy "Anyone can view active organizations" exists, but the anon role
-- needs an explicit table-level SELECT grant for it to take effect.

-- Grant SELECT on organizations to the anon role (used by unauthenticated Supabase clients)
GRANT SELECT ON public.organizations TO anon;

-- Ensure the RLS policy exists (safe to run - will skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Anyone can view active organizations'
  ) THEN
    CREATE POLICY "Anyone can view active organizations"
      ON public.organizations
      FOR SELECT
      USING (is_active = true);
  END IF;
END
$$;
