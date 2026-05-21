-- Comprehensive fix: Grant proper table-level permissions to anon and authenticated roles.
-- Supabase RLS policies exist but table-level GRANTs were missing from the pg_dump migration,
-- preventing the anon role from reading organizations and authenticated role from creating them.

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- anon: needs SELECT on organizations (sign-in dropdown)
-- authenticated: needs full CRUD for normal app operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables also get proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
