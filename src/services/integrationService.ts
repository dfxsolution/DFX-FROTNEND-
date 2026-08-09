import { apiClient } from '@/lib/apiClient';

export type IntegrationStatus = 'not_configured' | 'configured_disabled' | 'enabled' | 'connection_failed';

export interface Integration {
  provider: string;
  label: string;
  category: string;
  enabled: boolean;
  configured: boolean;
  status: IntegrationStatus;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastError: string | null;
}

interface BackendIntegration {
  provider: string;
  label: string;
  category: string;
  enabled: boolean;
  configured: boolean;
  status: IntegrationStatus;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_error: string | null;
}

export interface Webhook {
  id: string;
  url: string;
  eventType: string;
  isActive: boolean;
  maxRetries: number;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
  createdAt: string;
}

interface BackendWebhook {
  id: string;
  url: string;
  event_type: string;
  is_active: boolean;
  max_retries: number;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  created_at: string;
}

function mapIntegration(raw: BackendIntegration): Integration {
  return {
    provider: raw.provider,
    label: raw.label,
    category: raw.category,
    enabled: raw.enabled,
    configured: raw.configured,
    status: raw.status,
    lastTestedAt: raw.last_tested_at,
    lastTestStatus: raw.last_test_status,
    lastError: raw.last_error,
  };
}

function mapWebhook(raw: BackendWebhook): Webhook {
  return {
    id: raw.id,
    url: raw.url,
    eventType: raw.event_type,
    isActive: raw.is_active,
    maxRetries: raw.max_retries,
    lastDeliveryAt: raw.last_delivery_at,
    lastDeliveryStatus: raw.last_delivery_status,
    createdAt: raw.created_at,
  };
}

export const integrationService = {
  /** GET /api/v1/superadmin/integrations */
  async list(): Promise<Integration[]> {
    const res = await apiClient.get<{ integrations: BackendIntegration[] }>('/superadmin/integrations', { auth: true });
    return res.data.integrations.map(mapIntegration);
  },

  /** PUT /api/v1/superadmin/integrations/{provider} */
  async setEnabled(provider: string, enabled: boolean): Promise<Integration> {
    const res = await apiClient.put<{ integration: BackendIntegration }>(
      `/superadmin/integrations/${provider}`,
      { enabled },
      { auth: true }
    );
    return mapIntegration(res.data.integration);
  },

  /** POST /api/v1/superadmin/integrations/{provider}/test */
  async testConnection(provider: string): Promise<{ status: string; message: string }> {
    const res = await apiClient.post<{ status: string; message: string }>(
      `/superadmin/integrations/${provider}/test`, {}, { auth: true }
    );
    return { status: res.data.status, message: res.data.message };
  },

  /** GET /api/v1/superadmin/webhooks */
  async listWebhooks(): Promise<Webhook[]> {
    const res = await apiClient.get<{ webhooks: BackendWebhook[] }>('/superadmin/webhooks', { auth: true });
    return res.data.webhooks.map(mapWebhook);
  },

  /** POST /api/v1/superadmin/webhooks — the returned signing secret is shown once and never again. */
  async createWebhook(url: string, eventType: string): Promise<Webhook & { signingSecret: string }> {
    const res = await apiClient.post<BackendWebhook & { signing_secret: string }>(
      '/superadmin/webhooks',
      { url, event_type: eventType },
      { auth: true }
    );
    return { ...mapWebhook(res.data), signingSecret: res.data.signing_secret };
  },

  /** DELETE /api/v1/superadmin/webhooks/{id} */
  async deleteWebhook(id: string): Promise<void> {
    await apiClient.delete(`/superadmin/webhooks/${id}`, { auth: true });
  },
};
