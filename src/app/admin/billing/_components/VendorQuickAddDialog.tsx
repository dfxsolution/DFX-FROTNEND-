"use client";

import React, { useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { billingService, Vendor } from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';

export function VendorQuickAddDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Vendor name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const vendor = await billingService.createVendor({ name, phone, gstNumber: gst });
      onCreated(vendor);
      setName(''); setPhone(''); setGst('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create vendor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={() => !saving && onClose()} title="Add Vendor" maxWidth="max-w-sm">
      <div className="space-y-3">
        {error && (
          <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vendor Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Gold Supplier" autoFocus />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GST Number</label>
          <Input value={gst} onChange={(e) => setGst(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} isLoading={saving}>Add Vendor</Button>
      </DialogFooter>
    </Dialog>
  );
}
