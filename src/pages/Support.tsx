import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Button, Tabs, Text, Paper,
  Box, ActionIcon, Badge, Loader, Center,
} from '@mantine/core';
import { IconPlus, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { TicketCreateModal } from '../components/support/TicketCreateModal';
import { supportApi } from '../api/supportApi';
import type { Ticket } from '../data/mockTickets';

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

  return (
    <Paper
      withBorder p="md" radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/support/${ticket.id}`)}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            {ticket.unread && (
              <Box style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: 'var(--mantine-color-blue-6)' }} />
            )}
            {ticket.number && <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>#{ticket.number}</Text>}
            <Text fw={ticket.unread ? 700 : 500} size="sm" truncate>
              {t(`tickets.ticketType.${ticket.type}`)}
            </Text>
          </Group>
          <Group gap="xs">
            <TicketStatusBadge status={ticket.status} />
          </Group>
          {ticket.lastMessage && (
            <Text size="xs" c="dimmed" lineClamp={1}>{ticket.lastMessage}</Text>
          )}
        </Stack>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed">{formatDate(ticket.updatedAt)}</Text>
          <ActionIcon variant="subtle" color="gray" size="sm">
            <IconChevronRight size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}

export default function Support() {
  const { t } = useTranslation();
  const { setSupportUnreadCount } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportApi.listTickets({ own: true })
      .then((data) => {
        setTickets(data);
        setSupportUnreadCount(data.filter((tk) => tk.unread).length);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onNew = (e: Event) => {
      const { ticketId, isSpecialist } = (e as CustomEvent<{ ticketId: string; isSpecialist: boolean }>).detail;
      if (!isSpecialist) return;
      setTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === ticketId);
        if (idx === -1) return prev;
        const ticket = { ...prev[idx], unread: true };
        return [ticket, ...prev.filter((_, i) => i !== idx)];
      });
    };
    const onOpened = (e: Event) => {
      const { ticketId } = (e as CustomEvent<{ ticketId: string }>).detail;
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, unread: false } : t));
    };
    window.addEventListener('ticket:new_message', onNew);
    window.addEventListener('ticket:opened', onOpened);
    return () => {
      window.removeEventListener('ticket:new_message', onNew);
      window.removeEventListener('ticket:opened', onOpened);
    };
  }, []);

  const activeTickets = tickets.filter((tk) => ACTIVE_STATUSES.has(tk.status));
  const closedTickets = tickets.filter((tk) => CLOSED_STATUSES.has(tk.status));
  const openCount = tickets.filter((tk) => tk.status === 'open').length;

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
          <Tabs.Tab
            value="active"
            rightSection={openCount > 0
              ? <Badge size="xs" variant="filled" color="blue" circle>{openCount}</Badge>
              : undefined}
          >
            {t('tickets.tabActive')}
          </Tabs.Tab>
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
