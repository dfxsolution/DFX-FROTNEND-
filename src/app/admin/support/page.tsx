"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select, Textarea } from '@/components/ui/form-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Toast } from '@/components/ui/toast';
import { LifeBuoy, Send } from 'lucide-react';
import { supportService, AdminTicket, AdminTicketDetail, TicketStatus, TicketPriority } from '@/services/supportService';
import { ApiError } from '@/lib/apiClient';

const STATUS_BADGE: Record<TicketStatus, 'warn' | 'gold' | 'success' | 'inactive'> = {
  OPEN: 'warn',
  IN_PROGRESS: 'gold',
  RESOLVED: 'success',
  CLOSED: 'inactive',
};

const PRIORITY_BADGE: Record<TicketPriority, 'inactive' | 'gold' | 'warn' | 'danger'> = {
  LOW: 'inactive',
  MEDIUM: 'gold',
  HIGH: 'warn',
  URGENT: 'danger',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await supportService.getTickets();
      setTickets(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailError('');
    setReplyText('');
    setDetailLoading(true);
    try {
      const data = await supportService.getTicketDetail(id);
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Could not load ticket detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async (id: string) => {
    const data = await supportService.getTicketDetail(id);
    setDetail(data);
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!detail) return;
    setUpdating(true);
    try {
      await supportService.updateTicket(detail.id, { status });
      await refreshDetail(detail.id);
      await loadTickets();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not update ticket status.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!detail) return;
    setUpdating(true);
    try {
      await supportService.updateTicket(detail.id, { priority });
      await refreshDetail(detail.id);
      await loadTickets();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not update ticket priority.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    try {
      await supportService.replyToTicket(detail.id, replyText.trim());
      setReplyText('');
      await refreshDetail(detail.id);
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : 'Could not send reply.', type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  const filtered = statusFilter === 'All' ? tickets : tickets.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Customer Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Review, prioritize, and reply to support tickets raised by your customers.
          </p>
        </div>

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')} className="w-40">
          <option value="All">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadTickets}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && filtered.length === 0 && (
        <EmptyState
          icon={<LifeBuoy className="h-7 w-7 text-gold" />}
          title="No support tickets"
          description={statusFilter === 'All' ? 'No customers have raised a support ticket yet.' : 'No tickets match this status filter.'}
        />
      )}

      {!loading && !loadError && filtered.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((t) => (
                  <tr key={t.id} onClick={() => openDetail(t.id)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                    <td className="p-4">
                      <div className="font-bold text-[#0B0E23]">{t.subject}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.ticketNumber}</div>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">
                      <div>{t.customerName}</div>
                      <div>{t.customerEmail || '—'}</div>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">{t.category}</td>
                    <td className="p-4 text-center">
                      <Badge variant={PRIORITY_BADGE[t.priority]} className="text-[10px]">{t.priority}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={STATUS_BADGE[t.status]} className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500">
                      {new Date(t.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TICKET DETAIL DIALOG */}
      <Dialog isOpen={!!detailId} onClose={() => setDetailId(null)} title="Support Ticket" maxWidth="max-w-lg">
        {detailLoading && <Skeleton className="h-48 w-full" />}
        {!detailLoading && detailError && <p className="text-xs font-medium text-red-700">{detailError}</p>}
        {!detailLoading && !detailError && detail && (
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <div className="font-bold text-sm text-[#0B0E23]">{detail.subject}</div>
              <div className="text-[10px] text-slate-400 font-mono">{detail.ticketNumber} · {detail.customerName}</div>
              <p className="text-slate-600 mt-2 leading-relaxed">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Status</label>
                <Select value={detail.status} disabled={updating} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Priority</label>
                <Select value={detail.priority} disabled={updating} onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="font-bold text-slate-500 uppercase text-[10px]">Message Thread</label>
              {detail.messages.length === 0 && <p className="text-slate-400">No replies yet.</p>}
              {detail.messages.map((m) => (
                <div key={m.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#0B0E23]">{m.senderName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 pt-1">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply to the customer..."
                className="flex-1"
              />
              <Button size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold h-10" onClick={handleReply} disabled={replying || !replyText.trim()}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
