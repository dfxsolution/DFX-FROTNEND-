import { apiClient } from '@/lib/apiClient';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface BackendAdminTicket {
  id: string;
  tenant_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string | null;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

function mapAdminTicket(raw: BackendAdminTicket): AdminTicket {
  return {
    id: raw.id,
    customerName: raw.customer_name,
    customerEmail: raw.customer_email ?? '',
    ticketNumber: raw.ticket_number,
    subject: raw.subject,
    description: raw.description,
    category: raw.category,
    priority: raw.priority as TicketPriority,
    status: raw.status as TicketStatus,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

interface BackendMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

function mapMessage(raw: BackendMessage): TicketMessage {
  return {
    id: raw.id,
    senderId: raw.sender_id,
    senderName: raw.sender_name,
    message: raw.message,
    createdAt: raw.created_at,
  };
}

export interface AdminTicketDetail extends AdminTicket {
  messages: TicketMessage[];
}

export const supportService = {
  /** GET /api/v1/admin/support/tickets */
  async getTickets(): Promise<AdminTicket[]> {
    const res = await apiClient.get<{ tickets: BackendAdminTicket[] }>('/admin/support/tickets', { auth: true });
    return res.data.tickets.map(mapAdminTicket);
  },

  /** GET /api/v1/admin/support/tickets/{id} */
  async getTicketDetail(id: string): Promise<AdminTicketDetail> {
    const res = await apiClient.get<{ ticket: BackendAdminTicket & { messages: BackendMessage[] } }>(
      `/admin/support/tickets/${id}`,
      { auth: true }
    );
    return { ...mapAdminTicket(res.data.ticket), messages: res.data.ticket.messages.map(mapMessage) };
  },

  /** PUT /api/v1/admin/support/tickets/{id} */
  async updateTicket(id: string, data: { status?: TicketStatus; priority?: TicketPriority }): Promise<AdminTicket> {
    const res = await apiClient.put<{ ticket: BackendAdminTicket }>(`/admin/support/tickets/${id}`, data, { auth: true });
    return mapAdminTicket(res.data.ticket);
  },

  /** POST /api/v1/admin/support/tickets/{id}/messages */
  async replyToTicket(id: string, message: string): Promise<TicketMessage> {
    const res = await apiClient.post<{ message: BackendMessage }>(
      `/admin/support/tickets/${id}/messages`,
      { message },
      { auth: true }
    );
    return mapMessage(res.data.message);
  },
};
