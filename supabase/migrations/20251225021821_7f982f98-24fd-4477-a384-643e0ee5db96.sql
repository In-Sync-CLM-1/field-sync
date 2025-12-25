-- Add new enum values to app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales_officer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'branch_manager';