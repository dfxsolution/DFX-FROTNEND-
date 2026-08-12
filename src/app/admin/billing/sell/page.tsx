"use client";

import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/form-controls';
import { Toast } from '@/components/ui/toast';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Calculator, ScanLine, CheckCircle2, RotateCcw, Gem, Download, FileSpreadsheet, Printer } from 'lucide-react';
import {
  billingService, SaleQuote, Sale, PaymentMethod, PaymentStatus,
  PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS,
} from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { PriceBreakdownCard } from '../_components/PriceBreakdownCard';
import { printInvoice } from '../_components/printInvoice';
import { useTenant } from '@/hooks/useTenant';

type Stage = 'scan' | 'loading' | 'review' | 'success';

export default function NewSalePage() {
  const [stage, setStage] = useState<Stage>('scan');
  const [code, setCode] = useState('');
  const [scanError, setScanError] = useState('');

  const [quote, setQuote] = useState<SaleQuote | null>(null);
  const [discountInput, setDiscountInput] = useState('0');
  const [recalculating, setRecalculating] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { branding } = useTenant();

  const runScan = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;
    setScanError('');
    setStage('loading');
    try {
      const q = await billingService.getSaleQuote(trimmed, 0);
      setQuote(q);
      setDiscountInput('0');
      setStage('review');
    } catch (err) {
      setScanError(err instanceof ApiError ? err.message : 'Could not load this product.');
      setStage('scan');
    }
  };

  const handleDiscountBlur = async () => {
    if (!quote) return;
    const discount = parseFloat(discountInput) || 0;
    setRecalculating(true);
    try {
      const q = await billingService.getSaleQuote(quote.inventoryItem.productCode, discount);
      setQuote(q);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not apply discount', type: 'error' });
      setDiscountInput(String(quote.breakdown.discountAmount));
    } finally {
      setRecalculating(false);
    }
  };

  const resetToScan = () => {
    setStage('scan');
    setCode('');
    setQuote(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerId('');
    setProposedPrice('');
    setPaymentMethod('CASH');
    setPaymentStatus('PAID');
    setCompletedSale(null);
    setCompleteError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const canConfirm = customerId.trim().length > 0 || customerName.trim().length > 0;

  const handleCompleteSale = async () => {
    if (!quote) return;
    setCompleteError('');
    setCompleting(true);
    try {
      const sale = await billingService.createSale({
        productCode: quote.inventoryItem.productCode,
        customerId: customerId.trim() || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discountAmount: quote.breakdown.discountAmount,
        paymentMethod,
        paymentStatus,
      });
      setCompletedSale(sale);
      setConfirmOpen(false);
      setStage('success');
    } catch (err) {
      setCompleteError(err instanceof ApiError ? err.message : 'Could not complete the sale. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body max-w-3xl">
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
          <Calculator className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">New Sale</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Scan or enter a Product Code to load pricing instantly from the current live gold rate.
          </p>
        </div>
      </div>

      {(stage === 'scan' || stage === 'loading') && (
        <Card className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
            <ScanLine className="h-8 w-8 text-gold" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#0B0E23]">Enter / Scan Product Code</h2>
            <p className="text-xs text-slate-500 mt-1">e.g. GN00125</p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Input
              ref={inputRef}
              autoFocus
              disabled={stage === 'loading'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runScan(code)}
              placeholder="Product Code"
              className="text-center text-lg font-mono font-bold h-14"
              error={!!scanError}
            />
            {scanError && <p className="text-xs font-medium text-red-600">{scanError}</p>}
            <Button className="w-full h-12" isLoading={stage === 'loading'} onClick={() => runScan(code)}>
              {stage === 'loading' ? 'Loading...' : 'Load Product'}
            </Button>
          </div>
        </Card>
      )}

      {stage === 'review' && quote && (
        <div className="space-y-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
              {quote.inventoryItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quote.inventoryItem.imageUrl} alt={quote.inventoryItem.productName} className="w-full h-full object-cover" />
              ) : (
                <Gem className="h-6 w-6 text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{quote.inventoryItem.productCode}</span>
                <Badge variant="gold">{quote.inventoryItem.purity}</Badge>
                {quote.inventoryItem.huid && <span className="text-[10px] text-slate-400 font-mono">HUID {quote.inventoryItem.huid}</span>}
              </div>
              <h3 className="font-display font-bold text-base text-[#0B0E23] truncate">{quote.inventoryItem.productName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Gross {formatWeight(quote.inventoryItem.grossWeightGrams)} · Net Gold {formatWeight(quote.inventoryItem.netGoldWeightGrams)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetToScan}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Rescan
            </Button>
          </Card>

          {quote.inventoryItem.purchaseCost !== null && (
            <PriceComparisonCard
              purchaseCost={quote.inventoryItem.purchaseCost}
              currentGoldValue={quote.breakdown.goldValueAmount}
              configuredSellingPrice={quote.breakdown.finalAmount}
              proposedPrice={proposedPrice}
              onProposedPriceChange={setProposedPrice}
            />
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Name</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer name" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Phone</label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 90000 00000" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Existing Customer ID (optional)</label>
              <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="usr_..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Discount (₹)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                disabled={recalculating}
                onChange={(e) => setDiscountInput(e.target.value)}
                onBlur={handleDiscountBlur}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payment Method</label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payment Status</label>
              <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
                {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>

          <PriceBreakdownCard breakdown={quote.breakdown} />

          {!canConfirm && (
            <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Enter a customer name (or an existing Customer ID) to continue.
            </p>
          )}

          <Button className="w-full h-12" disabled={!canConfirm || recalculating} onClick={() => setConfirmOpen(true)}>
            Complete Sale · {formatCurrency(quote.breakdown.finalAmount)}
          </Button>
        </div>
      )}

      {stage === 'success' && completedSale && (
        <Card className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#0B0E23]">Sale Completed</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">Invoice {completedSale.invoiceNumber}</p>
          </div>
          <p className="font-display font-extrabold text-3xl text-gold-dark">{formatCurrency(completedSale.finalAmount)}</p>
          <p className="text-xs text-slate-500">
            {completedSale.productCode} — {completedSale.productName} is now marked SOLD.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => billingService.downloadInvoicePdf(completedSale.id, completedSale.invoiceNumber)}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => billingService.downloadInvoiceExcel(completedSale.id, completedSale.invoiceNumber)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => printInvoice(completedSale, branding.brandName)}>
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
            </Button>
          </div>
          <Button className="w-full max-w-xs h-12" onClick={resetToScan}>
            <ScanLine className="h-4 w-4 mr-2" /> Start Next Sale
          </Button>
        </Card>
      )}

      <Dialog isOpen={confirmOpen} onClose={() => !completing && setConfirmOpen(false)} title="Confirm Sale" maxWidth="max-w-md">
        {quote && (
          <div className="space-y-3">
            {completeError && (
              <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {completeError}
              </div>
            )}
            <p className="text-sm text-slate-600">
              Sell <strong>{quote.inventoryItem.productCode} — {quote.inventoryItem.productName}</strong> to{' '}
              <strong>{customerName || customerId}</strong> for
            </p>
            <p className="font-display font-extrabold text-3xl text-gold-dark text-center py-2">
              {formatCurrency(quote.breakdown.finalAmount)}
            </p>
            <p className="text-[11px] text-slate-400 text-center">
              This will permanently mark the item SOLD and create Invoice {quote.inventoryItem.productCode}-style record. This cannot be undone.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={completing}>Cancel</Button>
          <Button onClick={handleCompleteSale} isLoading={completing}>Confirm & Complete Sale</Button>
        </DialogFooter>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/**
 * Decision-support only — plain arithmetic (difference, margin, margin %),
 * never a recommendation. Must never render language like "you should
 * sell"/"approved"/"profit too low" per the explicit requirement; the
 * Admin decides, this only shows the numbers.
 */
function PriceComparisonCard({
  purchaseCost,
  currentGoldValue,
  configuredSellingPrice,
  proposedPrice,
  onProposedPriceChange,
}: {
  purchaseCost: number;
  currentGoldValue: number;
  configuredSellingPrice: number;
  proposedPrice: string;
  onProposedPriceChange: (v: string) => void;
}) {
  const proposed = parseFloat(proposedPrice);
  const hasProposed = !isNaN(proposed) && proposedPrice.trim() !== '';
  const basisPrice = hasProposed ? proposed : configuredSellingPrice;
  const difference = basisPrice - configuredSellingPrice;
  const margin = basisPrice - purchaseCost;
  const marginPercent = purchaseCost > 0 ? (margin / purchaseCost) * 100 : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Price Comparison (reference only)</span>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="Vendor Purchase Cost" value={formatCurrency(purchaseCost)} />
        <Stat label="Current Gold Value" value={formatCurrency(currentGoldValue)} />
        <Stat label="Configured Selling Price" value={formatCurrency(configuredSellingPrice)} />
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Proposed Price (₹)</label>
          <Input type="number" step="0.01" min="0" value={proposedPrice} onChange={(e) => onProposedPriceChange(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      {hasProposed && (
        <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
          <Stat label="Difference vs Configured" value={formatCurrency(difference)} />
          <Stat label="Estimated Gross Margin" value={formatCurrency(margin)} />
          <Stat label="Estimated Margin %" value={marginPercent !== null ? `${marginPercent.toFixed(1)}%` : '—'} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-mono font-bold text-[#0B0E23]">{value}</p>
    </div>
  );
}
