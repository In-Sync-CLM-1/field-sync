import type { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];

/**
 * Apply organization branding to the app
 * - Updates CSS custom properties for primary color
 * - Updates favicon with logo
 * - Stores branding in localStorage for quick access
 */
export function applyOrganizationBranding(org: Organization) {
  if (!org) return;

  // Apply primary color to CSS variables
  if (org.primary_color) {
    document.documentElement.style.setProperty('--primary', org.primary_color);
    
    // Also update Tailwind's primary color if needed
    const style = document.createElement('style');
    style.id = 'org-branding-style';
    
    // Remove existing style if present
    const existingStyle = document.getElementById('org-branding-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.textContent = `
      :root {
        --color-primary: ${org.primary_color};
      }
    `;
    document.head.appendChild(style);
  }

  // Update favicon if logo_url exists
  if (org.logo_url) {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = org.logo_url;
  }

  // Update document title with org name
  document.title = `${org.name} - Field Sales CRM`;

  // Store for use in UI components (header, sidebar, etc.)
  localStorage.setItem('org_branding', JSON.stringify({
    id: org.id,
    name: org.name,
    logo_url: org.logo_url,
    primary_color: org.primary_color,
    slug: org.slug
  }));

  console.log('Applied branding for:', org.name);
}

/**
 * Get cached branding data
 */
export function getCachedBranding() {
  const cached = localStorage.getItem('org_branding');
  return cached ? JSON.parse(cached) : null;
}

/**
 * Clear branding (on logout)
 */
export function clearBranding() {
  localStorage.removeItem('org_branding');
  document.documentElement.style.removeProperty('--primary');
  
  // Remove custom style element
  const existingStyle = document.getElementById('org-branding-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.title = 'Field Sales CRM';
}
