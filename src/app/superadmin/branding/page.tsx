"use client";

import React, { useEffect, useState } from 'react';
import { platformSettingsService, PlatformSettings, PlatformSettingsFormData } from '@/services/platformSettingsService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Globe, Info } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

export default function SuperAdminBrandingPage() {
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
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        brandColorPrimary: data.brandColorPrimary,
        brandColorSecondary: data.brandColorSecondary,
        loginTagline: data.loginTagline,
        emailFromName: data.emailFromName,
        customDomain: data.customDomain,
      });
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load branding settings.');
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
      setToast({ message: 'Branding saved.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not save branding.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">Branding &amp; White Label</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Platform-level identity — shown on the login page, emails, and anywhere no tenant-specific branding applies.
          </p>
        </div>
        {settings && (
          <Button size="sm" isLoading={saving} onClick={handleSave} className="bg-gold hover:bg-gold-dark text-white font-bold h-9">
            Save Changes
          </Button>
        )}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          This is platform-wide branding, not a tenant&apos;s store branding. Each store&apos;s own brand color and logo are
          still configured by that store&apos;s Admin under Store Configuration — open a tenant under Tenant Management to view it.
        </span>
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
              <Palette className="w-4 h-4 text-gold" /> Identity
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">White-Label Display Name</label>
                <Input value={form.platformName || ''} onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Login Page Tagline</label>
                <Input value={form.loginTagline || ''} onChange={(e) => setForm((f) => ({ ...f, loginTagline: e.target.value }))} placeholder="e.g. Jewellery Relationship Operating System" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Logo URL</label>
                <Input value={form.logoUrl || ''} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://…/logo.png" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Favicon URL</label>
                <Input value={form.faviconUrl || ''} onChange={(e) => setForm((f) => ({ ...f, faviconUrl: e.target.value }))} placeholder="https://…/favicon.ico" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <Input value={form.brandColorPrimary || ''} onChange={(e) => setForm((f) => ({ ...f, brandColorPrimary: e.target.value }))} placeholder="#2C6FBD" />
                  {form.brandColorPrimary && <span className="w-8 h-8 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: form.brandColorPrimary }} />}
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Secondary / Accent Color</label>
                <div className="flex items-center gap-2">
                  <Input value={form.brandColorSecondary || ''} onChange={(e) => setForm((f) => ({ ...f, brandColorSecondary: e.target.value }))} placeholder="#0B0E23" />
                  {form.brandColorSecondary && <span className="w-8 h-8 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: form.brandColorSecondary }} />}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="font-display font-bold text-sm text-[#0B0E23]">Email Branding</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Sender Display Name</label>
                <Input value={form.emailFromName || ''} onChange={(e) => setForm((f) => ({ ...f, emailFromName: e.target.value }))} placeholder="e.g. DFX Solution" />
                <p className="text-[10px] text-slate-400">SMTP sender address itself is set in Integrations &gt; Email/SMTP.</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="font-display font-bold text-sm text-[#0B0E23] flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" /> Custom Domain
            </h2>
            <p className="text-[11px] text-slate-500">
              Configuration/status only — DNS records and TLS provisioning happen outside this application.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Domain</label>
                <Input value={form.customDomain || ''} onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))} placeholder="app.yourjewellerybrand.com" />
              </div>
              <Badge variant={settings.customDomainStatus === 'pending' ? 'draft' : 'neutral'} dot>
                {settings.customDomainStatus === 'pending' ? 'Pending DNS Setup' : 'Not Configured'}
              </Badge>
            </div>
          </Card>
        </>
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} type={toast.type} />}
    </div>
  );
}
