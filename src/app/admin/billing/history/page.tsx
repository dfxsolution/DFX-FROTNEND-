"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Receipt, Search, FileX, Download, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/form-controls';
import {
  billingService, Sale, PaymentStatus, PaymentMethod, SalePaymentHistory,
  PAYMENT_METHOD_OPTIONS, SALES_HISTORY_PERIODS, SalesHistoryPeriod,
} from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { PriceBreakdownCard } from '../_components/PriceBreakdownCard';
import { InvoiceActions } from '../_components/InvoiceActions';
import { useTenant } from '@/hooks/useTenant';

/* One screen, four filters — never four duplicate pages. ALL means "no
 * payment_status filter sent"; the other three map straight onto the
 * ledger-derived status the backend stores. */
const STATUS_TABS: { value: 'ALL' | PaymentStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PENDING', label: 'Pending' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | PaymentStatus>('ALL');
  const [period, setPeriod] = useState<SalesHistoryPeriod>('this_month');
  const [exporting, setExporting] = useState(false);

  const [selected, setSelected] = useState<Sale | null>(null);
  /* Payment ledger for the invoice open in the detail dialog. */
  const [history, setHistory] = useState<SalePaymentHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayIso());
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payReference, setPayReference] = useState('');
  const [payError, setPayError] = useState('');
  const [paySaving, setPaySaving] = useState(false);
  const { branding } = useTenant();

  const loadSales = async (statusOverride?: 'ALL' | PaymentStatus) => {
    const status = statusOverride ?? statusTab;
    setLoading(true);
    setLoadError('');
    try {
      const res = await billingService.listSales({
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        paymentStatus: status === 'ALL' ? undefined : status,
        limit: 100,
      });
      setSales(res.sales);
      setTotal(res.total);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load sales history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTab = (value: 'ALL' | PaymentStatus) => {
    setStatusTab(value);
    loadSales(value);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await billingService.downloadSalesHistoryExcel({
        period,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        paymentStatus: statusTab === 'ALL' ? undefined : statusTab,
      });
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not export sales history.');
    } finally {
      setExporting(false);
    }
  };

  /* Opening an invoice always re-reads its ledger from the backend rather than
   * trusting the list row, so the paid/outstanding figures shown next to the
   * "Add Payment" form are current. */
  const openSale = async (sale: Sale) => {
    setSelected(sale);
    setHistory(null);
    setPayAmount('');
    setPayDate(todayIso());
    setPayMethod(sale.paymentMethod);
    setPayReference('');
    setPayError('');
    setHistoryLoading(true);
    try {
      setHistory(await billingService.getPaymentHistory(sale.id));
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not load the payment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeSale = () => {
    setSelected(null);
    setHistory(null);
  };

  const handleRecordPayment = async () => {
    if (!selected) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError('Enter a payment amount greater than zero.');
      return;
    }
    setPayError('');
    setPaySaving(true);
    try {
      const updated = await billingService.recordPayment(selected.id, {
        amount,
        paymentDate: payDate,
        paymentMethod: payMethod,
        referenceNo: payReference.trim() || undefined,
      });
      setHistory(updated);
      setPayAmount('');
      setPayReference('');
      /* Keep the row behind the dialog consistent with the ledger. */
      setSelected({
        ...selected,
        paymentStatus: updated.paymentStatus,
        amountPaid: updated.amountPaid,
        amountOutstanding: updated.amountOutstanding,
      });
      setSales((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? {
                ...s,
                paymentStatus: updated.paymentStatus,
                amountPaid: updated.amountPaid,
                amountOutstanding: updated.amountOutstanding,
              }
            : s
        )
      );
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not record the payment.');
    } finally {
      setPaySaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
          <Receipt className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">Sales History</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Every completed sale, permanently recorded with the pricing snapshot used at the time.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => selectTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              statusTab === tab.value
                ? 'bg-gold/15 text-gold-dark border border-gold/40'
                : 'text-slate-500 hover:bg-slate-50 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoice, code, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSales()}
            className="pl-9"
          />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="max-w-[160px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="max-w-[160px]" />
        <Button variant="outline" onClick={() => loadSales()}>Filter</Button>
        {/* Export period is only used when no custom date range is set — the
          * backend applies the same precedence. */}
        <div className="w-[170px] shrink-0">
          <Select value={period} onChange={(e) => setPeriod(e.target.value as SalesHistoryPeriod)}>
            {SALES_HISTORY_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </div>
        <Button variant="outline" onClick={handleExport} isLoading={exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      )}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadSales}>Retry</Button>
        </Card>
      )}

      {!loading && !loadError && sales.length === 0 && (
        <Card>
          <EmptyState
            icon={<FileX className="h-7 w-7 text-gold" />}
            title="No sales yet"
            description="Completed sales will appear here with a full, permanent record of the price breakdown used."
          />
        </Card>
      )}

      {!loading && !loadError && sales.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Invoice', 'Date', 'Product', 'Vendor', 'Customer', 'Total', 'Paid', 'Outstanding', 'Profit/Loss', 'Payment', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-[#0B0E23]">{sale.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {new Date(sale.saleTimestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-mono font-bold text-slate-500">{sale.productCode}</span>
                      <span className="block text-[11px] font-semibold text-[#0B0E23]">{sale.productName}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{sale.vendorName || '—'}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{sale.customerName || sale.customerId || '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gold-dark font-mono">{formatCurrency(sale.finalAmount)}</td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-700">{formatCurrency(sale.amountPaid)}</td>
                    <td className="px-4 py-3 text-xs font-mono font-bold">
                      {sale.amountOutstanding > 0
                        ? <span className="text-amber-700">{formatCurrency(sale.amountOutstanding)}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold">
                      {sale.estimatedGrossMargin !== null ? (
                        <span className={sale.estimatedGrossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {sale.estimatedGrossMargin >= 0 ? '🟢 ' : '🔴 '}{formatCurrency(Math.abs(sale.estimatedGrossMargin))}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : sale.paymentStatus === 'PARTIAL' ? 'warn' : 'pending'}>
                        {sale.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openSale(sale)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {total} sale{total === 1 ? '' : 's'}
          </div>
        </Card>
      )}

      <Dialog isOpen={!!selected} onClose={closeSale} title={selected ? `Invoice ${selected.invoiceNumber}` : undefined} maxWidth="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-mono font-bold text-slate-500">{selected.productCode}</p>
                <p className="font-display font-bold text-sm text-[#0B0E23]">{selected.productName}</p>
                <p className="text-slate-500 font-medium mt-0.5">
                  {selected.purity} · Gross {formatWeight(selected.grossWeightGrams)} · Net {formatWeight(selected.netGoldWeightGrams)}
                  {selected.huid && ` · HUID ${selected.huid}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-semibold">{selected.customerName || selected.customerId || 'Walk-in'}</p>
                <p className="text-slate-400">{new Date(selected.saleTimestamp).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <PriceBreakdownCard
              breakdown={selected}
              margin={{ purchaseCost: selected.purchaseCostSnapshot, estimatedGrossMargin: selected.estimatedGrossMargin }}
            />

            {/* Payment position + permanent collection history. Recorded
              * payments are never edited or removed here — each collection is
              * appended, and the status/outstanding figures come back from the
              * backend's own recalculation. */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <Wallet className="h-4 w-4 text-gold" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Payments</p>
              </div>

              {historyLoading && <p className="px-4 py-3 text-xs text-slate-500 font-medium">Loading payments…</p>}

              {history && (
                <>
                  <div className="grid grid-cols-4 gap-2 px-4 py-3 text-center border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                      <p className="text-sm font-bold font-mono text-[#0B0E23]">{formatCurrency(history.finalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paid</p>
                      <p className="text-sm font-bold font-mono text-emerald-700">{formatCurrency(history.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding</p>
                      <p className="text-sm font-bold font-mono text-amber-700">{formatCurrency(history.amountOutstanding)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</p>
                      <Badge variant={history.paymentStatus === 'PAID' ? 'success' : history.paymentStatus === 'PARTIAL' ? 'warn' : 'pending'}>
                        {history.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {history.payments.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-500 font-medium">
                      No payment recorded against this invoice yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {history.payments.map((p) => (
                        <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-[#0B0E23] font-mono">{formatCurrency(p.amount)}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {new Date(p.paymentDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {p.paymentMethod.replace('_', ' ')}
                              {p.referenceNo && ` · ${p.referenceNo}`}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold text-right shrink-0">
                            {p.recordedByName || ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {history.amountOutstanding > 0 && (
                    <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Add Payment</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder={`Max ${history.amountOutstanding}`}
                        />
                        <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                          {PAYMENT_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                        </Select>
                        <Input
                          value={payReference}
                          onChange={(e) => setPayReference(e.target.value)}
                          placeholder="Reference (optional)"
                        />
                      </div>
                      {payError && <p className="text-[11px] font-medium text-red-600">{payError}</p>}
                      <Button size="sm" className="w-full" isLoading={paySaving} onClick={handleRecordPayment}>
                        Record Payment
                      </Button>
                    </div>
                  )}
                </>
              )}

              {!historyLoading && !history && payError && (
                <p className="px-4 py-3 text-xs font-medium text-red-600">{payError}</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          {selected && <InvoiceActions sale={selected} businessName={branding.brandName} />}
          <Button variant="outline" onClick={closeSale}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
