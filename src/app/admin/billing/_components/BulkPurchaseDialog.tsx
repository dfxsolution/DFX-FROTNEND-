"use client";

import React, { useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { Plus, Trash2 } from 'lucide-react';
import {
  billingService,
  Vendor,
  BulkPurchaseLineItem,
  Purity,
  ChargeType,
  PURITY_OPTIONS,
} from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';

function emptyLine(): BulkPurchaseLineItem {
  return {
    productCode: '', productName: '', purity: '22K', grossWeightGrams: 0, netGoldWeightGrams: 0,
    makingChargeType: 'PERCENTAGE', makingChargeValue: 0, wastageType: 'PERCENTAGE', wastageValue: 0,
    stoneChargeAmount: 0, otherChargesAmount: 0, taxRatePercent: 3,
  };
}

export function BulkPurchaseDialog({
  isOpen,
  onClose,
  vendors,
  onCompleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  onCompleted: (count: number) => void;
}) {
  const [vendorId, setVendorId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceRef, setInvoiceRef] = useState('');
  const [items, setItems] = useState<BulkPurchaseLineItem[]>([emptyLine()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<BulkPurchaseLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    setError('');
    if (!vendorId) { setError('Select a vendor.'); return; }
    for (const it of items) {
      if (!it.productCode.trim() || !it.productName.trim() || !it.grossWeightGrams || !it.netGoldWeightGrams) {
        setError('Every product row needs a Product Code, Name, Gross Weight and Net Gold Weight.');
        return;
      }
      if (it.netGoldWeightGrams > it.grossWeightGrams) {
        setError(`${it.productCode}: Net Gold Weight cannot exceed Gross Weight.`);
        return;
      }
    }
    setSaving(true);
    try {
      const created = await billingService.bulkPurchase({ vendorId, purchaseDate, purchaseInvoiceRef: invoiceRef, items });
      onCompleted(created.length);
      setItems([emptyLine()]);
      setInvoiceRef('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this purchase entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={() => !saving && onClose()} title="Bulk Purchase Entry" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {error && (
          <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vendor *</label>
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">Select vendor...</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Purchase Date *</label>
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Invoice No.</label>
            <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="INV-1023" />
          </div>
        </div>

        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Product {idx + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700" aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Product Code *" value={it.productCode} onChange={(e) => updateItem(idx, { productCode: e.target.value })} />
                <Input placeholder="Product Name *" value={it.productName} onChange={(e) => updateItem(idx, { productName: e.target.value })} className="col-span-2" />
                <Select value={it.purity} onChange={(e) => updateItem(idx, { purity: e.target.value as Purity })}>
                  {PURITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
                <Input placeholder="HUID" value={it.huid || ''} onChange={(e) => updateItem(idx, { huid: e.target.value })} />
                <Input type="number" step="0.001" placeholder="Gross Wt (g) *" value={it.grossWeightGrams || ''} onChange={(e) => updateItem(idx, { grossWeightGrams: parseFloat(e.target.value) || 0 })} />
                <Input type="number" step="0.001" placeholder="Net Gold Wt (g) *" value={it.netGoldWeightGrams || ''} onChange={(e) => updateItem(idx, { netGoldWeightGrams: parseFloat(e.target.value) || 0 })} />
                <Input type="number" step="0.01" placeholder="Purchase Rate (₹/g)" value={it.purchaseRatePerGram ?? ''} onChange={(e) => updateItem(idx, { purchaseRatePerGram: e.target.value ? parseFloat(e.target.value) : undefined })} />
                <Input type="number" step="0.01" placeholder="Purchase Value (₹)" value={it.purchaseCost ?? ''} onChange={(e) => updateItem(idx, { purchaseCost: e.target.value ? parseFloat(e.target.value) : undefined })} />
                <Input type="number" step="0.01" placeholder="Tax/GST % *" value={it.taxRatePercent} onChange={(e) => updateItem(idx, { taxRatePercent: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyLine()])}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Another Product
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} isLoading={saving}>Save Purchase ({items.length} item{items.length === 1 ? '' : 's'})</Button>
      </DialogFooter>
    </Dialog>
  );
}
