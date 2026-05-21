-- Update visits foreign key to reference leads instead of customers
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_customer_id_fkey;
ALTER TABLE visits ADD CONSTRAINT visits_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES leads(id);

-- Update plan_enrollments foreign key to reference leads instead of customers
ALTER TABLE plan_enrollments DROP CONSTRAINT IF EXISTS plan_enrollments_customer_id_fkey;
ALTER TABLE plan_enrollments ADD CONSTRAINT plan_enrollments_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES leads(id);