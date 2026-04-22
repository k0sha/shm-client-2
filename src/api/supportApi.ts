import type { InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { getCookie } from './cookie';
import type { Ticket, TicketMessage, TicketAttachment, TicketUserInfo, TicketType } from '../data/mockTickets';

const client = axios.create({ baseURL: '/shm_support/v1', withCredentials: true });

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie();
  if (token) config.headers['session_id'] = token;
  return config;
});

// --- Response transformers ---

function transformAttachment(a: Record<string, unknown>): TicketAttachment {
  return {
    id: a.id as string,
    name: a.filename as string,
    size: a.size as number,
    mimeType: a.mimeType as string,
    url: (a.url as string) ?? '',
  };
}

function transformMessage(m: Record<string, unknown>): TicketMessage {
  return {
    id: m.id as string,
    authorId: m.authorId as number,
    authorName: m.authorName as string,
    isSpecialist: m.isSpecialist as boolean,
    text: (m.text as string) ?? '',
    createdAt: m.createdAt as string,
    attachments: (m.attachments as Record<string, unknown>[])?.map(transformAttachment),
  };
}

function transformTicket(t: Record<string, unknown>): Ticket {
  return {
    id: t.id as string,
    type: t.type as TicketType,
    status: t.status as Ticket['status'],
    createdAt: t.createdAt as string,
    updatedAt: t.updatedAt as string,
    userId: t.userId as number,
    userLogin: t.userLogin as string,
    userLogin2: t.userLogin2 as string | undefined,
    assignedTo: t.assignedTo as string | undefined,
    lastMessage: t.lastMessage as string | undefined,
    messages: (t.messages as Record<string, unknown>[])?.map(transformMessage) ?? [],
  };
}

// --- API ---

export const supportApi = {
  listTickets: async (params?: { status?: string }): Promise<Ticket[]> => {
    const res = await client.get('/tickets', { params });
    return (res.data as Record<string, unknown>[]).map(transformTicket);
  },

  getTicket: async (id: string): Promise<Ticket> => {
    const res = await client.get(`/tickets/${id}`);
    return transformTicket(res.data as Record<string, unknown>);
  },

  createTicket: async (type: TicketType): Promise<Ticket> => {
    const res = await client.post('/tickets', { type });
    return transformTicket(res.data as Record<string, unknown>);
  },

  updateTicket: async (id: string, data: { status?: string; take?: boolean }): Promise<Ticket> => {
    const res = await client.patch(`/tickets/${id}`, data);
    return transformTicket(res.data as Record<string, unknown>);
  },

  sendMessage: async (ticketId: string, text: string, files: File[]): Promise<TicketMessage> => {
    const form = new FormData();
    if (text.trim()) form.append('text', text.trim());
    for (const file of files) form.append('files', file);
    const res = await client.post(`/tickets/${ticketId}/messages`, form);
    return transformMessage(res.data as Record<string, unknown>);
  },

  getUserInfo: async (userId: number): Promise<TicketUserInfo> => {
    const res = await client.get(`/users/${userId}/info`);
    const d = res.data as Record<string, unknown>;
    return {
      user_id: d.user_id as number,
      login: d.login as string,
      login2: d.login2 as string | undefined,
      fullName: d.full_name as string | undefined,
      balance: d.balance as number,
      bonuses: d.bonuses as number,
      discount: d.discount as number,
      created: '',
      services: (d.services as TicketUserInfo['services']) ?? [],
    };
  },
};
