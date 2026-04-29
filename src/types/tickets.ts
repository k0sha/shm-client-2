export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketType = 'vpn' | 'setup' | 'payment' | 'account' | 'other';

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface TicketMessage {
  id: string;
  authorId: number;
  authorName: string;
  isSpecialist: boolean;
  isOwn?: boolean;
  text: string;
  createdAt: string;
  attachments?: TicketAttachment[];
}

export interface TicketUserService {
  user_service_id: number;
  name: string;
  status: string;
  expire: string | null;
}

export interface TicketUserInfo {
  user_id: number;
  login: string;
  login2?: string;
  fullName?: string;
  discount: number;
  balance: number;
  bonuses?: number;
  created: string;
  services: TicketUserService[];
}

export interface Ticket {
  id: string;
  number?: number;
  subject?: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userLogin: string;
  userLogin2?: string;
  userFullName?: string;
  assignedTo?: string;
  messages: TicketMessage[];
  lastMessage?: string;
  unread?: boolean;
  userInfo?: TicketUserInfo;
}
