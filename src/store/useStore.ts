import { create } from 'zustand';
import { removeCookie } from '../api/cookie';

interface User {
  user_id: number;
  login: string;
  full_name?: string;
  phone?: string;
  balance: number;
  credit: number;
  discount: number;
  bonus: number;
  gid: number;
  telegram_user_id?: number;
}

interface AppState {
  user: User | null;
  userEmail: string | null;
  userEmailVerified: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailLoaded: boolean;
  telegramPhoto: string | null;
  hasNewTicketMessages: boolean;
  lastTicketCheck: number;
  isSupportUser: boolean;
  supportUnreadCount: number;
  ticketsUnreadCount: number;
  openedTicketIds: Set<string>;

  setUser: (user: User | null) => void;
  setUserEmail: (email: string | null) => void;
  setUserEmailVerified: (verified: number | 0) => void;
  setIsLoading: (loading: boolean) => void;
  setIsEmailLoaded: (loaded: boolean) => void;
  setTelegramPhoto: (photo: string | null) => void;
  setHasNewTicketMessages: (hasNew: boolean) => void;
  setLastTicketCheck: (timestamp: number) => void;
  setIsSupportUser: (value: boolean) => void;
  setSupportUnreadCount: (n: number) => void;
  setTicketsUnreadCount: (n: number) => void;
  incrementSupportUnread: () => void;
  incrementTicketsUnread: () => void;
  decrementSupportUnread: () => void;
  decrementTicketsUnread: () => void;
  markTicketOpened: (ticketId: string) => void;
  clearOpenedTickets: () => void;
  openVerifyModal: boolean;
  setOpenVerifyModal: (open: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userEmail: null,
  userEmailVerified: null,
  isAuthenticated: false,
  isLoading: true,
  isEmailLoaded: false,
  telegramPhoto: localStorage.getItem('shm_telegram_photo'),
  hasNewTicketMessages: false,
  lastTicketCheck: parseInt(localStorage.getItem('shm_last_ticket_check') || '0'),
  isSupportUser: false,
  supportUnreadCount: 0,
  ticketsUnreadCount: 0,
  openedTicketIds: new Set<string>(),
  openVerifyModal: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setUserEmail: (email) => set({ userEmail: email }),
  setUserEmailVerified: (verified) => set({ userEmailVerified: verified }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsEmailLoaded: (loaded) => set({ isEmailLoaded: loaded }),
  setTelegramPhoto: (photo) => {
    if (photo) {
      localStorage.setItem('shm_telegram_photo', photo);
    } else {
      localStorage.removeItem('shm_telegram_photo');
    }
    set({ telegramPhoto: photo });
  },
  setHasNewTicketMessages: (hasNew) => set({ hasNewTicketMessages: hasNew }),
  setLastTicketCheck: (timestamp) => {
    localStorage.setItem('shm_last_ticket_check', String(timestamp));
    set({ lastTicketCheck: timestamp });
  },
  setIsSupportUser: (value: boolean) => set({ isSupportUser: value }),
  setSupportUnreadCount: (n: number) => set({ supportUnreadCount: n }),
  setTicketsUnreadCount: (n: number) => set({ ticketsUnreadCount: n }),
  incrementSupportUnread: () => set((s) => ({ supportUnreadCount: s.supportUnreadCount + 1 })),
  incrementTicketsUnread: () => set((s) => ({ ticketsUnreadCount: s.ticketsUnreadCount + 1 })),
  decrementSupportUnread: () => set((s) => ({ supportUnreadCount: Math.max(0, s.supportUnreadCount - 1) })),
  decrementTicketsUnread: () => set((s) => ({ ticketsUnreadCount: Math.max(0, s.ticketsUnreadCount - 1) })),
  markTicketOpened: (ticketId: string) => set((s) => ({ openedTicketIds: new Set([...s.openedTicketIds, ticketId]) })),
  clearOpenedTickets: () => set({ openedTicketIds: new Set<string>() }),
  setOpenVerifyModal: (open) => set({ openVerifyModal: open }),
  logout: () => {
    removeCookie();
    localStorage.removeItem('shm_telegram_photo');
    set({ user: null, isAuthenticated: false, telegramPhoto: null, hasNewTicketMessages: false, userEmail: null, userEmailVerified: null, isEmailLoaded: false, isSupportUser: false });
  },
}));
