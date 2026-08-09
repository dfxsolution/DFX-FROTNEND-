"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import { ArrowLeft, Users, Coins, CreditCard, Scale, ShieldCheck, ShieldOff, KeyRound, UserX, UserCheck, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Select } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import {
  superAdminService,
  TenantDetail,
  TenantStatistics,
  TenantStatus,
} from '@/services/superAdminService';
import { ApiError } from '@/lib/apiClient';

const PLAN_OPTIONS = ['Starter', 'Professional', 'Business', 'Enterprise'];

const SUBSCRIPTION_STATUS_BADGE: Record<string, 'success' | 'draft' | 'danger' | 'neutral'> = {
  Active: 'success',
  Trial: 'draft',
  Expired: 'danger',
  Suspended: 'neutral',
};

const TENANT_STATUS_BADGE: Record<TenantStatus, 'success' | 'neutral'> = {
  Active: 'success',
  Inactive: 'neutral',
};

export default function SuperAdminTenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [stats, setStats] = useState<TenantStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [toggling, setToggling] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [deactivateAdminConfirmOpen, setDeactivateAdminConfirmOpen] = useState(false);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subPlan, setSubPlan] = useState('Professional');
  const [subAccessMode, setSubAccessMode] = useState<'TRIAL' | 'INDEFINITE'>('TRIAL');
  const [subTrialDays, setSubTrialDays] = useState(30);
  const [subSaving, setSubSaving] = useState(false);

  const loadTenant = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // "This Year" — matches the same YTD framing used by the Admin Reports
      // page and the Platform Dashboard's growth chart.
      const [detail, statistics] = await Promise.all([
        superAdminService.getTenantDetail(tenantId),
        superAdminService.getTenantStatistics(tenantId, { period: 'this_year' }),
      ]);
      setTenant(detail);
      setStats(statistics);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load tenant.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleEnable = async () => {
    setToggling(true);
    try {
      const updated = await superAdminService.enableTenant(tenantId);
      setTenant(updated);
      setToastMsg(`${updated.name} enabled`);
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not enable tenant');
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDisable = async () => {
    setToggling(true);
    try {
      const updated = await superAdminService.disableTenant(tenantId);
      setTenant(updated);
      setDisableConfirmOpen(false);
      setToastMsg(`${updated.name} disabled`);
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not disable tenant');
    } finally {
      setToggling(false);
    }
  };

  const handleReactivateAdmin = async () => {
    setAdminActionLoading(true);
    try {
      await superAdminService.setTenantAdminStatus(tenantId, true);
      await loadTenant();
      setToastMsg('Admin account reactivated');
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not reactivate Admin account');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleConfirmDeactivateAdmin = async () => {
    setAdminActionLoading(true);
    try {
      await superAdminService.setTenantAdminStatus(tenantId, false);
      await loadTenant();
      setDeactivateAdminConfirmOpen(false);
      setToastMsg('Admin account deactivated');
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not deactivate Admin account');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    setAdminActionLoading(true);
    try {
      const result = await superAdminService.resetTenantAdminPassword(tenantId);
      setResetPasswordConfirmOpen(false);
      setToastMsg(
        result.resetEmailSent
          ? `Password reset link sent to ${result.adminEmail}`
          : `Reset link generated for ${result.adminEmail}, but the notification email could not be sent`
      );
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not reset Admin password');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const openSubDialog = () => {
    setSubPlan(tenant?.subscription?.plan || 'Professional');
    setSubAccessMode(tenant?.subscription?.trialEndsAt ? 'TRIAL' : 'INDEFINITE');
    setSubTrialDays(30);
    setSubDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    setSubSaving(true);
    try {
      const updated = await superAdminService.updateTenantSubscription(tenantId, {
        plan: subPlan,
        accessMode: subAccessMode,
        ...(subAccessMode === 'TRIAL' && { trialDays: subTrialDays }),
      });
      setTenant(updated);
      setSubDialogOpen(false);
      setToastMsg('Subscription updated.');
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Could not update subscription.');
    } finally {
      setSubSaving(false);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total Customers', val: stats.totalCustomers.toLocaleString('en-IN'), icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-200' },
        { label: 'Active Schemes', val: stats.activeSchemes.toLocaleString('en-IN'), icon: Coins, color: 'text-teal-600 bg-teal-50 border-teal-200' },
        { label: 'Revenue (YTD)', val: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { label: 'Gold Accumulated', val: `${stats.totalGoldAccumulatedGrams.toFixed(2)} g`, icon: Scale, color: 'text-blue-600 bg-blue-50 border-blue-200' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => router.push('/superadmin/tenants')}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-gold hover:text-gold transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-xl text-[#0B0E23]">
            {tenant?.name ?? 'Tenant Details'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Tenant workspace details and business statistics.</p>
        </div>
        {tenant && (
          tenant.status === 'Active' ? (
            <Button size="sm" variant="outline" onClick={() => setDisableConfirmOpen(true)} className="border-red-200 text-red-700 hover:bg-red-50">
              <ShieldOff className="w-4 h-4 mr-1.5" /> Disable Tenant
            </Button>
          ) : (
            <Button size="sm" isLoading={toggling} onClick={handleEnable} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Enable Tenant
            </Button>
          )
        )}
      </div>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full max-w-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      )}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60 max-w-lg">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadTenant}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && tenant && (
        <>
          <Card className="p-6 max-w-lg border-slate-200 shadow-xs space-y-1 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Tenant ID</span>
              <span className="font-bold text-[#0B0E23] font-mono">{tenant.id}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Slug</span>
              <span className="font-mono text-[#0B0E23]">{tenant.slug}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Status</span>
              <Badge variant={TENANT_STATUS_BADGE[tenant.status]} dot>{tenant.status}</Badge>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Admin Contact</span>
              <span className="font-bold text-[#0B0E23] text-right">
                {tenant.adminName ?? <span className="text-slate-400 font-normal">No Admin user yet</span>}
                {tenant.adminName && (tenant.adminPhone || tenant.adminEmail) && (
                  <div className="text-[10px] text-slate-400 font-mono font-normal">{tenant.adminPhone || tenant.adminEmail}</div>
                )}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Onboarded</span>
              <span className="text-[#0B0E23]">{new Date(tenant.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500 font-medium">Last Updated</span>
              <span className="text-[#0B0E23]">{new Date(tenant.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          </Card>

          {tenant.adminName && (
            <Card className="p-5 max-w-lg border-slate-200 shadow-xs">
              <CardHeader className="p-0 mb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#0B0E23]">Admin Account</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Controls this tenant&apos;s own login — deactivating blocks access immediately.
                  </p>
                </div>
                <Badge variant={tenant.adminIsActive ? 'success' : 'danger'} dot>
                  {tenant.adminIsActive ? 'Active' : 'Deactivated'}
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex items-center gap-2">
                {tenant.adminIsActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeactivateAdminConfirmOpen(true)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1.5" /> Deactivate Admin
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    isLoading={adminActionLoading}
                    onClick={handleReactivateAdmin}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Reactivate Admin
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setResetPasswordConfirmOpen(true)}>
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Reset Password
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="p-5 max-w-lg border-slate-200 shadow-xs">
            <CardHeader className="p-0 mb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B0E23]">Subscription / Access</CardTitle>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Enforced at login and token refresh — an expired trial actually blocks access.
                </p>
              </div>
              {tenant.subscription && (
                <Badge variant={SUBSCRIPTION_STATUS_BADGE[tenant.subscription.status] || 'neutral'} dot>
                  {tenant.subscription.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Plan</span>
                <span className="font-bold text-[#0B0E23]">{tenant.subscription?.plan ?? 'No subscription'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Access</span>
                <span className="font-bold text-[#0B0E23]">
                  {tenant.subscription?.trialEndsAt
                    ? `Trial — expires ${new Date(tenant.subscription.trialEndsAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
                    : 'Indefinite'}
                </span>
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={openSubDialog}>
                <CalendarClock className="w-3.5 h-3.5 mr-1.5" /> Manage Subscription
              </Button>
            </CardContent>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-xs max-w-3xl">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-bold text-[#0B0E23]">Business Statistics</CardTitle>
              <p className="text-xs text-slate-500 font-medium">{stats?.range.label ?? 'This Year'}</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, idx) => {
                  const IconComp = s.icon;
                  return (
                    <Card key={idx} variant="statistic" className="p-4">
                      <div className={`p-2 rounded-xl ${s.color} border shadow-2xs inline-flex mb-2`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                      <div className="text-lg font-extrabold text-[#0B0E23] font-display mt-0.5">{s.val}</div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Active Enrollments</div>
                  <div className="text-base font-extrabold text-[#0B0E23] mt-0.5">{stats?.activeEnrollments}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Completed Enrollments</div>
                  <div className="text-base font-extrabold text-[#0B0E23] mt-0.5">{stats?.completedEnrollments}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Outstanding Dues</div>
                  <div className="text-base font-extrabold text-[#0B0E23] mt-0.5">{formatCurrency(stats?.outstandingDues ?? 0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        isOpen={disableConfirmOpen}
        onClose={() => !toggling && setDisableConfirmOpen(false)}
        title="Disable Tenant"
      >
        <p className="text-xs text-slate-600">
          Disable <span className="font-bold text-[#0B0E23]">{tenant?.name}</span>? This sets the tenant&apos;s status to
          Inactive, hides it from public store selection, and immediately blocks any further login or session refresh
          for this tenant&apos;s users. An access token already issued stays valid only until it naturally expires
          (a short window).
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDisableConfirmOpen(false)} disabled={toggling}>
            Cancel
          </Button>
          <Button size="sm" isLoading={toggling} onClick={handleConfirmDisable} className="bg-red-600 hover:bg-red-700 text-white">
            Disable Tenant
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={deactivateAdminConfirmOpen}
        onClose={() => !adminActionLoading && setDeactivateAdminConfirmOpen(false)}
        title="Deactivate Admin Account"
      >
        <p className="text-xs text-slate-600">
          Deactivate the Admin account for <span className="font-bold text-[#0B0E23]">{tenant?.name}</span>? Unlike
          disabling the tenant, this <strong>immediately blocks</strong> the Admin from logging in or using any
          existing session.
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDeactivateAdminConfirmOpen(false)} disabled={adminActionLoading}>
            Cancel
          </Button>
          <Button size="sm" isLoading={adminActionLoading} onClick={handleConfirmDeactivateAdmin} className="bg-red-600 hover:bg-red-700 text-white">
            Deactivate Admin
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={resetPasswordConfirmOpen}
        onClose={() => !adminActionLoading && setResetPasswordConfirmOpen(false)}
        title="Reset Admin Password"
      >
        <p className="text-xs text-slate-600">
          Send a password reset link to <span className="font-bold text-[#0B0E23]">{tenant?.adminEmail ?? 'this tenant\'s Admin'}</span>?
          The link expires shortly and can only be used once.
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setResetPasswordConfirmOpen(false)} disabled={adminActionLoading}>
            Cancel
          </Button>
          <Button size="sm" isLoading={adminActionLoading} onClick={handleConfirmResetPassword}>
            Send Reset Link
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={subDialogOpen}
        onClose={() => !subSaving && setSubDialogOpen(false)}
        title="Manage Subscription"
      >
        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Plan</label>
            <Select value={subPlan} onChange={(e) => setSubPlan(e.target.value)}>
              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Access Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubAccessMode('TRIAL')}
                className={`p-2.5 rounded-xl border text-left transition-all ${subAccessMode === 'TRIAL' ? 'bg-gold text-white border-gold' : 'bg-white border-slate-200 hover:border-gold/50'}`}
              >
                <span className="text-xs font-bold block">Trial</span>
                <span className={`text-[10px] ${subAccessMode === 'TRIAL' ? 'text-white/80' : 'text-slate-400'}`}>Extend by N days from now</span>
              </button>
              <button
                type="button"
                onClick={() => setSubAccessMode('INDEFINITE')}
                className={`p-2.5 rounded-xl border text-left transition-all ${subAccessMode === 'INDEFINITE' ? 'bg-gold text-white border-gold' : 'bg-white border-slate-200 hover:border-gold/50'}`}
              >
                <span className="text-xs font-bold block">Indefinite</span>
                <span className={`text-[10px] ${subAccessMode === 'INDEFINITE' ? 'text-white/80' : 'text-slate-400'}`}>No auto-expiry</span>
              </button>
            </div>
          </div>
          {subAccessMode === 'TRIAL' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Extend Access By (days from today)</label>
              <Input type="number" min={1} max={3650} value={subTrialDays} onChange={(e) => setSubTrialDays(e.target.value ? parseInt(e.target.value, 10) : 1)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setSubDialogOpen(false)} disabled={subSaving}>
            Cancel
          </Button>
          <Button size="sm" isLoading={subSaving} onClick={handleSaveSubscription}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
