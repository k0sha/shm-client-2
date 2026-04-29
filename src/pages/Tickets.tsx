import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Tabs, Text, Card, Badge, Box, TextInput, Loader, Center,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { STATUS_COLORS } from '../components/support/TicketStatusBadge';
import { supportApi } from '../api/supportApi';
import type { Ticket, TicketStatus } from '../types/tickets';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function displayUser(ticket: Ticket): string {
  if (ticket.userFullName) return ticket.userFullName;
  const email = ticket.userLogin2 && !ticket.userLogin2.startsWith('@') ? ticket.userLogin2 : null;
  const tg = ticket.userLogin?.startsWith('@') ? ticket.userLogin : null;
  if (email && tg) return `${tg} · ${email}`;
  if (email) return email;
  if (tg) return tg;
  if (ticket.userLogin) return ticket.userLogin;
  return `#${ticket.userId}`;
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[ticket.status] || 'gray';
  const statusLabel = t(`tickets.status.${ticket.status}`);
  const isNewTicket = !ticket.assignedTo;
  const showBadge = isNewTicket || ticket.unread;
  const badgeLabel = isNewTicket ? t('tickets.newTicket') : t('tickets.newMessage');

  return (
    <Card withBorder radius="md" p="md" className="service-card-desktop" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${ticket.id}`)}>
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={500}>
            {ticket.number ? `#${ticket.number} - ` : ''}{t(`tickets.ticketType.${ticket.type}`)}
          </Text>
          <Group gap={6} wrap="nowrap" align="center" style={{ minWidth: 0 }}>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: `var(--mantine-color-${statusColor}-6)`,
                flexShrink: 0,
              }}
            />
            <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {statusLabel} · {formatDate(ticket.updatedAt)} · #{ticket.userId} {displayUser(ticket)}
              {ticket.assignedTo && ` · 🛡 ${ticket.assignedTo}`}
            </Text>
          </Group>
        </Stack>
        {showBadge && (
          <Badge color="blue" variant="filled" size="sm" style={{ flexShrink: 0 }}>
            {badgeLabel}
          </Badge>
        )}
      </Group>
    </Card>
  );
}

function TicketList({ tickets }: { tickets: Ticket[] }) {
  const { t } = useTranslation();
  if (tickets.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">{t('tickets.noActiveTickets')}</Text>;
  }
  return <Stack gap="sm">{tickets.map((tk) => <TicketRow key={tk.id} ticket={tk} />)}</Stack>;
}

export default function Tickets() {
  const { t } = useTranslation();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { setTicketsUnreadCount, incrementTicketsUnread, openedTicketIds, clearOpenedTickets } = useStore();

  useEffect(() => {
    supportApi.listTickets()
      .then((data) => {
        const resolved = openedTicketIds.size > 0
          ? data.map((tk) => openedTicketIds.has(tk.id) ? { ...tk, unread: false } : tk)
          : data;
        setAllTickets(resolved);
        setTicketsUnreadCount(resolved.filter((tk) => tk.unread).length);
        clearOpenedTickets();
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onNew = (e: Event) => {
      const { ticketId, target, isSpecialist, lastMessage } = (e as CustomEvent<{ ticketId: string; isSpecialist: boolean; target?: string; lastMessage?: string | null }>).detail;
      const forSpecialist = target === 'specialist' || (target == null && !isSpecialist);
      if (!forSpecialist) return;
      setAllTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === ticketId);
        if (idx === -1) return prev;
        const ticket = { ...prev[idx], unread: true, updatedAt: new Date().toISOString(), ...(lastMessage != null ? { lastMessage } : {}) };
        return [ticket, ...prev.filter((_, i) => i !== idx)];
      });
    };
    window.addEventListener('ticket:new_message', onNew);
    return () => {
      window.removeEventListener('ticket:new_message', onNew);
    };
  }, []);

  useEffect(() => {
    const onUpdated = (e: Event) => {
      const { ticketId, status, assignedTo } = (e as CustomEvent<{ ticketId: string; status: string; assignedTo: string | null }>).detail;
      setAllTickets((prev) => prev.map((tk) =>
        tk.id === ticketId ? { ...tk, status: status as TicketStatus, assignedTo: assignedTo ?? undefined } : tk
      ));
    };
    window.addEventListener('ticket:updated', onUpdated);
    return () => { window.removeEventListener('ticket:updated', onUpdated); };
  }, []);

  useEffect(() => {
    const onNewTicket = (e: Event) => {
      const { ticket } = (e as CustomEvent<{ ticket: Ticket }>).detail;
      if (!ticket) return;
      setAllTickets((prev) => {
        if (prev.some((t) => t.id === ticket.id)) return prev;
        return [ticket, ...prev];
      });
      incrementTicketsUnread();
    };
    window.addEventListener('ticket:new_ticket', onNewTicket);
    return () => {
      window.removeEventListener('ticket:new_ticket', onNewTicket);
    };
  }, []);

  function filter(statuses?: TicketStatus[]): Ticket[] {
    return allTickets.filter((tk) => {
      const matchesStatus = !statuses || statuses.includes(tk.status);
      const q = search.toLowerCase();
      const matchesSearch = !q
        || tk.userLogin.toLowerCase().includes(q)
        || (tk.userLogin2 ?? '').toLowerCase().includes(q)
        || String(tk.userId).includes(q);
      return matchesStatus && matchesSearch;
    });
  }

  if (loading) return <Center py="xl"><Loader /></Center>;

  return (
    <Stack gap="lg">
      <Title order={2}>{t('nav.tickets')}</Title>

      <TextInput
        placeholder={t('tickets.searchPlaceholder')}
        leftSection={<IconSearch size={14} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Tabs defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">{t('tickets.tabAll')}</Tabs.Tab>
          <Tabs.Tab value="in_progress">{t('tickets.status.in_progress')}</Tabs.Tab>
          <Tabs.Tab value="resolved">{t('tickets.status.resolved')}</Tabs.Tab>
          <Tabs.Tab value="closed">{t('tickets.status.closed')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md"><TicketList tickets={filter()} /></Tabs.Panel>
        <Tabs.Panel value="in_progress" pt="md"><TicketList tickets={filter(['in_progress', 'waiting'])} /></Tabs.Panel>
        <Tabs.Panel value="resolved" pt="md"><TicketList tickets={filter(['resolved'])} /></Tabs.Panel>
        <Tabs.Panel value="closed" pt="md"><TicketList tickets={filter(['closed'])} /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
