"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { customerService, AdminCustomerListItem, AdminCustomerDetail } from '@/services/customerService';
import { ApiError } from '@/lib/apiClient';

const PAGE_SIZE = 20;

const KYC_BADGE_VARIANT: Record<string, 'success' | 'warn' | 'danger'> = {
  Verified: 'success',
  Pending: 'warn',
  Rejected: 'danger',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadCustomers = async (targetPage: number, searchTerm: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await customerService.getAdminCustomers(targetPage, PAGE_SIZE, searchTerm || undefined);
      setCustomers(result.customers);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(1, search), search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await customerService.getAdminCustomerDetail(id);
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Could not load customer detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Search and review every customer registered under your store, their KYC status, and investment summary.
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-10"
          />
        </div>
      </Card>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => loadCustomers(page, search)}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && customers.length === 0 && (
        <EmptyState
          icon={<Users className="h-7 w-7 text-gold" />}
          title="No customers found"
          description={search ? 'Try a different search term.' : 'No customers have registered under your store yet.'}
        />
      )}

      {!loading && !loadError && customers.length > 0 && (
        <>
          <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-center">KYC Status</th>
                    <th className="p-4">Member Since</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openDetail(c.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-[#0B0E23] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold-dark font-bold text-xs flex items-center justify-center shrink-0 border border-gold/30">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </td>
                      <td className="p-4 text-[11px] text-slate-500">
                        <div>{c.email || '—'}</div>
                        <div>{c.phone || '—'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={KYC_BADGE_VARIANT[c.kycStatus] ?? 'warn'} className="text-[10px]">
                          {c.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-[11px] text-slate-500">{c.memberSince || '—'}</td>
                      <td className="p-4 text-center">
                        <Badge variant={c.isActive ? 'success' : 'danger'} dot className="text-[10px]">
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Page {page} of {totalPages} ({totalItems.toLocaleString('en-IN')} total customers)
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => loadCustomers(page - 1, search)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => loadCustomers(page + 1, search)}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* CUSTOMER DETAIL DIALOG */}
      <Dialog isOpen={!!detailId} onClose={() => setDetailId(null)} title="Customer Detail" maxWidth="max-w-md">
        {detailLoading && <Skeleton className="h-40 w-full" />}
        {!detailLoading && detailError && <p className="text-xs font-medium text-red-700">{detailError}</p>}
        {!detailLoading && !detailError && detail && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold-dark font-bold text-lg flex items-center justify-center border border-gold/30">
                {detail.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-[#0B0E23]">{detail.name}</div>
                <div className="text-slate-400">{detail.email || detail.phone}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] mb-1">
                  <ShieldCheck className="w-3 h-3" /> KYC Status
                </div>
                <Badge variant={KYC_BADGE_VARIANT[detail.kycStatus] ?? 'warn'} className="text-[10px]">
                  {detail.kycStatus}
                </Badge>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] mb-1">
                  <Coins className="w-3 h-3" /> Enrollments
                </div>
                <div className="font-bold text-[#0B0E23]">{detail.enrollmentCount}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-400 font-bold uppercase text-[10px] mb-1">Total Invested</div>
              <div className="font-bold text-[#0B0E23] text-base">
                ₹{detail.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Member since {detail.memberSince || '—'}</span>
              <Badge variant={detail.isActive ? 'success' : 'danger'} dot className="text-[10px]">
                {detail.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
