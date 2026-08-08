"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/form-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  Store,
  MapPin,
  Phone,
  Pencil,
  Plus,
} from 'lucide-react';
import { customerService, Branch } from '@/services/customerService';
import { ApiError } from '@/lib/apiClient';

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: BranchFormState = { name: '', address: '', phone: '', latitude: '', longitude: '' };

type FieldErrors = Partial<Record<keyof BranchFormState, string>>;

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await customerService.getAdminBranches();
      setBranches(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      address: b.address,
      phone: b.phone,
      latitude: String(b.latitude),
      longitude: String(b.longitude),
    });
    setFieldErrors({});
    setFormError('');
    setDialogOpen(true);
  };

  const applyApiError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.errors.length > 0) {
      const next: FieldErrors = {};
      let banner = '';
      const fieldMap: Record<string, keyof BranchFormState> = {
        name: 'name', address: 'address', phone: 'phone', latitude: 'latitude', longitude: 'longitude',
      };
      for (const e of err.errors) {
        const field = e.field ? fieldMap[e.field] : undefined;
        if (field) next[field] = e.message ?? '';
        else banner = e.message ?? '';
      }
      setFieldErrors(next);
      setFormError(banner || (Object.keys(next).length === 0 ? err.message : fallback));
    } else {
      setFormError(err instanceof ApiError ? err.message : fallback);
    }
  };

  const handleSave = async () => {
    setFormError('');
    setFieldErrors({});
    setSaving(true);
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setFieldErrors({ latitude: Number.isNaN(lat) ? 'Enter a valid latitude' : undefined, longitude: Number.isNaN(lng) ? 'Enter a valid longitude' : undefined });
      setSaving(false);
      return;
    }
    try {
      if (editingId) {
        await customerService.updateBranch(editingId, { name: form.name, address: form.address, phone: form.phone, latitude: lat, longitude: lng });
        setToastMsg('Branch updated.');
      } else {
        await customerService.createBranch({ name: form.name, address: form.address, phone: form.phone, latitude: lat, longitude: lng });
        setToastMsg('Branch created.');
      }
      setDialogOpen(false);
      await loadBranches();
    } catch (err) {
      applyApiError(err, editingId ? 'Could not update branch.' : 'Could not create branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: Branch) => {
    setTogglingId(b.id);
    try {
      await customerService.setBranchStatus(b.id, !b.isActive);
      await loadBranches();
      setToastMsg(`${b.name} ${b.isActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not update branch status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Multi-Branch Store Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Register and manage your jewellery store locations. Per-branch staff rosters and sales KPIs aren&apos;t modeled in the backend yet.
          </p>
        </div>

        <Button onClick={openCreateDialog} size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold h-9 transition-all duration-200">
          <Plus className="w-4 h-4 mr-1.5" /> Register New Branch
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      )}

      {!loading && loadError && <ErrorState message={loadError} onRetry={loadBranches} />}

      {!loading && !loadError && branches.length === 0 && (
        <EmptyState
          icon={<Store className="h-7 w-7 text-gold" />}
          title="No branches yet"
          description="Register your first store branch to get started."
          actionLabel="Register New Branch"
          onAction={openCreateDialog}
        />
      )}

      {!loading && !loadError && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b) => (
            <Card
              key={b.id}
              className="p-6 bg-white border-slate-200 shadow-xs hover:border-gold/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold-dark flex items-center justify-center font-bold border border-gold/30 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0B0E23]">{b.name}</h3>
                    </div>
                  </div>
                  <Badge variant={b.isActive ? 'success' : 'inactive'} className="text-[10px]">
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 my-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{b.address}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-[#0B0E23]">{b.phone}</span>
                  </div>
                </div>

                {/* No branch-level staff/customer/sales attribution exists in the
                    backend (see SESSION_HANDOFF.md §8/§17) — rendered honestly
                    as "not available" rather than fabricated. */}
                <div className="grid grid-cols-3 gap-2 text-xs text-center border-t border-b border-slate-100 py-3 mb-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Enroled Members</span>
                    <span className="font-display font-extrabold text-sm text-slate-300">—</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Showroom Items</span>
                    <span className="font-display font-extrabold text-sm text-slate-300">—</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Today Sales</span>
                    <span className="font-display font-extrabold text-sm text-slate-300">—</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => openEditDialog(b)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-bold border-slate-200 transition-all duration-200"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Branch
                </Button>
                <Switch
                  checked={b.isActive}
                  onChange={() => handleToggleActive(b)}
                  disabled={togglingId === b.id}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BRANCH DIALOG */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title={editingId ? 'Edit Branch' : 'Register New Branch'}
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5 text-xs">
          {formError && (
            <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Branch Name *</label>
            <Input
              error={!!fieldErrors.name}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. MG Road Showroom"
            />
            {fieldErrors.name && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Address *</label>
            <Input
              error={!!fieldErrors.address}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Full store address"
            />
            {fieldErrors.address && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.address}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Phone *</label>
            <Input
              error={!!fieldErrors.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="10-digit store phone"
            />
            {fieldErrors.phone && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Latitude *</label>
              <Input
                error={!!fieldErrors.latitude}
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="12.9716"
              />
              {fieldErrors.latitude && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.latitude}</p>}
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Longitude *</label>
              <Input
                error={!!fieldErrors.longitude}
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="77.5946"
              />
              {fieldErrors.longitude && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.longitude}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </div>
      </Dialog>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
