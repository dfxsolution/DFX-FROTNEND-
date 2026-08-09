"use client";

import React, { useEffect, useState } from 'react';
import {
  notificationCampaignService,
  NotificationCampaign,
  NotificationCampaignFormData,
  NotificationCampaignStatus,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TARGET_TYPES,
} from '@/services/notificationCampaignService';
import { schemeService, AdminScheme } from '@/services/schemeService';
import { customerService } from '@/services/customerService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/form-controls';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Bell, Send, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

const EMPTY_FORM: NotificationCampaignFormData = {
  title: '',
  body: '',
  channel: 'IN_APP',
  targetType: 'ALL',
  targetIds: [],
};

const TABS: { key: 'ALL' | NotificationCampaignStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'SENT', label: 'Sent' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function statusBadgeVariant(status: NotificationCampaignStatus): 'success' | 'danger' | 'draft' | 'neutral' {
  if (status === 'SENT') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'CANCELLED') return 'neutral';
  return 'draft';
}

export default function AdminNotificationsPage() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | NotificationCampaignStatus>('ALL');

  const [schemes, setSchemes] = useState<AdminScheme[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NotificationCampaignFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<NotificationCampaign | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadCampaigns = async (status?: NotificationCampaignStatus) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await notificationCampaignService.list(status);
      setCampaigns(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns(activeTab === 'ALL' ? undefined : activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    schemeService.getAdminSchemes().then(setSchemes).catch(() => {});
    customerService
      .getAdminCustomers(1, 100)
      .then((r) => setCustomers(r.customers.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async (thenSend: boolean) => {
    setFormError('');
    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.body.trim()) return setFormError('Message body is required.');
    if (form.targetType === 'CUSTOMERS' && form.targetIds.length === 0) return setFormError('Select at least one customer.');
    if (form.targetType === 'SCHEME' && form.targetIds.length !== 1) return setFormError('Select exactly one scheme.');

    setSaving(true);
    try {
      const created = await notificationCampaignService.create(form);
      if (thenSend) {
        const sent = await notificationCampaignService.send(created.id);
        setToast(
          sent.status === 'SENT'
            ? { message: `Sent to ${sent.recipientCount ?? 0} recipient(s).`, type: 'success' }
            : { message: sent.error || 'Could not send notification.', type: 'error' }
        );
      } else {
        setToast({ message: 'Saved as draft.', type: 'success' });
      }
      setDialogOpen(false);
      await loadCampaigns(activeTab === 'ALL' ? undefined : activeTab);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save notification.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendExisting = async (c: NotificationCampaign) => {
    setActionBusy(c.id);
    try {
      const sent = await notificationCampaignService.send(c.id);
      setToast(
        sent.status === 'SENT'
          ? { message: `Sent to ${sent.recipientCount ?? 0} recipient(s).`, type: 'success' }
          : { message: sent.error || 'Could not send notification.', type: 'error' }
      );
      await loadCampaigns(activeTab === 'ALL' ? undefined : activeTab);
      setDetail(null);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not send notification.', type: 'error' });
    } finally {
      setActionBusy(null);
    }
  };

  const handleCancel = async (c: NotificationCampaign) => {
    setActionBusy(c.id);
    try {
      await notificationCampaignService.cancel(c.id);
      setToast({ message: 'Notification cancelled.', type: 'success' });
      await loadCampaigns(activeTab === 'ALL' ? undefined : activeTab);
      setDetail(null);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not cancel notification.', type: 'error' });
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Author and send notifications to your customers — in-app today, other channels once configured.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold h-9">
          <Plus className="w-4 h-4 mr-1.5" /> New Notification
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 w-fit shadow-xs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === t.key ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => loadCampaigns(activeTab === 'ALL' ? undefined : activeTab)}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && campaigns.length === 0 && (
        <EmptyState
          icon={<Bell className="h-7 w-7 text-gold" />}
          title="No notifications yet"
          description="Create your first notification to reach your customers."
          actionLabel="New Notification"
          onAction={openCreateDialog}
        />
      )}

      {!loading && !loadError && campaigns.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Title</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Audience</th>
                  <th className="p-4 text-center">Recipients</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setDetail(c)}>
                    <td className="p-4 font-bold text-[#0B0E23]">{c.title}</td>
                    <td className="p-4">{c.channel}</td>
                    <td className="p-4">{NOTIFICATION_TARGET_TYPES.find((t) => t.key === c.targetType)?.label}</td>
                    <td className="p-4 text-center font-mono">{c.recipientCount ?? '—'}</td>
                    <td className="p-4 text-center">
                      <Badge variant={statusBadgeVariant(c.status)} dot>{c.status}</Badge>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {(c.status === 'DRAFT' || c.status === 'FAILED') && (
                          <button
                            onClick={() => handleSendExisting(c)}
                            disabled={actionBusy === c.id}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(c.status === 'DRAFT' || c.status === 'FAILED') && (
                          <button
                            onClick={() => handleCancel(c)}
                            disabled={actionBusy === c.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE DIALOG */}
      <Dialog isOpen={dialogOpen} onClose={() => !saving && setDialogOpen(false)} title="New Notification">
        <div className="space-y-3.5 text-xs">
          {formError && (
            <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Title *</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Diwali Gold Offer" />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase text-[10px]">Message *</label>
            <Textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="What do you want to tell your customers?" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Channel</label>
              <Select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as any }))}>
                {NOTIFICATION_CHANNELS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Audience</label>
              <Select
                value={form.targetType}
                onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value as any, targetIds: [] }))}
              >
                {NOTIFICATION_TARGET_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {form.channel !== 'IN_APP' && (
            <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {form.channel} delivery requires that provider to be configured in SuperAdmin &gt; Integrations. If it
                isn&apos;t, this notification will be saved but marked Failed rather than falsely shown as sent.
              </span>
            </div>
          )}

          {form.targetType === 'SCHEME' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Scheme *</label>
              <Select
                value={form.targetIds[0] || ''}
                onChange={(e) => setForm((f) => ({ ...f, targetIds: e.target.value ? [e.target.value] : [] }))}
              >
                <option value="">Select a scheme…</option>
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          )}

          {form.targetType === 'CUSTOMERS' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Customers *</label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {customers.length === 0 && <p className="p-3 text-slate-400">No customers found.</p>}
                {customers.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.targetIds.includes(c.id)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          targetIds: e.target.checked ? [...f.targetIds, c.id] : f.targetIds.filter((id) => id !== c.id),
                        }))
                      }
                    />
                    <span className="font-medium text-slate-700">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" isLoading={saving} onClick={() => handleSave(false)}>
            Save Draft
          </Button>
          <Button size="sm" isLoading={saving} onClick={() => handleSave(true)}>
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send Now
          </Button>
        </DialogFooter>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'Notification'}>
        {detail && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadgeVariant(detail.status)} dot>{detail.status}</Badge>
              <span className="text-slate-400">{detail.channel} · {NOTIFICATION_TARGET_TYPES.find((t) => t.key === detail.targetType)?.label}</span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">{detail.body}</p>
            {detail.status === 'SENT' && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to {detail.recipientCount ?? 0} recipient(s)
                {detail.sentAt && ` on ${new Date(detail.sentAt).toLocaleString()}`}.
              </div>
            )}
            {detail.status === 'FAILED' && detail.error && (
              <div className="flex items-start gap-1.5 text-red-700 font-medium bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {detail.error}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {detail && (detail.status === 'DRAFT' || detail.status === 'FAILED') && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleCancel(detail)} disabled={actionBusy === detail.id}>
                Cancel Draft
              </Button>
              <Button size="sm" isLoading={actionBusy === detail.id} onClick={() => handleSendExisting(detail)}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Send
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
