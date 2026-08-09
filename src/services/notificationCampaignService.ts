import { apiClient } from '@/lib/apiClient';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH';
export type NotificationTargetType = 'ALL' | 'CUSTOMERS' | 'SCHEME';
export type NotificationCampaignStatus = 'DRAFT' | 'SENT' | 'FAILED' | 'CANCELLED';

interface BackendCampaign {
  id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  target_type: NotificationTargetType;
  target_ids: string[];
  status: NotificationCampaignStatus;
  recipient_count: number | null;
  sent_at: string | null;
  error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  targetType: NotificationTargetType;
  targetIds: string[];
  status: NotificationCampaignStatus;
  recipientCount: number | null;
  sentAt: string | null;
  error: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCampaignFormData {
  title: string;
  body: string;
  channel: NotificationChannel;
  targetType: NotificationTargetType;
  targetIds: string[];
}

export const NOTIFICATION_CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: 'IN_APP', label: 'In-App' },
  { key: 'EMAIL', label: 'Email' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'SMS', label: 'SMS' },
  { key: 'PUSH', label: 'Push' },
];

export const NOTIFICATION_TARGET_TYPES: { key: NotificationTargetType; label: string }[] = [
  { key: 'ALL', label: 'All customers' },
  { key: 'CUSTOMERS', label: 'Specific customers' },
  { key: 'SCHEME', label: 'Customers enrolled in a scheme' },
];

function mapCampaign(raw: BackendCampaign): NotificationCampaign {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    channel: raw.channel,
    targetType: raw.target_type,
    targetIds: raw.target_ids ?? [],
    status: raw.status,
    recipientCount: raw.recipient_count,
    sentAt: raw.sent_at,
    error: raw.error,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const notificationCampaignService = {
  /** GET /api/v1/admin/notifications */
  async list(status?: NotificationCampaignStatus): Promise<NotificationCampaign[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await apiClient.get<{ notifications: BackendCampaign[] }>(`/admin/notifications${qs}`, { auth: true });
    return res.data.notifications.map(mapCampaign);
  },

  /** GET /api/v1/admin/notifications/{id} */
  async getById(id: string): Promise<NotificationCampaign> {
    const res = await apiClient.get<{ notification: BackendCampaign }>(`/admin/notifications/${id}`, { auth: true });
    return mapCampaign(res.data.notification);
  },

  /** POST /api/v1/admin/notifications */
  async create(data: NotificationCampaignFormData): Promise<NotificationCampaign> {
    const res = await apiClient.post<{ notification: BackendCampaign }>(
      '/admin/notifications',
      { title: data.title, body: data.body, channel: data.channel, target_type: data.targetType, target_ids: data.targetIds },
      { auth: true }
    );
    return mapCampaign(res.data.notification);
  },

  /** PUT /api/v1/admin/notifications/{id} — draft only. */
  async update(id: string, data: Partial<NotificationCampaignFormData>): Promise<NotificationCampaign> {
    const res = await apiClient.put<{ notification: BackendCampaign }>(
      `/admin/notifications/${id}`,
      {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.targetType !== undefined && { target_type: data.targetType }),
        ...(data.targetIds !== undefined && { target_ids: data.targetIds }),
      },
      { auth: true }
    );
    return mapCampaign(res.data.notification);
  },

  /** POST /api/v1/admin/notifications/{id}/send */
  async send(id: string): Promise<NotificationCampaign> {
    const res = await apiClient.post<{ notification: BackendCampaign }>(`/admin/notifications/${id}/send`, {}, { auth: true });
    return mapCampaign(res.data.notification);
  },

  /** DELETE /api/v1/admin/notifications/{id} — cancels a draft/failed campaign. */
  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/admin/notifications/${id}`, { auth: true });
  },
};
