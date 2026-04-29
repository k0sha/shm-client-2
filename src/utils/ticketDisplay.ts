import type { Ticket } from '../types/tickets';

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
