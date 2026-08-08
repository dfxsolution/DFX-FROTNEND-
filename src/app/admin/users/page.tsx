"use client";

import React, { useEffect, useState } from 'react';
import { staffService, Staff, StaffCreateData } from '@/services/staffService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/form-controls';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, UserCheck } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

const EMPTY_FORM: StaffCreateData = { name: '', email: '', phone: '', password: '' };

type FieldErrors = Partial<Record<keyof StaffCreateData, string>>;

export default function AdminUsersPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<StaffCreateData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await staffService.getStaff();
      setStaff(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    setFieldErrors({});
    setSaving(true);
    try {
      await staffService.createStaff(form);
      setDialogOpen(false);
      await loadStaff();
      setToast({ message: 'Staff member created.', type: 'success' });
    } catch (err) {
      if (err instanceof ApiError && err.errors.length > 0) {
        const next: FieldErrors = {};
        let banner = '';
        const fieldMap: Record<string, keyof StaffCreateData> = {
          name: 'name', email: 'email', phone: 'phone', password: 'password',
        };
        for (const e of err.errors) {
          const field = e.field ? fieldMap[e.field] : undefined;
          if (field) next[field] = e.message ?? '';
          else banner = e.message ?? '';
        }
        setFieldErrors(next);
        setFormError(banner || (Object.keys(next).length === 0 ? err.message : ''));
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Could not create staff member.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: Staff) => {
    setTogglingId(member.id);
    try {
      await staffService.setStaffStatus(member.id, !member.isActive);
      await loadStaff();
      setToast({ message: `${member.name} ${member.isActive ? 'deactivated' : 'reactivated'}.`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not update staff status.', type: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Staff User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Invite store staff and manage their account access. Branch-level access permissions aren&apos;t modeled in the backend yet.
          </p>
        </div>

        <Button onClick={openCreateDialog} size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold h-9">
          <Plus className="w-4 h-4 mr-1.5" /> Add Staff
        </Button>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadStaff}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && staff.length === 0 && (
        <EmptyState
          icon={<UserCheck className="h-7 w-7 text-gold" />}
          title="No staff members yet"
          description="Add your first staff account to give store employees system access."
          actionLabel="Add Staff"
          onAction={openCreateDialog}
        />
      )}

      {!loading && !loadError && staff.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Member Since</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-[#0B0E23] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold-dark font-bold text-xs flex items-center justify-center shrink-0 border border-gold/30">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      {s.name}
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">
                      <div>{s.email || '—'}</div>
                      <div>{s.phone || '—'}</div>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">{s.memberSince || '—'}</td>
                    <td className="p-4 text-center">
                      <Badge variant={s.isActive ? 'success' : 'danger'} dot className="text-[10px]">
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={s.isActive}
                        onChange={() => handleToggleActive(s)}
                        disabled={togglingId === s.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE STAFF DIALOG */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="Add Staff Member"
        maxWidth="max-w-md"
      >
        <div className="space-y-3.5 text-xs">
          {formError && (
            <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Name *</label>
            <Input
              error={!!fieldErrors.name}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Rahul Verma"
            />
            {fieldErrors.name && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Email</label>
            <Input
              type="email"
              error={!!fieldErrors.email}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="staff@yourstore.com"
            />
            {fieldErrors.email && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Phone</label>
            <Input
              error={!!fieldErrors.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="10-digit mobile number"
            />
            {fieldErrors.phone && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Password *</label>
            <Input
              type="password"
              error={!!fieldErrors.password}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 6 characters"
            />
            {fieldErrors.password && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.password}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold" onClick={handleSave} disabled={saving}>
              {saving ? 'Creating…' : 'Create Staff'}
            </Button>
          </div>
        </div>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
