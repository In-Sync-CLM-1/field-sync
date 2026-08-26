-- Split out from 20260318120000_v2_simplification.sql: a new enum value must be
-- committed before it can be used in the same migration run's later UPDATE statements
-- (Postgres error 55P04, "unsafe use of new value of enum type").
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'agent'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'agent';
  END IF;
END $$;
