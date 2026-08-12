"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Receipt, Search, FileX } from 'lucide-react';
import { billingService, Sale } from '@/services/billingService';
import { ApiError } from '@/lib/apiClient';
import { formatCurrency, formatWeight } from '@/lib/formatters';
import { PriceBreakdownCard } from '../_components/PriceBreakdownCard';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selected, setSelected] = useState<Sale | null>(null);

  const loadSales = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await billingService.listSales({
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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
        <Button variant="outline" onClick={loadSales}>Filter</Button>
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
                  {['Invoice', 'Date', 'Product', 'Customer', 'Final Amount', ''].map((h) => (
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
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{sale.customerName || sale.customerId || '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gold-dark font-mono">{formatCurrency(sale.finalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(sale)}>View</Button>
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

      <Dialog isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Invoice ${selected.invoiceNumber}` : undefined} maxWidth="max-w-lg">
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
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
