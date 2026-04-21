import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Title, Tabs, Text, Paper, Badge,
  ActionIcon, TextInput,
} from '@mantine/core';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { MOCK_ALL_TICKETS } from '../data/mockTickets';
import type { Ticket, TicketStatus } from '../data/mockTickets';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function displayLogin(ticket: Ticket): string {
  // Prefer login2 if it looks like an email (more readable), otherwise use login
  if (ticket.userLogin2 && ticket.userLogin2.includes('@') && !ticket.userLogin2.startsWith('@')) {
    return ticket.userLogin2;
  }
  return ticket.userLogin;
}

function TicketRow({ ticket }: { ticket: Ticket }) {
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
            {ticket.unread && (
              <Badge size="xs" variant="filled" color="blue" circle style={{ flexShrink: 0 }}>·</Badge>
            )}
            <Text fw={500} size="sm" truncate>{ticket.subject}</Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <TicketStatusBadge status={ticket.status} />
            <Badge variant="outline" size="xs" color="gray">
              {t(`tickets.ticketType.${ticket.type}`)}
            </Badge>
            <Text size="xs" c="dimmed">
              #{ticket.userInfo?.user_id ?? ticket.userId} · {displayLogin(ticket)}
            </Text>
            {ticket.assignedTo && (
              <Text size="xs" c="dimmed">🛡 {ticket.assignedTo}</Text>
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

function TicketList({ tickets }: { tickets: Ticket[] }) {
  const { t } = useTranslation();
  if (tickets.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">{t('tickets.noActiveTickets')}</Text>;
  }
  return (
    <Stack gap="sm">
      {tickets.map((tk) => <TicketRow key={tk.id} ticket={tk} />)}
    </Stack>
  );
}

export default function Tickets() {
  const { t } = useTranslation();
  const [allTickets] = useState<Ticket[]>([...MOCK_ALL_TICKETS]);
  const [search, setSearch] = useState('');

  function filter(statuses?: TicketStatus[]): Ticket[] {
    return allTickets.filter((tk) => {
      const matchesStatus = !statuses || statuses.includes(tk.status);
      const q = search.toLowerCase();
      const matchesSearch = !q
        || tk.subject.toLowerCase().includes(q)
        || tk.userLogin.toLowerCase().includes(q)
        || (tk.userLogin2 ?? '').toLowerCase().includes(q)
        || String(tk.userId).includes(q);
      return matchesStatus && matchesSearch;
    });
  }

  const newCount = allTickets.filter((tk) => tk.status === 'open' && !tk.assignedTo).length;

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
          <Tabs.Tab
            value="all"
            rightSection={
              newCount > 0 ? (
                <Badge size="xs" variant="filled" color="red" circle>{newCount}</Badge>
              ) : undefined
            }
          >
            {t('tickets.tabAll')}
          </Tabs.Tab>
          <Tabs.Tab value="in_progress">{t('tickets.status.in_progress')}</Tabs.Tab>
          <Tabs.Tab value="resolved">{t('tickets.status.resolved')}</Tabs.Tab>
          <Tabs.Tab value="closed">{t('tickets.status.closed')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md">
          <TicketList tickets={filter()} />
        </Tabs.Panel>
        <Tabs.Panel value="in_progress" pt="md">
          <TicketList tickets={filter(['in_progress', 'waiting'])} />
        </Tabs.Panel>
        <Tabs.Panel value="resolved" pt="md">
          <TicketList tickets={filter(['resolved'])} />
        </Tabs.Panel>
        <Tabs.Panel value="closed" pt="md">
          <TicketList tickets={filter(['closed'])} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
