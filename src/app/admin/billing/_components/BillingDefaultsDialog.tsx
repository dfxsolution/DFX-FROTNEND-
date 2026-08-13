"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { Collapsible } from '@/components/ui/collapsible';
import { Toast } from '@/components/ui/toast';
import { Store, Tag, Truck, Pencil } from 'lucide-react';
import {
  billingService, Vendor, CategoryDefault, ChargeType, CHARGE_TYPE_OPTIONS, PRICING_MODE_OPTIONS,
} from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';
import { VendorQuickAddDialog } from './VendorQuickAddDialog';

interface DefaultsForm {
  makingChargeType: ChargeType;
  makingChargeValue: string;
  wastageType: ChargeType;
  wastageValue: string;
  stoneChargeAmount: string;
  otherChargesAmount: string;
  taxRatePercent: string;
  defaultPricingMode: string;
}

const emptyForm: DefaultsForm = {
  makingChargeType: 'PERCENTAGE', makingChargeValue: '',
  wastageType: 'PERCENTAGE', wastageValue: '',
  stoneChargeAmount: '', otherChargesAmount: '', taxRatePercent: '', defaultPricingMode: '',
};

function toPayload(f: DefaultsForm) {
  return {
    makingChargeType: f.makingChargeValue ? f.makingChargeType : undefined,
    makingChargeValue: f.makingChargeValue ? parseFloat(f.makingChargeValue) : undefined,
    wastageType: f.wastageValue ? f.wastageType : undefined,
    wastageValue: f.wastageValue ? parseFloat(f.wastageValue) : undefined,
    stoneChargeAmount: f.stoneChargeAmount ? parseFloat(f.stoneChargeAmount) : undefined,
    otherChargesAmount: f.otherChargesAmount ? parseFloat(f.otherChargesAmount) : undefined,
    taxRatePercent: f.taxRatePercent ? parseFloat(f.taxRatePercent) : undefined,
    defaultPricingMode: (f.defaultPricingMode || undefined) as any,
  };
}

function DefaultsFields({ form, setForm }: { form: DefaultsForm; setForm: (f: DefaultsForm) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Making Type">
        <Select value={form.makingChargeType} onChange={(e) => setForm({ ...form, makingChargeType: e.target.value as ChargeType })}>
          {CHARGE_TYPE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Making Value">
        <Input type="number" step="0.01" value={form.makingChargeValue} onChange={(e) => setForm({ ...form, makingChargeValue: e.target.value })} />
      </Field>
      <Field label="Wastage Type">
        <Select value={form.wastageType} onChange={(e) => setForm({ ...form, wastageType: e.target.value as ChargeType })}>
          {CHARGE_TYPE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Wastage Value">
        <Input type="number" step="0.01" value={form.wastageValue} onChange={(e) => setForm({ ...form, wastageValue: e.target.value })} />
      </Field>
      <Field label="Stone Charge (₹)">
        <Input type="number" step="0.01" value={form.stoneChargeAmount} onChange={(e) => setForm({ ...form, stoneChargeAmount: e.target.value })} />
      </Field>
      <Field label="Other Charges (₹)">
        <Input type="number" step="0.01" value={form.otherChargesAmount} onChange={(e) => setForm({ ...form, otherChargesAmount: e.target.value })} />
      </Field>
      <Field label="GST %">
        <Input type="number" step="0.01" value={form.taxRatePercent} onChange={(e) => setForm({ ...form, taxRatePercent: e.target.value })} />
      </Field>
      <Field label="Pricing Mode">
        <Select value={form.defaultPricingMode} onChange={(e) => setForm({ ...form, defaultPricingMode: e.target.value })}>
          <option value="">Not set</option>
          {PRICING_MODE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

export function BillingDefaultsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [storeForm, setStoreForm] = useState<DefaultsForm>(emptyForm);
  const [savingStore, setSavingStore] = useState(false);

  const [categories, setCategories] = useState<CategoryDefault[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryForm, setCategoryForm] = useState<DefaultsForm>(emptyForm);
  const [savingCategory, setSavingCategory] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    billingService.getStoreDefaults().then((d) => setStoreForm({
      makingChargeType: d.makingChargeType || 'PERCENTAGE',
      makingChargeValue: d.makingChargeValue?.toString() ?? '',
      wastageType: d.wastageType || 'PERCENTAGE',
      wastageValue: d.wastageValue?.toString() ?? '',
      stoneChargeAmount: d.stoneChargeAmount?.toString() ?? '',
      otherChargesAmount: d.otherChargesAmount?.toString() ?? '',
      taxRatePercent: d.taxRatePercent?.toString() ?? '',
      defaultPricingMode: d.defaultPricingMode || '',
    })).catch(() => {});
    billingService.listCategoryDefaults().then(setCategories).catch(() => {});
    billingService.listVendors().then(setVendors).catch(() => {});
  }, [isOpen]);

  const saveStore = async () => {
    setSavingStore(true);
    try {
      await billingService.updateStoreDefaults(toPayload(storeForm));
      setToast({ message: 'Store defaults saved', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not save store defaults', type: 'error' });
    } finally {
      setSavingStore(false);
    }
  };

  const loadCategoryIntoForm = (c: CategoryDefault) => {
    setCategoryName(c.category);
    setCategoryForm({
      makingChargeType: c.makingChargeType || 'PERCENTAGE',
      makingChargeValue: c.makingChargeValue?.toString() ?? '',
      wastageType: c.wastageType || 'PERCENTAGE',
      wastageValue: c.wastageValue?.toString() ?? '',
      stoneChargeAmount: c.stoneChargeAmount?.toString() ?? '',
      otherChargesAmount: c.otherChargesAmount?.toString() ?? '',
      taxRatePercent: c.taxRatePercent?.toString() ?? '',
      defaultPricingMode: c.defaultPricingMode || '',
    });
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      setToast({ message: 'Enter a category name', type: 'error' });
      return;
    }
    setSavingCategory(true);
    try {
      const saved = await billingService.upsertCategoryDefault(categoryName.trim(), toPayload(categoryForm));
      setCategories((prev) => {
        const others = prev.filter((c) => c.category !== saved.category);
        return [...others, saved].sort((a, b) => a.category.localeCompare(b.category));
      });
      setToast({ message: `Category default saved for "${saved.category}"`, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not save category default', type: 'error' });
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title="Billing Defaults" maxWidth="max-w-2xl">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Pre-fill sources only — resolved field-by-field as Vendor → Category → Store. Never changes already-saved inventory.
          </p>

          <Collapsible title="Store Defaults (bottom of the chain)" icon={Store} defaultOpen>
            <DefaultsFields form={storeForm} setForm={setStoreForm} />
            <div className="pt-2">
              <Button size="sm" onClick={saveStore} isLoading={savingStore}>Save Store Defaults</Button>
            </div>
          </Collapsible>

          <Collapsible title={`Category Defaults (${categories.length})`} icon={Tag}>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadCategoryIntoForm(c)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:border-gold hover:bg-gold/5 transition-colors"
                  >
                    {c.category}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1 mb-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category Name</label>
              <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Gold Jewellery" />
            </div>
            <DefaultsFields form={categoryForm} setForm={setCategoryForm} />
            <div className="pt-2">
              <Button size="sm" onClick={saveCategory} isLoading={savingCategory}>Save Category Default</Button>
            </div>
          </Collapsible>

          <Collapsible title={`Vendors (${vendors.length})`} icon={Truck}>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {vendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-slate-50">
                  <span className="font-semibold text-[#0B0E23]">{v.name}</span>
                  <button
                    onClick={() => { setEditingVendor(v); setVendorDialogOpen(true); }}
                    className="text-slate-400 hover:text-gold-dark"
                    aria-label={`Edit ${v.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {vendors.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No vendors yet.</p>}
            </div>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </Dialog>

      <VendorQuickAddDialog
        isOpen={vendorDialogOpen}
        vendor={editingVendor}
        onClose={() => setVendorDialogOpen(false)}
        onCreated={(v) => setVendors((prev) => prev.map((x) => (x.id === v.id ? v : x)))}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
