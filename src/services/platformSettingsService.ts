import { apiClient } from '@/lib/apiClient';

interface ProviderStatus {
  provider: string;
  label: string;
  configured: boolean;
}

interface BackendPlatformSettings {
  platform_name: string;
  support_email: string | null;
  support_phone: string | null;
  default_currency: string;
  default_timezone: string;
  maintenance_mode: boolean;
  feature_flags: string[];
  updated_at: string;
  email_status: ProviderStatus;
  whatsapp_status: ProviderStatus;
  security_status: Record<string, boolean>;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color_primary: string | null;
  brand_color_secondary: string | null;
  login_tagline: string | null;
  email_from_name: string | null;
  custom_domain: string | null;
  custom_domain_status: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultTimezone: string;
  maintenanceMode: boolean;
  featureFlags: string[];
  updatedAt: string;
  emailStatus: ProviderStatus;
  whatsappStatus: ProviderStatus;
  securityStatus: Record<string, boolean>;
  logoUrl: string;
  faviconUrl: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
  loginTagline: string;
  emailFromName: string;
  customDomain: string;
  customDomainStatus: string;
}

export interface PlatformSettingsFormData {
  platformName?: string;
  supportEmail?: string;
  supportPhone?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
  maintenanceMode?: boolean;
  featureFlags?: string[];
  logoUrl?: string;
  faviconUrl?: string;
  brandColorPrimary?: string;
  brandColorSecondary?: string;
  loginTagline?: string;
  emailFromName?: string;
  customDomain?: string;
}

function mapSettings(raw: BackendPlatformSettings): PlatformSettings {
  return {
    platformName: raw.platform_name,
    supportEmail: raw.support_email ?? '',
    supportPhone: raw.support_phone ?? '',
    defaultCurrency: raw.default_currency,
    defaultTimezone: raw.default_timezone,
    maintenanceMode: raw.maintenance_mode,
    featureFlags: raw.feature_flags ?? [],
    updatedAt: raw.updated_at,
    emailStatus: raw.email_status,
    whatsappStatus: raw.whatsapp_status,
    securityStatus: raw.security_status,
    logoUrl: raw.logo_url ?? '',
    faviconUrl: raw.favicon_url ?? '',
    brandColorPrimary: raw.brand_color_primary ?? '',
    brandColorSecondary: raw.brand_color_secondary ?? '',
    loginTagline: raw.login_tagline ?? '',
    emailFromName: raw.email_from_name ?? '',
    customDomain: raw.custom_domain ?? '',
    customDomainStatus: raw.custom_domain_status,
  };
}

export const platformSettingsService = {
  /** GET /api/v1/superadmin/platform/settings */
  async get(): Promise<PlatformSettings> {
    const res = await apiClient.get<BackendPlatformSettings>('/superadmin/platform/settings', { auth: true });
    return mapSettings(res.data);
  },

  /** PUT /api/v1/superadmin/platform/settings */
  async update(data: PlatformSettingsFormData): Promise<PlatformSettings> {
    const res = await apiClient.put<BackendPlatformSettings>(
      '/superadmin/platform/settings',
      {
        ...(data.platformName !== undefined && { platform_name: data.platformName }),
        ...(data.supportEmail !== undefined && { support_email: data.supportEmail }),
        ...(data.supportPhone !== undefined && { support_phone: data.supportPhone }),
        ...(data.defaultCurrency !== undefined && { default_currency: data.defaultCurrency }),
        ...(data.defaultTimezone !== undefined && { default_timezone: data.defaultTimezone }),
        ...(data.maintenanceMode !== undefined && { maintenance_mode: data.maintenanceMode }),
        ...(data.featureFlags !== undefined && { feature_flags: data.featureFlags }),
        ...(data.logoUrl !== undefined && { logo_url: data.logoUrl }),
        ...(data.faviconUrl !== undefined && { favicon_url: data.faviconUrl }),
        ...(data.brandColorPrimary !== undefined && data.brandColorPrimary && { brand_color_primary: data.brandColorPrimary }),
        ...(data.brandColorSecondary !== undefined && data.brandColorSecondary && { brand_color_secondary: data.brandColorSecondary }),
        ...(data.loginTagline !== undefined && { login_tagline: data.loginTagline }),
        ...(data.emailFromName !== undefined && { email_from_name: data.emailFromName }),
        ...(data.customDomain !== undefined && { custom_domain: data.customDomain }),
      },
      { auth: true }
    );
    return mapSettings(res.data);
  },
};
