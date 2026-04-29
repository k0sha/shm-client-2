import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Button, Tabs, Text, Card,
  Box, Badge, Loader, Center,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { STATUS_COLORS } from '../components/support/TicketStatusBadge';
import { TicketCreateModal } from '../components/support/TicketCreateModal';
import { supportApi } from '../api/supportApi';
import type { Ticket } from '../types/tickets';

const ACTIVE_STATUSES = new Set(['open', 'in_progress', 'waiting']);
const CLOSED_STATUSES = new Set(['resolved', 'closed']);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[ticket.status] || 'gray';
  const statusLabel = t(`tickets.status.${ticket.status}`);
  const isNewTicket = !ticket.assignedTo;
  const showBadge = isNewTicket || ticket.unread;
  const badgeLabel = isNewTicket ? t('tickets.newTicket') : t('tickets.newMessage');

  return (
    <Card
      withBorder radius="md" p="md"
      className="service-card-desktop"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/support/${ticket.id}`)}
    >
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
              {statusLabel} · {formatDate(ticket.updatedAt)}
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

export default function Support() {
  const { t } = useTranslation();
  const { setSupportUnreadCount, openedTicketIds, clearOpenedTickets } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportApi.listTickets({ own: true })
      .then((data) => {
        const resolved = openedTicketIds.size > 0
          ? data.map((tk) => openedTicketIds.has(tk.id) ? { ...tk, unread: false } : tk)
          : data;
        setTickets(resolved);
        setSupportUnreadCount(resolved.filter((tk) => tk.unread).length);
        clearOpenedTickets();
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onNew = (e: Event) => {
      const { ticketId, target, isSpecialist, lastMessage } = (e as CustomEvent<{ ticketId: string; isSpecialist: boolean; target?: string; lastMessage?: string | null }>).detail;
      const forUser = target === 'user' || (target == null && isSpecialist);
      if (!forUser) return;
      setTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === ticketId);
        if (idx === -1) return prev;
        const ticket = { ...prev[idx], unread: true, updatedAt: new Date().toISOString(), ...(lastMessage != null ? { lastMessage } : {}) };
        return [ticket, ...prev.filter((_, i) => i !== idx)];
      });
    };
    window.addEventListener('ticket:new_message', onNew);
    return () => { window.removeEventListener('ticket:new_message', onNew); };
  }, []);

  useEffect(() => {
    const onUpdated = (e: Event) => {
      const { ticketId, status, assignedTo } = (e as CustomEvent<{ ticketId: string; status: string; assignedTo: string | null }>).detail;
      setTickets((prev) => prev.map((tk) =>
        tk.id === ticketId ? { ...tk, status: status as Ticket['status'], assignedTo: assignedTo ?? undefined } : tk
      ));
    };
    window.addEventListener('ticket:updated', onUpdated);
    return () => { window.removeEventListener('ticket:updated', onUpdated); };
  }, []);

  const activeTickets = tickets.filter((tk) => ACTIVE_STATUSES.has(tk.status));
  const closedTickets = tickets.filter((tk) => CLOSED_STATUSES.has(tk.status));

  if (loading) {
    return <Center py="xl"><Loader /></Center>;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>{t('nav.support')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
          {t('tickets.createTicket')}
        </Button>
      </Group>

      <Tabs defaultValue="active">
        <Tabs.List>
          <Tabs.Tab value="active">{t('tickets.tabActive')}</Tabs.Tab>
          <Tabs.Tab value="closed">{t('tickets.tabClosed')}</Tabs.Tab>
          <Tabs.Tab value="all">{t('tickets.tabAll')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" pt="md">
          <Stack gap="sm">
            {activeTickets.length === 0
              ? <Text c="dimmed" ta="center" py="xl">{t('tickets.noActiveTickets')}</Text>
              : activeTickets.map((tk) => <TicketCard key={tk.id} ticket={tk} />)}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="closed" pt="md">
          <Stack gap="sm">
            {closedTickets.length === 0
              ? <Text c="dimmed" ta="center" py="xl">{t('tickets.noTickets')}</Text>
              : closedTickets.map((tk) => <TicketCard key={tk.id} ticket={tk} />)}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="all" pt="md">
          <Stack gap="sm">
            {tickets.length === 0
              ? <Text c="dimmed" ta="center" py="xl">{t('tickets.noTickets')}</Text>
              : tickets.map((tk) => <TicketCard key={tk.id} ticket={tk} />)}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <TicketCreateModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])}
      />
    </Stack>
  );
}
