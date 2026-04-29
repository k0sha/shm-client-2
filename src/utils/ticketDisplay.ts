import type { Ticket } from '../types/tickets';
import type { ReferralUser } from '../api/client';

export function displayUser(ticket: Ticket): string {
  if (ticket.userFullName) return ticket.userFullName;
  const email = ticket.userLogin2 && !ticket.userLogin2.startsWith('@') ? ticket.userLogin2 : null;
  const tg = ticket.userLogin?.startsWith('@') ? ticket.userLogin : null;
  if (email && tg) return `${tg} · ${email}`;
  if (email) return email;
  if (tg) return tg;
  if (ticket.userLogin) return ticket.userLogin;
  return `#${ticket.userId}`;
}

export function displayReferralUser(ref: ReferralUser): string {
  if (ref.full_name && ref.full_name.trim()) return ref.full_name.trim();
  if (ref.login && ref.login.trim()) return ref.login.trim();
  if (ref.login2 && ref.login2.trim()) return ref.login2.trim();
  return `#${ref.user_id}`;
}
