"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { Collapsible } from '@/components/ui/collapsible';
import { SlidersHorizontal } from 'lucide-react';
import {
  billingService, Vendor, ChargeType, CHARGE_TYPE_OPTIONS, PRICING_MODE_OPTIONS,
} from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';

interface FormState {
  name: string;
  phone: string;
  gst: string;
  makingChargeType: ChargeType;
  makingChargeValue: string;
  wastageType: ChargeType;
  wastageValue: string;
  goldProfitPercent: string;
  taxRatePercent: string;
  defaultPricingMode: string;
}

const emptyForm: FormState = {
  name: '', phone: '', gst: '',
  makingChargeType: 'PERCENTAGE', makingChargeValue: '',
  wastageType: 'PERCENTAGE', wastageValue: '',
  goldProfitPercent: '', taxRatePercent: '', defaultPricingMode: '',
};

export function VendorQuickAddDialog({
  isOpen,
  onClose,
  onCreated,
  vendor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
  /** When provided, the dialog edits this vendor (including its defaults) instead of creating a new one. */
  vendor?: Vendor | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (vendor) {
      setForm({
        name: vendor.name,
        phone: vendor.phone || '',
        gst: vendor.gstNumber || '',
        makingChargeType: vendor.makingChargeType || 'PERCENTAGE',
        makingChargeValue: vendor.makingChargeValue?.toString() ?? '',
        wastageType: vendor.wastageType || 'PERCENTAGE',
        wastageValue: vendor.wastageValue?.toString() ?? '',
        goldProfitPercent: vendor.goldProfitPercent?.toString() ?? '',
        taxRatePercent: vendor.taxRatePercent?.toString() ?? '',
        defaultPricingMode: vendor.defaultPricingMode || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [isOpen, vendor]);

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Vendor name is required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      phone: form.phone,
      gstNumber: form.gst,
      makingChargeType: form.makingChargeValue ? form.makingChargeType : undefined,
      makingChargeValue: form.makingChargeValue ? parseFloat(form.makingChargeValue) : undefined,
      wastageType: form.wastageValue ? form.wastageType : undefined,
      wastageValue: form.wastageValue ? parseFloat(form.wastageValue) : undefined,
      goldProfitPercent: form.goldProfitPercent ? parseFloat(form.goldProfitPercent) : undefined,
      taxRatePercent: form.taxRatePercent ? parseFloat(form.taxRatePercent) : undefined,
      defaultPricingMode: (form.defaultPricingMode || undefined) as any,
    };
    try {
      const saved = vendor
        ? await billingService.updateVendor(vendor.id, payload)
        : await billingService.createVendor(payload);
      onCreated(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${vendor ? 'update' : 'create'} vendor.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={() => !saving && onClose()} title={vendor ? `Edit ${vendor.name}` : 'Add Vendor'} maxWidth="max-w-sm">
      <div className="space-y-3">
        {error && (
          <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vendor Name *</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ABC Gold Supplier" autoFocus />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone</label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GST Number</label>
          <Input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
        </div>

        <Collapsible title="Pricing Defaults (optional)" icon={SlidersHorizontal}>
          <p className="text-[11px] text-slate-500 -mt-1 mb-2">
            Pre-fills new inventory from this vendor. Leave blank to fall back to Category/Store defaults.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MiniField label="Making Type">
              <Select value={form.makingChargeType} onChange={(e) => setForm({ ...form, makingChargeType: e.target.value as ChargeType })}>
                {CHARGE_TYPE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </MiniField>
            <MiniField label="Making Value">
              <Input type="number" step="0.01" value={form.makingChargeValue} onChange={(e) => setForm({ ...form, makingChargeValue: e.target.value })} />
            </MiniField>
            <MiniField label="Wastage Type">
              <Select value={form.wastageType} onChange={(e) => setForm({ ...form, wastageType: e.target.value as ChargeType })}>
                {CHARGE_TYPE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </MiniField>
            <MiniField label="Wastage Value">
              <Input type="number" step="0.01" value={form.wastageValue} onChange={(e) => setForm({ ...form, wastageValue: e.target.value })} />
            </MiniField>
            <MiniField label="Gold Profit %">
              <Input type="number" step="0.01" value={form.goldProfitPercent} onChange={(e) => setForm({ ...form, goldProfitPercent: e.target.value })} />
            </MiniField>
            <MiniField label="GST %">
              <Input type="number" step="0.01" value={form.taxRatePercent} onChange={(e) => setForm({ ...form, taxRatePercent: e.target.value })} />
            </MiniField>
            <MiniField label="Pricing Mode">
              <Select value={form.defaultPricingMode} onChange={(e) => setForm({ ...form, defaultPricingMode: e.target.value })}>
                <option value="">Not set</option>
                {PRICING_MODE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
              </Select>
            </MiniField>
          </div>
        </Collapsible>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} isLoading={saving}>{vendor ? 'Save Changes' : 'Add Vendor'}</Button>
      </DialogFooter>
    </Dialog>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}
