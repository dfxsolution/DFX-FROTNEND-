import { apiClient } from '@/lib/apiClient';

interface BackendStaff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  member_since: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  memberSince: string;
  createdAt: string;
}

export interface StaffCreateData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

function mapStaff(raw: BackendStaff): Staff {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    isActive: raw.is_active,
    memberSince: raw.member_since ?? '',
    createdAt: raw.created_at,
  };
}

export const staffService = {
  /** GET /api/v1/admin/staff */
  async getStaff(): Promise<Staff[]> {
    const res = await apiClient.get<{ staff: BackendStaff[] }>('/admin/staff', { auth: true });
    return res.data.staff.map(mapStaff);
  },

  /** POST /api/v1/admin/staff — always creates a Staff-role account, never Admin. */
  async createStaff(data: StaffCreateData): Promise<Staff> {
    const res = await apiClient.post<{ staff: BackendStaff }>('/admin/staff', data, { auth: true });
    return mapStaff(res.data.staff);
  },

  /** PUT /api/v1/admin/staff/{id}/status */
  async setStaffStatus(id: string, isActive: boolean): Promise<Staff> {
    const res = await apiClient.put<{ staff: BackendStaff }>(
      `/admin/staff/${id}/status`,
      { is_active: isActive },
      { auth: true }
    );
    return mapStaff(res.data.staff);
  },
};
