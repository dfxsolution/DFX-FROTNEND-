"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Gem, BookOpen, Wallet, Lock } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  enrollmentService, AdminEnrollment, EnrollmentStatus, EnrollmentBalance,
} from '@/services/enrollmentService';
import { ApiError } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/formatters';

const STATUS_VARIANT: Record<EnrollmentStatus, 'success' | 'gold' | 'danger' | 'warn' | 'neutral'> = {
  ACTIVE: 'success',
  COMPLETED: 'gold',
  CANCELLED: 'danger',
  // Stopped contributing, balance still redeemable.
  CLOSED: 'warn',
  // Balance fully consumed by purchases.
  REDEEMED: 'neutral',
};

export default function AdminEnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  /* Scheme credit panel. Every figure is read from the backend, which derives it
   * from the contribution and redemption ledgers — nothing is computed here, and
   * no historical payment is ever editable from this screen. */
  const [balance, setBalance] = useState<EnrollmentBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [saving, setSaving] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemSaleId, setRedeemSaleId] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');

  const openDetails = async (enrollmentId: string) => {
    setBalance(null);
    setPanelError('');
    setBalanceLoading(true);
    try {
      setBalance(await enrollmentService.getEnrollmentBalance(enrollmentId));
    } catch (err) {
      setPanelError(err instanceof ApiError ? err.message : 'Could not load the scheme balance.');
    } finally {
      setBalanceLoading(false);
    }
  };

  const closeDetails = () => {
    setBalance(null);
    setPanelError('');
  };

  const applyUpdated = (updated: EnrollmentBalance) => {
    setBalance(updated);
    setEnrollments((prev) =>
      prev.map((e) => (e.id === updated.enrollmentId ? { ...e, status: updated.status } : e))
    );
  };

  const handleClose = async () => {
    if (!balance) return;
    if (closeReason.trim().length < 3) {
      setPanelError('A closure reason is required.');
      return;
    }
    setPanelError('');
    setSaving(true);
    try {
      applyUpdated(await enrollmentService.closeEnrollment(balance.enrollmentId, closeReason.trim()));
      setCloseOpen(false);
      setCloseReason('');
    } catch (err) {
      setPanelError(err instanceof ApiError ? err.message : 'Could not close the scheme.');
    } finally {
      setSaving(false);
    }
  };

  const handleRedeem = async () => {
    if (!balance) return;
    const amount = parseFloat(redeemAmount);
    if (!redeemSaleId.trim()) {
      setPanelError('Enter the invoice/sale ID the scheme balance should settle.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setPanelError('Enter a redemption amount greater than zero.');
      return;
    }
    setPanelError('');
    setSaving(true);
    try {
      applyUpdated(
        await enrollmentService.redeemScheme(balance.enrollmentId, redeemSaleId.trim(), amount)
      );
      setRedeemOpen(false);
      setRedeemSaleId('');
      setRedeemAmount('');
    } catch (err) {
      setPanelError(err instanceof ApiError ? err.message : 'Could not redeem the scheme balance.');
    } finally {
      setSaving(false);
    }
  };

  const loadEnrollments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await enrollmentService.getAdminEnrollments();
      setEnrollments(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Scheme Enrollments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Read-only view of every customer enrollment across your active and past schemes.
          </p>
        </div>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadEnrollments}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && enrollments.length === 0 && (
        <EmptyState
          icon={<Gem className="h-7 w-7 text-gold" />}
          title="No enrollments yet"
          description="Once customers join your schemes, their enrollments will appear here."
        />
      )}

      {!loading && !loadError && enrollments.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Enrollment No.</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Scheme</th>
                  <th className="p-4 text-center">Joined</th>
                  <th className="p-4 text-center">Maturity</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#0B0E23]">{e.enrollmentNumber}</td>
                    <td className="p-4 font-bold text-[#0B0E23]">{e.customerName}</td>
                    <td className="p-4">{e.schemeName}</td>
                    <td className="p-4 text-center">{new Date(e.joinedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                    <td className="p-4 text-center">{new Date(e.maturityDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                    <td className="p-4 text-center">
                      <Badge variant={STATUS_VARIANT[e.status]} dot>{e.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => openDetails(e.id)}>
                          View Details
                        </Button>
                        <button
                          onClick={() => router.push(`/admin/enrollments/${e.id}/passbook`)}
                          className="p-1.5 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="View Passbook"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Scheme credit, closure and redemption. Read-only on the money side:
        * contributions and passbook history are never editable here. */}
      <Dialog
        isOpen={balanceLoading || !!balance}
        onClose={closeDetails}
        title={balance ? `Enrollment ${balance.enrollmentNumber}` : 'Loading…'}
        maxWidth="max-w-lg"
      >
        {balanceLoading && <p className="text-xs text-slate-500 font-medium">Loading scheme balance…</p>}

        {balance && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#0B0E23]">{balance.customerName}</p>
                <p className="text-[11px] text-slate-500 font-medium">{balance.schemeName}</p>
              </div>
              <Badge variant={STATUS_VARIANT[balance.status]} dot>{balance.status}</Badge>
            </div>

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              {[
                ['Monthly Amount', formatCurrency(balance.monthlyAmount)],
                ['Planned Duration', `${balance.durationMonths} months`],
                ['Successful Payments', String(balance.successfulPaymentCount)],
                ['Total Paid In', formatCurrency(balance.totalPaid)],
                ['Already Redeemed', formatCurrency(balance.totalRedeemed)],
                ['Available Balance', formatCurrency(balance.availableBalance)],
                ['Maturity', new Date(balance.maturityDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-bold font-mono text-[#0B0E23]">{value}</span>
                </div>
              ))}
            </div>

            {balance.closedAt && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Closed</p>
                <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                  {new Date(balance.closedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {balance.closedByName && ` · ${balance.closedByName}`}
                </p>
                <p className="text-[11px] text-slate-700 font-medium">Reason: {balance.closureReason}</p>
                <p className="text-[11px] text-slate-700 font-medium mt-1">
                  Remaining redeemable balance: {formatCurrency(balance.availableBalance)} — preserved, not refunded or forfeited.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                <Wallet className="h-4 w-4 text-gold" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Redemption History</p>
              </div>
              {balance.redemptions.length === 0 ? (
                <p className="px-3 py-2.5 text-[11px] text-slate-500 font-medium">
                  No scheme balance has been redeemed yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {balance.redemptions.map((r) => (
                    <li key={r.id} className="px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold font-mono text-[#0B0E23]">{formatCurrency(r.amount)}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Invoice {r.invoiceNumber} ·{' '}
                          {new Date(r.redeemedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold shrink-0">{r.recordedByName || ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {panelError && <p className="text-[11px] font-medium text-red-600">{panelError}</p>}
          </div>
        )}

        <DialogFooter>
          {balance?.canContribute && (
            <Button variant="outline" onClick={() => { setPanelError(''); setCloseOpen(true); }}>
              <Lock className="h-3.5 w-3.5 mr-1" /> Close Scheme
            </Button>
          )}
          {balance?.canRedeem && (
            <Button
              onClick={() => {
                setPanelError('');
                setRedeemAmount(String(balance.availableBalance));
                setRedeemOpen(true);
              }}
            >
              Redeem For Purchase
            </Button>
          )}
          <Button variant="outline" onClick={closeDetails}>Close</Button>
        </DialogFooter>
      </Dialog>

      {/* Closing stops future contributions only. */}
      <Dialog isOpen={closeOpen} onClose={() => setCloseOpen(false)} title="Close Scheme" maxWidth="max-w-md">
        <div className="space-y-3">
          <p className="text-xs text-slate-600 font-medium">
            Stops future contributions on {balance?.enrollmentNumber}. Every payment already made
            stays on record, and the {formatCurrency(balance?.availableBalance ?? 0)} balance stays
            available for a future jewellery purchase — nothing is refunded or forfeited.
          </p>
          <Input
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="Closure reason (required)"
          />
          {panelError && <p className="text-[11px] font-medium text-red-600">{panelError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
          <Button isLoading={saving} onClick={handleClose}>Confirm Closure</Button>
        </DialogFooter>
      </Dialog>

      {/* Redemption. The backend validates the amount against BOTH the available
        * balance and the invoice's outstanding, and settles it on the invoice's
        * existing payment ledger as a SCHEME_REDEMPTION row — never as cash. */}
      <Dialog isOpen={redeemOpen} onClose={() => setRedeemOpen(false)} title="Redeem For Purchase" maxWidth="max-w-md">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
              <span className="text-xs font-bold font-mono text-emerald-700">
                {formatCurrency(balance?.availableBalance ?? 0)}
              </span>
            </div>
          </div>
          <Input
            value={redeemSaleId}
            onChange={(e) => setRedeemSaleId(e.target.value)}
            placeholder="Sale / invoice ID to settle"
          />
          <Input
            type="number"
            step="0.01"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder={`Max ${balance?.availableBalance ?? 0}`}
          />
          <p className="text-[11px] text-slate-500 font-medium">
            Applied to the invoice as a scheme redemption, not as cash collected. Any leftover
            balance stays available for a future purchase.
          </p>
          {panelError && <p className="text-[11px] font-medium text-red-600">{panelError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRedeemOpen(false)}>Cancel</Button>
          <Button isLoading={saving} onClick={handleRedeem}>Confirm Redemption</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
