/**
 * Maps CRM roles to application roles
 * Update this mapping based on your CRM's actual role structure
 */
export type AppRole = 
  | 'platform_admin'
  | 'super_admin'
  | 'admin'
  | 'sales_manager'
  | 'sales_agent'
  | 'support_manager'
  | 'support_agent'
  | 'analyst'
  | 'field_agent';

export const CRM_ROLE_MAPPING: Record<string, AppRole> = {
  // Super Admin - Highest level administrative access
  'Super Admin': 'super_admin',
  'SuperAdmin': 'super_admin',
  'System Administrator': 'super_admin',
  
  // Admin - Administrative access
  'Admin': 'admin',
  'Administrator': 'admin',
  'System Admin': 'admin',
  
  // Sales Manager - Sales team management role
  'Sales Manager': 'sales_manager',
  'Regional Sales Manager': 'sales_manager',
  'Sales Team Lead': 'sales_manager',
  
  // Sales Agent - Sales team member role
  'Sales Agent': 'sales_agent',
  'Sales Rep': 'sales_agent',
  'Sales Representative': 'sales_agent',
  'Sales Executive': 'sales_agent',
  
  // Support Manager - Support team management role
  'Support Manager': 'support_manager',
  'Customer Support Manager': 'support_manager',
  'Support Team Lead': 'support_manager',
  
  // Support Agent - Support team member role
  'Support Agent': 'support_agent',
  'Customer Support Agent': 'support_agent',
  'Support Rep': 'support_agent',
  'Support Representative': 'support_agent',
  
  // Analyst - Analytics and reporting role
  'Analyst': 'analyst',
  'Data Analyst': 'analyst',
  'Business Analyst': 'analyst',
  'Analytics Manager': 'analyst',
  
  // Field Agent - Default role
  'Field Agent': 'field_agent',
  'Agent': 'field_agent',
  'Field Worker': 'field_agent',
};

/**
 * Get application role from CRM role
 */
export function getAppRole(crmRole: string): AppRole {
  return CRM_ROLE_MAPPING[crmRole] || 'field_agent';
}

/**
 * Get all mapped CRM roles for a given app role
 */
export function getCRMRolesForAppRole(appRole: AppRole): string[] {
  return Object.entries(CRM_ROLE_MAPPING)
    .filter(([_, role]) => role === appRole)
    .map(([crmRole]) => crmRole);
}

/**
 * Role hierarchy and permissions description
 */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  platform_admin: 'Platform administrator - highest level system access (hidden)',
  super_admin: 'Highest level administrative access - full system control',
  admin: 'Administrative access - can manage users and settings',
  sales_manager: 'Sales team management role - oversees sales operations',
  sales_agent: 'Sales team member role - handles sales activities',
  support_manager: 'Support team management role - oversees support operations',
  support_agent: 'Support team member role - handles customer support',
  analyst: 'Analytics and reporting role - data analysis and insights',
  field_agent: 'Field operations role - on-ground activities',
};
