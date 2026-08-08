"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/form-controls';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Toast } from '@/components/ui/toast';
import { ArrowLeft, LifeBuoy, Plus, Send, ChevronRight } from 'lucide-react';
import { customerSupportService, Ticket, TicketDetail, TicketStatus } from '@/services/customerSupportService';
import { ApiError } from '@/lib/apiClient';

const STATUS_VARIANT: Record<TicketStatus, 'gold' | 'success' | 'inactive'> = {
  OPEN: 'gold',
  IN_PROGRESS: 'gold',
  RESOLVED: 'success',
  CLOSED: 'inactive',
};

const CATEGORIES = ['Payment', 'Scheme', 'KYC', 'Catalogue', 'Account', 'Other'];

const EMPTY_FORM = { subject: '', description: '', category: 'Other' };

export default function CustomerSupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await customerSupportService.getMyTickets();
      setTickets(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load your support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreate = async () => {
    setFormError('');
    if (form.subject.trim().length < 3 || form.description.trim().length < 3) {
      setFormError('Please enter a subject and description.');
      return;
    }
    setCreating(true);
    try {
      await customerSupportService.createTicket(form);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await loadTickets();
      setToast({ message: 'Support ticket raised.', type: 'success' });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not raise ticket.');
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setReplyText('');
    setDetailLoading(true);
    try {
      const data = await customerSupportService.getTicketDetail(id);
      setDetail(data);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not load ticket.', type: 'error' });
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    try {
      await customerSupportService.replyToTicket(detail.id, replyText.trim());
      setReplyText('');
      const refreshed = await customerSupportService.getTicketDetail(detail.id);
      setDetail(refreshed);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not send reply.', type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customer/profile')}
            className="w-8 h-8 rounded-full bg-white border border-slate-line flex items-center justify-center text-slate hover:border-gold"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display font-bold text-base text-ink">Help & Support</h1>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Ticket
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      )}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadTickets}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && tickets.length === 0 && (
        <EmptyState
          icon={<LifeBuoy className="h-7 w-7 text-gold" />}
          title="No support tickets yet"
          description="Raise a ticket if you need help with payments, schemes, KYC, or your account."
          actionLabel="New Ticket"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {!loading && !loadError && tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card
              key={t.id}
              onClick={() => openDetail(t.id)}
              className="p-4 border-slate-line cursor-pointer hover:border-gold transition-all"
            >
              <CardContent className="p-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm text-ink truncate">{t.subject}</div>
                  <div className="text-[11px] text-slate-muted font-mono mt-0.5">{t.ticketNumber} · {t.category}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace('_', ' ')}</Badge>
                  <ChevronRight className="h-4 w-4 text-slate-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE TICKET DIALOG */}
      <Dialog isOpen={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Raise a Support Ticket">
        <div className="space-y-3">
          {formError && (
            <div role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject</label>
            <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Briefly describe the issue" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Add any relevant details" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={creating}>
            {creating ? 'Submitting…' : 'Submit Ticket'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* TICKET DETAIL DIALOG */}
      <Dialog isOpen={!!detailId} onClose={() => setDetailId(null)} title="Support Ticket" maxWidth="max-w-lg">
        {detailLoading && <Skeleton className="h-40 w-full" />}
        {!detailLoading && detail && (
          <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <div className="font-bold text-sm text-ink">{detail.subject}</div>
              <div className="text-[10px] text-slate-muted font-mono">{detail.ticketNumber}</div>
              <Badge variant={STATUS_VARIANT[detail.status]} className="mt-2">{detail.status.replace('_', ' ')}</Badge>
              <p className="text-slate-600 mt-2 leading-relaxed">{detail.description}</p>
            </div>

            <div className="space-y-2 border-t border-slate-line pt-3">
              {detail.messages.length === 0 && <p className="text-slate-muted">No replies yet.</p>}
              {detail.messages.map((m) => (
                <div key={m.id} className="bg-cream rounded-xl p-3 border border-slate-line">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink">{m.senderName}</span>
                    <span className="text-[10px] text-slate-muted">
                      {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            {detail.status !== 'CLOSED' && (
              <div className="flex items-end gap-2 pt-1">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button size="sm" className="h-10" onClick={handleReply} disabled={replying || !replyText.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
