import { TenantBranding, UserRole } from '@/types';
import { DEFAULT_BRANDING } from '@/constants';
import { customerService } from '@/services/customerService';

export const tenantService = {
  /**
   * Only the Admin role can read /admin/tenant/profile (tenant-scoped, RBAC-gated).
   * Customer and SuperAdmin have no backend-accessible branding source today, so
   * they fall back to the platform default rather than a fake per-tenant value.
   */
  async getBranding(role?: UserRole): Promise<TenantBranding> {
    if (role !== 'admin') return DEFAULT_BRANDING;

    try {
      const profile = await customerService.getTenantProfile();
      return {
        ...DEFAULT_BRANDING,
        brandName: profile.name || DEFAULT_BRANDING.brandName,
        brandColor: profile.brandColor || DEFAULT_BRANDING.brandColor,
      };
    } catch {
      return DEFAULT_BRANDING;
    }
  },
};
