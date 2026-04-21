import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Button, Tabs, Text, Paper, Badge,
  Box, ActionIcon, Indicator, Select, TextInput,
} from '@mantine/core';
import {
  IconPlus, IconChevronRight, IconSearch, IconFilter,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { TicketCreateModal } from '../components/support/TicketCreateModal';
import { MOCK_MY_TICKETS, MOCK_ALL_TICKETS } from '../data/mockTickets';
import type { Ticket, TicketStatus } from '../data/mockTickets';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function TicketCard({ ticket, showUser = false }: { ticket: Ticket; showUser?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/support/${ticket.id}`)}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            {ticket.unread && <Indicator color="blue" size={8} position="middle-start" offset={-2}><Box w={0} /></Indicator>}
            <Text fw={ticket.unread ? 700 : 500} size="sm" truncate>
              {ticket.subject}
            </Text>
          </Group>
          <Group gap="xs">
            <TicketStatusBadge status={ticket.status} />
            <Badge variant="outline" size="xs" color="gray">
              {t(`tickets.ticketType.${ticket.type}`)}
            </Badge>
            {showUser && (
              <Text size="xs" c="dimmed">{ticket.userLogin}</Text>
            )}
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
  const [createOpen, setCreateOpen] = useState(false);
  const [myTickets, setMyTickets] = useState<Ticket[]>([...MOCK_MY_TICKETS]);
  const [allTickets] = useState<Ticket[]>([...MOCK_ALL_TICKETS]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const incomingTickets = allTickets.filter(
    (t) => t.status === 'open' && !t.assignedTo
  );

  const filteredAll = allTickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userLogin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusOptions = [
    { value: 'all', label: t('tickets.allStatuses') },
    { value: 'open', label: t('tickets.status.open') },
    { value: 'in_progress', label: t('tickets.status.in_progress') },
    { value: 'waiting', label: t('tickets.status.waiting') },
    { value: 'resolved', label: t('tickets.status.resolved') },
    { value: 'closed', label: t('tickets.status.closed') },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>{t('tickets.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
          {t('tickets.createTicket')}
        </Button>
      </Group>

      <Tabs defaultValue="my">
        <Tabs.List>
          <Tabs.Tab value="my">{t('tickets.myTickets')}</Tabs.Tab>
          <Tabs.Tab
            value="incoming"
            rightSection={
              incomingTickets.length > 0 ? (
                <Badge size="xs" variant="filled" color="blue" circle>
                  {incomingTickets.length}
                </Badge>
              ) : undefined
            }
          >
            {t('tickets.incoming')}
          </Tabs.Tab>
          <Tabs.Tab value="all">{t('tickets.allTickets')}</Tabs.Tab>
        </Tabs.List>

        {/* My tickets */}
        <Tabs.Panel value="my" pt="md">
          <Stack gap="sm">
            {myTickets.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">{t('tickets.noTickets')}</Text>
            ) : (
              myTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        {/* Incoming (unassigned open tickets) */}
        <Tabs.Panel value="incoming" pt="md">
          <Stack gap="sm">
            {incomingTickets.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">{t('tickets.noIncomingTickets')}</Text>
            ) : (
              incomingTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} showUser />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        {/* All tickets with filters */}
        <Tabs.Panel value="all" pt="md">
          <Stack gap="sm">
            <Group gap="sm">
              <TextInput
                placeholder={t('tickets.searchPlaceholder')}
                leftSection={<IconSearch size={14} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                leftSection={<IconFilter size={14} />}
                data={statusOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter((v ?? 'all') as TicketStatus | 'all')}
                w={160}
              />
            </Group>
            {filteredAll.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">{t('tickets.noActiveTickets')}</Text>
            ) : (
              filteredAll.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} showUser />
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <TicketCreateModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ticket) => setMyTickets((prev) => [ticket, ...prev])}
      />
    </Stack>
  );
}
