-- Migrate existing roles to new values
-- field_agent, sales_agent, support_agent, analyst -> sales_officer
UPDATE user_roles SET role = 'sales_officer' WHERE role IN ('field_agent', 'sales_agent', 'support_agent', 'analyst');

-- manager, sales_manager, support_manager -> branch_manager
UPDATE user_roles SET role = 'branch_manager' WHERE role IN ('manager', 'sales_manager', 'support_manager');