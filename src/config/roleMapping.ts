/**
 * Maps CRM roles to application roles.
 * Only three roles: platform_admin, admin, agent.
 */
export type AppRole =
  | 'platform_admin'
  | 'admin'
  | 'agent';

export const CRM_ROLE_MAPPING: Record<string, AppRole> = {
  // Platform Admin - Platform-wide access (hidden)
  'Platform Admin': 'platform_admin',
  'PlatformAdmin': 'platform_admin',

  // Admin - Organization-level administrative access
  'Admin': 'admin',
  'Administrator': 'admin',
  'System Admin': 'admin',
  'Super Admin': 'admin',
  'SuperAdmin': 'admin',
  'System Administrator': 'admin',
  'Branch Manager': 'admin',
  'BranchManager': 'admin',
  'Manager': 'admin',
  'Regional Manager': 'admin',
  'Team Lead': 'admin',
  'Sales Manager': 'admin',
  'Support Manager': 'admin',

  // Agent - Field-level operations
  'Agent': 'agent',
  'Sales Officer': 'agent',
  'SalesOfficer': 'agent',
  'Field Agent': 'agent',
  'Sales Agent': 'agent',
  'Sales Rep': 'agent',
  'Sales Representative': 'agent',
  'Sales Executive': 'agent',
  'Support Agent': 'agent',
  'Field Worker': 'agent',
};

/**
 * Get application role from CRM role
 */
export function getAppRole(crmRole: string): AppRole {
  return CRM_ROLE_MAPPING[crmRole] || 'agent';
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
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  platform_admin: 'Platform administrator - cross-org system access',
  admin: 'Organization admin - manages team and settings',
  agent: 'Field agent - handles field activities',
};
