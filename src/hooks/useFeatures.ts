import { useOrganization } from '@/contexts/OrganizationContext';

interface ServiceFlags {
  calling?: boolean;
  whatsapp?: boolean;
  email?: boolean;
  apollo?: boolean;
}

interface UsageLimits {
  users?: number;
  storage_gb?: number;
}

interface Settings {
  timezone?: string;
  date_format?: string;
  currency?: string;
}

interface ApolloConfig {
  enrich_on_create?: boolean;
  auto_enrich_enabled?: boolean;
  api_key?: string;
  enabled?: boolean;
  daily_credit_limit?: number;
}

export function useFeatures() {
  const { currentOrganization } = useOrganization();

  const services = (currentOrganization?.services_enabled as ServiceFlags) || {};
  const limits = (currentOrganization?.usage_limits as UsageLimits) || {};
  const settings = (currentOrganization?.settings as Settings) || {};
  const apolloConfig = (currentOrganization?.apollo_config as ApolloConfig) || {};

  return {
    // Service availability
    isCallingEnabled: services.calling ?? false,
    isWhatsAppEnabled: services.whatsapp ?? false,
    isEmailEnabled: services.email ?? false,
    isApolloEnabled: services.apollo ?? false,

    // Subscription status
    subscriptionActive: currentOrganization?.subscription_active ?? false,

    // Usage limits
    maxUsers: limits.users ?? 0,
    maxStorageGB: limits.storage_gb ?? 0,

    // Email automation
    maxAutomationEmailsPerDay: currentOrganization?.max_automation_emails_per_day ?? 0,

    // Apollo config
    apolloConfig,

    // Settings
    settings,
    timezone: settings.timezone || 'UTC',
    dateFormat: settings.date_format || 'MM/DD/YYYY',
    currency: settings.currency || 'USD',

    // Helper: Check if any feature is disabled
    hasLimitations: !services.calling || !services.whatsapp || !services.email || !services.apollo,
  };
}
