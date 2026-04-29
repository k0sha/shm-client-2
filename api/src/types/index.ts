export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketType = 'vpn' | 'setup' | 'payment' | 'account' | 'other';

export interface ShmListResponse<T> {
  data: T[];
  items: number;
  status: number;
}

export interface ShmUser {
  user_id: number;
  login: string;
  login2?: string;
  full_name?: string;
  balance: number;
  credit: number;
  discount: number;
}

export interface AuthUser {
  user_id: number;
  login: string;
  login2?: string;
  full_name?: string;
  isSpecialist: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthUser;
  }
}
