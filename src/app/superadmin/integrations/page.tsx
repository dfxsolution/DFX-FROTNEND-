"use client";

import React, { useEffect, useState } from 'react';
import { integrationService, Integration } from '@/services/integrationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch, Checkbox } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plug, Gem, Mail, MessageCircle, MessageSquare, CreditCard, PlugZap, Settings2, Trash2 } from 'lucide-react';
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
      return { variant: 'draft', label: 'Configured' };
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

  const [configTarget, setConfigTarget] = useState<Integration | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  const openConfigure = (item: Integration) => {
    const initial: Record<string, string | number | boolean> = {};
    for (const f of item.fields) {
      // Secret fields never get their masked value re-populated into the
      // form — leaving them blank means "keep existing" on save (the
      // backend merges partial saves onto the stored config).
      if (!f.secret && item.maskedConfig[f.key] !== undefined) initial[f.key] = item.maskedConfig[f.key];
    }
    setFormValues(initial);
    setFormError('');
    setConfigTarget(item);
  };

  const handleSaveConfig = async () => {
    if (!configTarget) return;
    setFormError('');
    const missing = configTarget.fields.filter((f) => f.required && !formValues[f.key] && configTarget.maskedConfig[f.key] === undefined);
    if (missing.length > 0) {
      setFormError(`Missing required field(s): ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      // Only send fields the SuperAdmin actually typed something into —
      // blank secret fields mean "leave the stored value untouched".
      const toSend = Object.fromEntries(Object.entries(formValues).filter(([, v]) => v !== '' && v !== undefined));
      await integrationService.saveConfig(configTarget.provider, toSend);
      setToast({ message: `${configTarget.label} configuration saved. Run Test Connection before enabling.`, type: 'success' });
      setConfigTarget(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearConfig = async () => {
    if (!configTarget) return;
    setClearing(true);
    try {
      await integrationService.clearConfig(configTarget.provider);
      setToast({ message: `${configTarget.label} configuration removed.`, type: 'success' });
      setConfigTarget(null);
      await load();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not remove configuration.', type: 'error' });
    } finally {
      setClearing(false);
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
            Configure a provider, test the connection, then enable it. Credentials are encrypted at rest and never shown again.
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
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Badge variant={badge.variant} dot>{badge.label}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openConfigure(item)}>
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Configure
                    </Button>
                    <Button
                      size="sm" variant="outline" isLoading={testingProvider === item.provider}
                      disabled={!item.configured} onClick={() => handleTest(item.provider)}
                    >
                      Test Connection
                    </Button>
                    <Switch
                      checked={item.enabled}
                      disabled={togglingProvider === item.provider || (!item.configured && !item.enabled) || item.lastTestStatus !== 'success'}
                      onChange={() => handleToggle(item)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Dialog isOpen={!!configTarget} onClose={() => !saving && setConfigTarget(null)} title={`Configure ${configTarget?.label ?? ''}`}>
        {configTarget && (
          <div className="space-y-3.5 text-xs">
            {formError && (
              <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}
            {configTarget.fields.length === 0 ? (
              <p className="text-slate-500">No configurable fields for this provider yet.</p>
            ) : (
              configTarget.fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase text-[10px]">
                    {f.label} {f.required && '*'}
                  </label>
                  {f.type === 'boolean' ? (
                    <Checkbox
                      checked={!!formValues[f.key]}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.checked }))}
                    />
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : f.secret ? 'password' : 'text'}
                      value={String(formValues[f.key] ?? '')}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.secret && configTarget.maskedConfig[f.key] ? String(configTarget.maskedConfig[f.key]) : ''}
                    />
                  )}
                  {f.secret && configTarget.maskedConfig[f.key] && (
                    <p className="text-[10px] text-slate-400">Currently set: {configTarget.maskedConfig[f.key]}. Leave blank to keep it.</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        <DialogFooter>
          {configTarget?.configured && (
            <Button variant="outline" size="sm" isLoading={clearing} onClick={handleClearConfig} className="border-red-200 text-red-700 hover:bg-red-50 mr-auto">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove Config
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfigTarget(null)} disabled={saving}>
            Cancel
          </Button>
          {configTarget && configTarget.fields.length > 0 && (
            <Button size="sm" isLoading={saving} onClick={handleSaveConfig}>
              Save
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
