import { apiClient } from '@/lib/apiClient';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface BackendTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

function mapTicket(raw: BackendTicket): Ticket {
  return {
    id: raw.id,
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

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

interface BackendFAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

function mapFAQ(raw: BackendFAQ): FAQ {
  return { id: raw.id, question: raw.question, answer: raw.answer, category: raw.category ?? '' };
}

export interface TicketCreateData {
  subject: string;
  description: string;
  category: string;
  priority?: TicketPriority;
}

export const customerSupportService = {
  /** GET /api/v1/customer/support/tickets */
  async getMyTickets(): Promise<Ticket[]> {
    const res = await apiClient.get<{ tickets: BackendTicket[] }>('/customer/support/tickets', { auth: true });
    return res.data.tickets.map(mapTicket);
  },

  /** GET /api/v1/customer/support/tickets/{id} */
  async getTicketDetail(id: string): Promise<TicketDetail> {
    const res = await apiClient.get<{ ticket: BackendTicket & { messages: BackendMessage[] } }>(
      `/customer/support/tickets/${id}`,
      { auth: true }
    );
    return { ...mapTicket(res.data.ticket), messages: res.data.ticket.messages.map(mapMessage) };
  },

  /** POST /api/v1/customer/support/tickets */
  async createTicket(data: TicketCreateData): Promise<Ticket> {
    const res = await apiClient.post<{ ticket: BackendTicket }>('/customer/support/tickets', data, { auth: true });
    return mapTicket(res.data.ticket);
  },

  /** POST /api/v1/customer/support/tickets/{id}/messages */
  async replyToTicket(id: string, message: string): Promise<TicketMessage> {
    const res = await apiClient.post<{ message: BackendMessage }>(
      `/customer/support/tickets/${id}/messages`,
      { message },
      { auth: true }
    );
    return mapMessage(res.data.message);
  },

  /** GET /api/v1/customer/support/faqs */
  async getFAQs(): Promise<FAQ[]> {
    const res = await apiClient.get<{ faqs: BackendFAQ[] }>('/customer/support/faqs', { auth: true });
    return res.data.faqs.map(mapFAQ);
  },
};
