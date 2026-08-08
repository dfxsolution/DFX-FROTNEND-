"use client";

import React, { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { customerService, TenantProfile, UpdateTenantProfileData } from '@/services/customerService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/apiClient';

interface FormState {
  contactEmail: string;
  contactPhone: string;
  gstNumber: string;
  brandColor: string;
  logoUrl: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function toFormState(profile: TenantProfile): FormState {
  return {
    contactEmail: profile.contactEmail,
    contactPhone: profile.contactPhone,
    gstNumber: profile.gstNumber,
    brandColor: profile.brandColor,
    logoUrl: profile.logoUrl,
  };
}

const FIELD_MAP: Record<string, keyof FormState> = {
  contact_email: 'contactEmail',
  contact_phone: 'contactPhone',
  gst_number: 'gstNumber',
  brand_color: 'brandColor',
  logo_url: 'logoUrl',
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await customerService.getTenantProfile();
      setProfile(data);
      setForm(toFormState(data));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load store configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile || !form) return;
    setFormError('');
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: UpdateTenantProfileData = {
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        gst_number: form.gstNumber,
        brand_color: form.brandColor,
        logo_url: form.logoUrl,
      };
      const updated = await customerService.updateTenantProfile(payload);
      setProfile(updated);
      setForm(toFormState(updated));
      setToast({ message: 'Store configuration saved.', type: 'success' });
    } catch (err) {
      if (err instanceof ApiError && err.errors.length > 0) {
        const next: FieldErrors = {};
        let banner = '';
        for (const e of err.errors) {
          const field = FIELD_MAP[e.field ?? ''];
          if (field) next[field] = e.message ?? '';
          else banner = e.message ?? '';
        }
        setFieldErrors(next);
        setFormError(banner || (Object.keys(next).length === 0 ? err.message : ''));
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not save store configuration.');
      }
      setToast({ message: 'Could not save store configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Jeweller Store Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage your store&apos;s business contact details, GST number, and brand identity.
          </p>
        </div>
        {!loading && !loadError && (
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-gold hover:bg-gold-dark text-white font-bold h-9"
          >
            <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && <Skeleton className="h-72 w-full" />}

      {/* Load error */}
      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadProfile}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && profile && form && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BUSINESS DETAILS */}
          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center shrink-0 border border-gold/30">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-[#0B0E23]">Business Details</h2>
                <p className="text-[11px] text-slate-400 font-medium">{profile.name} · {profile.slug}</p>
              </div>
            </div>

            {formError && (
              <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Contact Email</label>
              <Input
                type="email"
                error={!!fieldErrors.contactEmail}
                value={form.contactEmail}
                onChange={(e) => setForm((f) => f && { ...f, contactEmail: e.target.value })}
                placeholder="store@yourbusiness.com"
              />
              {fieldErrors.contactEmail && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.contactEmail}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Contact Phone</label>
              <Input
                error={!!fieldErrors.contactPhone}
                value={form.contactPhone}
                onChange={(e) => setForm((f) => f && { ...f, contactPhone: e.target.value })}
                placeholder="10-digit mobile number"
              />
              {fieldErrors.contactPhone && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.contactPhone}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">GST Number</label>
              <Input
                error={!!fieldErrors.gstNumber}
                value={form.gstNumber}
                onChange={(e) => setForm((f) => f && { ...f, gstNumber: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
              {fieldErrors.gstNumber && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.gstNumber}</p>}
            </div>
          </Card>

          {/* BRANDING */}
          <Card className="bg-white border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h2 className="font-display font-bold text-sm text-[#0B0E23]">Brand Identity</h2>
              <p className="text-[11px] text-slate-400 font-medium">Shown to your customers in the app and on receipts.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Logo URL</label>
              <Input
                error={!!fieldErrors.logoUrl}
                value={form.logoUrl}
                onChange={(e) => setForm((f) => f && { ...f, logoUrl: e.target.value })}
                placeholder="https://..."
              />
              {fieldErrors.logoUrl && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.logoUrl}</p>}
              {form.logoUrl && (
                <div className="pt-2">
                  <img
                    src={form.logoUrl}
                    alt="Store logo preview"
                    className="h-12 w-auto rounded-lg border border-slate-200 bg-slate-50 object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Brand Color</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(form.brandColor) ? form.brandColor : '#C89B3C'}
                  onChange={(e) => setForm((f) => f && { ...f, brandColor: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                />
                <Input
                  error={!!fieldErrors.brandColor}
                  value={form.brandColor}
                  onChange={(e) => setForm((f) => f && { ...f, brandColor: e.target.value })}
                  placeholder="#C89B3C"
                  className="flex-1"
                />
              </div>
              {fieldErrors.brandColor && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.brandColor}</p>}
            </div>
          </Card>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
