/**
 * Maps CRM roles to application roles
 * Update this mapping based on your CRM's actual role structure
 */
export type AppRole = 
  | 'platform_admin'
  | 'super_admin'
  | 'admin'
  | 'branch_manager'
  | 'sales_officer';

export const CRM_ROLE_MAPPING: Record<string, AppRole> = {
  // Platform Admin - Platform-wide access (hidden)
  'Platform Admin': 'platform_admin',
  'PlatformAdmin': 'platform_admin',
  
  // Super Admin - Highest level administrative access
  'Super Admin': 'super_admin',
  'SuperAdmin': 'super_admin',
  'System Administrator': 'super_admin',
  
  // Admin - Administrative access
  'Admin': 'admin',
  'Administrator': 'admin',
  'System Admin': 'admin',
  
  // Branch Manager - Branch-level management
  'Branch Manager': 'branch_manager',
  'BranchManager': 'branch_manager',
  'Manager': 'branch_manager',
  'Regional Manager': 'branch_manager',
  'Team Lead': 'branch_manager',
  'Sales Manager': 'branch_manager',
  'Support Manager': 'branch_manager',
  
  // Sales Officer - Field-level operations
  'Sales Officer': 'sales_officer',
  'SalesOfficer': 'sales_officer',
  'Field Agent': 'sales_officer',
  'Agent': 'sales_officer',
  'Sales Agent': 'sales_officer',
  'Sales Rep': 'sales_officer',
  'Sales Representative': 'sales_officer',
  'Sales Executive': 'sales_officer',
  'Support Agent': 'sales_officer',
  'Field Worker': 'sales_officer',
};

/**
 * Get application role from CRM role
 */
export function getAppRole(crmRole: string): AppRole {
  return CRM_ROLE_MAPPING[crmRole] || 'sales_officer';
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
  branch_manager: 'Branch-level management - oversees team operations',
  sales_officer: 'Sales operations role - handles field activities',
};