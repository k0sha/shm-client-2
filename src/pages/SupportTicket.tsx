import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Stack, Group, Text, ActionIcon, Textarea, Button,
  Paper, Box, Select, Badge, ScrollArea, Divider, Collapse, Table,
} from '@mantine/core';
import { IconArrowLeft, IconSend, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useComputedColorScheme } from '@mantine/core';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { MOCK_ALL_TICKETS } from '../data/mockTickets';
import type { Ticket, TicketMessage, TicketStatus } from '../data/mockTickets';
import { useStore } from '../store/useStore';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function MessageBubble({ msg, isOwn }: { msg: TicketMessage; isOwn: boolean }) {
  const scheme = useComputedColorScheme('light');

  return (
    <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box style={{ maxWidth: '72%' }}>
        {!isOwn && (
          <Text size="xs" c="dimmed" mb={2} ml={4}>
            {msg.isSpecialist ? '🛡 ' : ''}{msg.authorName}
          </Text>
        )}
        <Paper
          p="sm"
          radius="lg"
          style={{
            background: isOwn
              ? 'var(--mantine-color-blue-6)'
              : scheme === 'dark'
                ? 'var(--mantine-color-dark-5)'
                : 'var(--mantine-color-gray-1)',
            borderBottomRightRadius: isOwn ? 4 : undefined,
            borderBottomLeftRadius: !isOwn ? 4 : undefined,
          }}
        >
          <Text
            size="sm"
            style={{ color: isOwn ? 'white' : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {msg.text}
          </Text>
        </Paper>
        <Text size="xs" c="dimmed" mt={2} ta={isOwn ? 'right' : 'left'} mr={isOwn ? 4 : 0} ml={isOwn ? 0 : 4}>
          {formatTime(msg.createdAt)}
        </Text>
      </Box>
    </Box>
  );
}

function UserInfoPanel({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const info = ticket.userInfo;
  if (!info) return null;

  const statusColors: Record<string, string> = {
    ACTIVE: 'green',
    BLOCK: 'red',
    'NOT PAID': 'orange',
    PROGRESS: 'yellow',
    ERROR: 'red',
  };

  return (
    <Paper withBorder radius="md" p="sm">
      <Group
        justify="space-between"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <Group gap="xs">
          <Text size="sm" fw={600}>{t('tickets.userInfo')}</Text>
          <Text size="sm" c="dimmed">
            #{info.user_id}{info.fullName ? ` · ${info.fullName}` : ''} · {info.login2 && !info.login2.startsWith('@') ? info.login2 : info.login}
          </Text>
        </Group>
        <ActionIcon variant="subtle" size="sm">
          {open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </ActionIcon>
      </Group>

      <Collapse in={open}>
        <Divider my="xs" />
        <Stack gap="xs">
          <Group gap="xl">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">{t('tickets.userBalance')}</Text>
              <Text size="sm" fw={500}>{info.balance} ₽</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">{t('tickets.userDiscount')}</Text>
              <Text size="sm" fw={500}>{info.discount}%</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">{t('tickets.userCreated')}</Text>
              <Text size="sm" fw={500}>{formatDate(info.created)}</Text>
            </Stack>
            {info.login2 && (
              <Stack gap={2}>
                <Text size="xs" c="dimmed">{t('tickets.userLogin2')}</Text>
                <Text size="sm" fw={500}>{info.login}</Text>
              </Stack>
            )}
          </Group>

          {info.services.length > 0 && (
            <>
              <Text size="xs" c="dimmed" mt={4}>{t('tickets.userServices')}</Text>
              <Table fz="xs" withRowBorders={false} verticalSpacing={4}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('services.title').replace('Мои ', '')}</Table.Th>
                    <Table.Th>{t('services.status')}</Table.Th>
                    <Table.Th>{t('services.validUntil')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {info.services.map((svc) => (
                    <Table.Tr key={svc.user_service_id}>
                      <Table.Td>{svc.name}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={statusColors[svc.status] ?? 'gray'} variant="light">
                          {t(`status.${svc.status}`, { defaultValue: svc.status })}
                        </Badge>
                      </Table.Td>
                      <Table.Td c="dimmed">
                        {svc.expire ? formatDate(svc.expire) : '—'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
}

export default function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useStore();
  const isSpecialistView = location.pathname.startsWith('/tickets/');

  const [ticket, setTicket] = useState<Ticket | undefined>(
    MOCK_ALL_TICKETS.find((tk) => tk.id === ticketId)
  );
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [ticket?.messages.length]);

  if (!ticket) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">{t('tickets.ticketNotFound')}</Text>
        <Button variant="light" onClick={() => navigate('/support')}>{t('tickets.backToList')}</Button>
      </Stack>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  const handleSend = () => {
    if (!replyText.trim()) return;
    setSending(true);

    const newMsg: TicketMessage = {
      id: `m${Date.now()}`,
      authorId: user?.user_id ?? 1,
      authorName: user?.login ?? 'user',
      isSpecialist: isSpecialistView,
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated: Ticket = {
      ...ticket,
      messages: [...ticket.messages, newMsg],
      lastMessage: newMsg.text,
      updatedAt: newMsg.createdAt,
    };

    const idx = MOCK_ALL_TICKETS.findIndex((tk) => tk.id === ticket.id);
    if (idx !== -1) MOCK_ALL_TICKETS[idx] = updated;

    setTicket(updated);
    setReplyText('');
    setSending(false);
  };

  const handleStatusChange = (newStatus: string | null) => {
    if (!newStatus) return;
    const updated: Ticket = { ...ticket, status: newStatus as TicketStatus, updatedAt: new Date().toISOString() };
    const idx = MOCK_ALL_TICKETS.findIndex((tk) => tk.id === ticket.id);
    if (idx !== -1) MOCK_ALL_TICKETS[idx] = updated;
    setTicket(updated);
    notifications.show({ color: 'green', message: t('tickets.statusChanged') });
  };

  const handleTakeTicket = () => {
    const updated: Ticket = {
      ...ticket,
      status: 'in_progress',
      assignedTo: user?.login ?? 'specialist',
      updatedAt: new Date().toISOString(),
    };
    const idx = MOCK_ALL_TICKETS.findIndex((tk) => tk.id === ticket.id);
    if (idx !== -1) MOCK_ALL_TICKETS[idx] = updated;
    setTicket(updated);
    notifications.show({ color: 'green', message: t('tickets.takenIntoWork') });
  };

  const statusOptions = [
    { value: 'open', label: t('tickets.status.open') },
    { value: 'in_progress', label: t('tickets.status.in_progress') },
    { value: 'waiting', label: t('tickets.status.waiting') },
    { value: 'resolved', label: t('tickets.status.resolved') },
    { value: 'closed', label: t('tickets.status.closed') },
  ];

  const backPath = isSpecialistView ? '/tickets' : '/support';

  return (
    <Stack gap="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group gap="sm" wrap="nowrap">
        <ActionIcon variant="subtle" size="lg" onClick={() => navigate(backPath)}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} size="lg" truncate style={{ minWidth: 0 }}>{ticket.subject}</Text>
            <TicketStatusBadge status={ticket.status} />
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">#{ticket.id}</Text>
            <Text size="xs" c="dimmed">·</Text>
            <Badge size="xs" variant="outline" color="gray">
              {t(`tickets.ticketType.${ticket.type}`)}
            </Badge>
            {ticket.assignedTo && (
              <>
                <Text size="xs" c="dimmed">·</Text>
                <Text size="xs" c="dimmed">🛡 {ticket.assignedTo}</Text>
              </>
            )}
          </Group>
        </Stack>
      </Group>

      {/* User info panel — specialists only */}
      {isSpecialistView && <UserInfoPanel ticket={ticket} />}

      {/* Specialist actions */}
      {isSpecialistView && (
        <>
          <Divider />
          <Group gap="sm" wrap="wrap">
            {!ticket.assignedTo && ticket.status === 'open' && (
              <Button size="xs" variant="light" onClick={handleTakeTicket}>
                {t('tickets.takeIntoWork')}
              </Button>
            )}
            <Select
              size="xs"
              placeholder={t('tickets.changeStatus')}
              data={statusOptions}
              value={ticket.status}
              onChange={handleStatusChange}
              w={160}
            />
          </Group>
          <Divider />
        </>
      )}

      {/* Chat */}
      <ScrollArea flex={1} viewportRef={scrollRef} style={{ minHeight: 300 }}>
        <Stack gap="sm" p="xs">
          {ticket.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.authorId === (user?.user_id ?? 1)}
            />
          ))}
          {isClosed && (
            <Text size="xs" c="dimmed" ta="center" py="xs">
              {t('tickets.ticketClosedInfo')}
            </Text>
          )}
        </Stack>
      </ScrollArea>

      {/* Reply */}
      {!isClosed && (
        <Paper withBorder p="sm" radius="md">
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder={t('tickets.messagePlaceholder')}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ flex: 1 }}
              minRows={2}
              autosize
              maxRows={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <ActionIcon
              size="lg"
              variant="filled"
              onClick={handleSend}
              loading={sending}
              disabled={!replyText.trim()}
            >
              <IconSend size={16} />
            </ActionIcon>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>{t('tickets.enterToSend')}</Text>
        </Paper>
      )}
    </Stack>
  );
}
