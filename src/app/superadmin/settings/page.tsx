"use client";

import React, { useEffect, useState } from 'react';
import { platformSettingsService, PlatformSettings, PlatformSettingsFormData } from '@/services/platformSettingsService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/form-controls';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<PlatformSettingsFormData>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await platformSettingsService.get();
      setSettings(data);
      setForm({
        platformName: data.platformName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        defaultCurrency: data.defaultCurrency,
        defaultTimezone: data.defaultTimezone,
        maintenanceMode: data.maintenanceMode,
      });
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await platformSettingsService.update(form);
      setSettings(updated);
      setToast({ message: 'Platform settings saved.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">Platform Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Non-sensitive, platform-wide configuration. Provider credentials are configured via environment variables — see Integrations.
          </p>
        </div>
        {settings && (
          <Button size="sm" isLoading={saving} onClick={handleSave} className="bg-gold hover:bg-gold-dark text-white font-bold h-9">
            Save Changes
          </Button>
        )}
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && settings && (
        <>
          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="font-display font-bold text-sm text-[#0B0E23] flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold" /> General
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Platform Name</label>
                <Input value={form.platformName || ''} onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Default Currency</label>
                <Input value={form.defaultCurrency || ''} onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Support Email</label>
                <Input value={form.supportEmail || ''} onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Support Phone</label>
                <Input value={form.supportPhone || ''} onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Default Timezone</label>
                <Input value={form.defaultTimezone || ''} onChange={(e) => setForm((f) => ({ ...f, defaultTimezone: e.target.value }))} />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-3">
            <h2 className="font-display font-bold text-sm text-[#0B0E23]">System</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Maintenance Mode</p>
                <p className="text-[11px] text-slate-400">Shows a maintenance banner platform-wide when enabled.</p>
              </div>
              <Switch checked={!!form.maintenanceMode} onChange={(v) => setForm((f) => ({ ...f, maintenanceMode: v }))} />
            </div>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-3">
            <h2 className="font-display font-bold text-sm text-[#0B0E23]">Provider Status</h2>
            <p className="text-[11px] text-slate-400">
              Read-only here — configure credentials in SuperAdmin &gt; Integrations. Secrets are never shown.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Mail className="w-4 h-4 text-slate-400" /> Email / SMTP</span>
                <Badge variant={settings.emailStatus.configured ? 'success' : 'neutral'} dot>
                  {settings.emailStatus.configured ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
              <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><MessageCircle className="w-4 h-4 text-slate-400" /> WhatsApp</span>
                <Badge variant={settings.whatsappStatus.configured ? 'success' : 'neutral'} dot>
                  {settings.whatsappStatus.configured ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
              <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 sm:col-span-2">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><ShieldCheck className="w-4 h-4 text-slate-400" /> Secret Key Rotated From Default</span>
                <Badge variant={settings.securityStatus.secret_key_rotated ? 'success' : 'danger'} dot>
                  {settings.securityStatus.secret_key_rotated ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </Card>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
