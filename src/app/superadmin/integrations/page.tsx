"use client";

import React, { useEffect, useState } from 'react';
import { integrationService, Integration } from '@/services/integrationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/form-controls';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plug, Gem, Mail, MessageCircle, MessageSquare, CreditCard, PlugZap } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

const ICONS: Record<string, React.ElementType> = {
  gold_rate: Gem,
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  payment_gateway: CreditCard,
};

function statusBadge(item: Integration): { variant: 'success' | 'danger' | 'neutral' | 'draft'; label: string } {
  switch (item.status) {
    case 'enabled':
      return { variant: 'success', label: 'Enabled' };
    case 'connection_failed':
      return { variant: 'danger', label: 'Connection Failed' };
    case 'configured_disabled':
      return { variant: 'draft', label: 'Configured — Disabled' };
    default:
      return { variant: 'neutral', label: 'Not Configured' };
  }
}

export default function SuperAdminIntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [togglingProvider, setTogglingProvider] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await integrationService.list());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load integrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTest = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const result = await integrationService.testConnection(provider);
      setToast({ message: result.message, type: result.status === 'success' ? 'success' : 'error' });
      await load();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Test failed.', type: 'error' });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggle = async (item: Integration) => {
    setTogglingProvider(item.provider);
    try {
      await integrationService.setEnabled(item.provider, !item.enabled);
      setToast({ message: `${item.label} ${!item.enabled ? 'enabled' : 'disabled'}.`, type: 'success' });
      await load();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not update integration.', type: 'error' });
    } finally {
      setTogglingProvider(null);
    }
  };

  const grouped = items.reduce<Record<string, Integration[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    gold_rate: 'Gold Rates',
    messaging: 'Messaging',
    payments: 'Payments',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">Integrations</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Provider connection status platform-wide. Credentials are set via environment variables and never shown here.
          </p>
        </div>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && !loadError && Object.entries(grouped).map(([category, providers]) => (
        <Card key={category} className="bg-white border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="font-display font-bold text-sm text-[#0B0E23] flex items-center gap-2">
            <Plug className="w-4 h-4 text-gold" /> {categoryLabels[category] || category}
          </h2>
          <div className="space-y-2">
            {providers.map((item) => {
              const Icon = ICONS[item.provider] || PlugZap;
              const badge = statusBadge(item);
              return (
                <div key={item.provider} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0B0E23]">{item.label}</p>
                      {item.lastError && item.status === 'connection_failed' && (
                        <p className="text-[11px] text-red-600 mt-0.5">{item.lastError}</p>
                      )}
                      {item.lastTestedAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Last tested {new Date(item.lastTestedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={badge.variant} dot>{badge.label}</Badge>
                    <Button
                      size="sm" variant="outline" isLoading={testingProvider === item.provider}
                      disabled={!item.configured} onClick={() => handleTest(item.provider)}
                    >
                      Test Connection
                    </Button>
                    <Switch
                      checked={item.enabled}
                      disabled={togglingProvider === item.provider || (!item.configured && !item.enabled)}
                      onChange={() => handleToggle(item)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
